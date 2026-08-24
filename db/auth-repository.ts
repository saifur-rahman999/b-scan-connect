import { getRawDb } from ".";
import { createPasswordCredential, verifyPassword } from "./passwords";

export const SESSION_COOKIE = "bscan_session";
const SESSION_SECONDS = 60 * 60 * 12;

export class AuthError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}

const clean = (value: unknown, limit: number) => String(value ?? "").trim().slice(0, limit);
const emailValue = (value: unknown) => clean(value, 190).toLowerCase();

function randomToken() {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function tokenHash(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

function validatePassword(value: unknown) {
  const password = String(value ?? "");
  if (password.length < 8 || password.length > 128) throw new AuthError("Use a password between 8 and 128 characters.");
  return password;
}

async function createSession(userId: string) {
  const token = randomToken();
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  await getRawDb().prepare("INSERT INTO user_sessions (id,user_id,token_hash,expires_at) VALUES (?,?,?,?)")
    .bind(crypto.randomUUID(), userId, await tokenHash(token), expiresAt).run();
  return { token, expiresAt };
}

export async function registerMember(input: { displayName?: unknown; email?: unknown; password?: unknown }) {
  const displayName = clean(input.displayName, 120);
  const email = emailValue(input.email);
  const password = validatePassword(input.password);
  if (displayName.length < 2) throw new AuthError("Enter your full name.");
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new AuthError("Enter a valid email address.");
  const id = crypto.randomUUID();
  const credential = await createPasswordCredential(password);
  try {
    await getRawDb().batch([
      getRawDb().prepare("INSERT INTO users (id,email,display_name,role,status,password_hash,password_salt) VALUES (?,?,?,'PWD_USER','ACTIVE',?,?)").bind(id,email,displayName,credential.passwordHash,credential.passwordSalt),
      getRawDb().prepare("INSERT INTO pwd_profiles (id,user_id) VALUES (?,?)").bind(crypto.randomUUID(),id),
      getRawDb().prepare("INSERT INTO activity_logs (id,actor_id,action,entity_type,entity_id,summary) VALUES (?,?,'ACCOUNT_REGISTERED','USER',?,'Member account registered')").bind(crypto.randomUUID(),id,id),
    ]);
  } catch { throw new AuthError("An account already uses that email address.", 409); }
  return { ...(await createSession(id)), user: { id, email, displayName, role: "PWD_USER" as const } };
}

export async function loginWithPassword(input: { email?: unknown; password?: unknown }) {
  const email = emailValue(input.email);
  const password = String(input.password ?? "");
  const user = await getRawDb().prepare("SELECT id,email,display_name,role,status,password_hash,password_salt FROM users WHERE lower(email)=? LIMIT 1")
    .bind(email).first<{id:string;email:string;display_name:string;role:"PWD_USER"|"ADMIN"|"REFERRAL_OFFICER"|"ORG_REP";status:string;password_hash:string|null;password_salt:string|null}>();
  const valid = user?.password_hash && user.password_salt ? await verifyPassword(password,user.password_hash,user.password_salt) : false;
  if (!user || !valid) throw new AuthError("Email or password is incorrect.", 401);
  if (user.status !== "ACTIVE") throw new AuthError("This account is not active. Contact an administrator.", 403);
  await getRawDb().prepare("DELETE FROM user_sessions WHERE user_id=? AND expires_at<=unixepoch()").bind(user.id).run();
  return { ...(await createSession(user.id)), user: { id:user.id,email:user.email,displayName:user.display_name,role:user.role } };
}

export async function getSessionIdentity(cookieHeader: string | null) {
  const token = cookieHeader?.split(";").map((part)=>part.trim().split("=")).find(([name])=>name===SESSION_COOKIE)?.[1];
  if (!token) return null;
  const row = await getRawDb().prepare(`SELECT u.email,u.display_name FROM user_sessions s JOIN users u ON u.id=s.user_id
    WHERE s.token_hash=? AND s.expires_at>unixepoch() AND u.status='ACTIVE' LIMIT 1`).bind(await tokenHash(token)).first<{email:string;display_name:string}>();
  return row ? { email:row.email, displayName:row.display_name, fullName:row.display_name } : null;
}

export async function revokeSession(cookieHeader: string | null) {
  const token = cookieHeader?.split(";").map((part)=>part.trim().split("=")).find(([name])=>name===SESSION_COOKIE)?.[1];
  if (token) await getRawDb().prepare("DELETE FROM user_sessions WHERE token_hash=?").bind(await tokenHash(token)).run();
}

export function sessionCookie(token: string, expiresAt: number) {
  return `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Expires=${new Date(expiresAt*1000).toUTCString()}`;
}

export function clearSessionCookie() { return `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`; }
export { createPasswordCredential, validatePassword };
