import { getRawDb } from ".";
import { CatalogError, type Actor } from "./catalog-repository";

export type AdminUser = {
  id: string; email: string; displayName: string; role: Actor["role"];
  status: "ACTIVE" | "SUSPENDED" | "DEACTIVATED" | "ARCHIVED";
  referrals: number; applications: number; organizations: number; createdAt: string;
};

export type AdminOrganization = {
  id: string; name: string; slug: string;
  type: "SERVICE_PROVIDER" | "EMPLOYER" | "EDUCATION_PROVIDER" | "TRAINING_PROVIDER";
  description: string; coverageAreas: string[]; contactEmail: string; contactPhone: string;
  website: string; accessibilityInfo: string;
  status: "DRAFT" | "SUBMITTED" | "CHANGES_REQUESTED" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
  representatives: { id: string; displayName: string; email: string; title: string }[];
  listings: number; referrals: number; applications: number; updatedAt: string;
};

export function requireAdmin(actor: Actor) {
  if (actor.role !== "ADMIN") throw new CatalogError("Administrator access is required.", 403);
}

const clean = (value: unknown, limit = 500) => String(value ?? "").trim().slice(0, limit);
const slugify = (value: string) => value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 55);

export async function listAdminUsers(actor: Actor): Promise<AdminUser[]> {
  requireAdmin(actor);
  const rows = await getRawDb().prepare(`SELECT u.id,u.email,u.display_name,u.role,u.status,u.created_at,
    (SELECT COUNT(*) FROM referrals r WHERE r.user_id=u.id) AS referrals,
    (SELECT COUNT(*) FROM applications a WHERE a.user_id=u.id) AS applications,
    (SELECT COUNT(*) FROM organization_memberships m WHERE m.user_id=u.id) AS organizations
    FROM users u ORDER BY CASE u.status WHEN 'ACTIVE' THEN 0 ELSE 1 END,u.created_at DESC`)
    .all<{ id:string; email:string; display_name:string; role:Actor["role"]; status:AdminUser["status"]; created_at:string; referrals:number; applications:number; organizations:number }>();
  return rows.results.map((row: { id:string; email:string; display_name:string; role:Actor["role"]; status:AdminUser["status"]; created_at:string; referrals:number; applications:number; organizations:number }) => ({ id:row.id,email:row.email,displayName:row.display_name,role:row.role,status:row.status,referrals:Number(row.referrals),applications:Number(row.applications),organizations:Number(row.organizations),createdAt:row.created_at }));
}

export async function createAdminUser(actor: Actor, input: { email?:unknown; displayName?:unknown; role?:unknown }) {
  requireAdmin(actor);
  const email = clean(input.email, 190).toLowerCase();
  const displayName = clean(input.displayName, 120);
  const role = clean(input.role) as Actor["role"];
  if (!/^\S+@\S+\.\S+$/.test(email) || displayName.length < 2 || !["PWD_USER","ADMIN","REFERRAL_OFFICER","ORG_REP"].includes(role)) throw new CatalogError("Enter a valid name, email and workspace role.", 400);
  const id = crypto.randomUUID();
  try {
    await getRawDb().batch([
      getRawDb().prepare("INSERT INTO users (id,email,display_name,role,status) VALUES (?,?,?,?,'ACTIVE')").bind(id,email,displayName,role),
      getRawDb().prepare("INSERT INTO activity_logs (id,actor_id,action,entity_type,entity_id,summary) VALUES (?,?,'USER_CREATED','USER',?,?)").bind(crypto.randomUUID(),actor.id,id,`${displayName} added as ${role}`),
    ]);
  } catch { throw new CatalogError("That email is already assigned to a workspace account.", 409); }
  return { id };
}

export async function updateAdminUser(actor: Actor, id: string, input: { role?:unknown; status?:unknown }) {
  requireAdmin(actor);
  const current = await getRawDb().prepare("SELECT display_name,role,status FROM users WHERE id=? LIMIT 1").bind(id).first<{display_name:string;role:Actor["role"];status:AdminUser["status"]}>();
  if (!current) throw new CatalogError("User not found.", 404);
  const role = clean(input.role) as Actor["role"] || current.role;
  const status = clean(input.status) as AdminUser["status"] || current.status;
  if (!["PWD_USER","ADMIN","REFERRAL_OFFICER","ORG_REP"].includes(role) || !["ACTIVE","SUSPENDED","DEACTIVATED","ARCHIVED"].includes(status)) throw new CatalogError("Choose a valid role and account status.", 400);
  if (id === actor.id && (role !== "ADMIN" || status !== "ACTIVE")) throw new CatalogError("You cannot remove your own administrator access.", 409);
  await getRawDb().batch([
    getRawDb().prepare("UPDATE users SET role=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(role,status,id),
    getRawDb().prepare("INSERT INTO activity_logs (id,actor_id,action,entity_type,entity_id,summary) VALUES (?,?,'USER_UPDATED','USER',?,?)").bind(crypto.randomUUID(),actor.id,id,`${current.display_name}: ${role}, ${status}`),
  ]);
  return { id, role, status };
}

type OrganizationRow = { id:string; name:string; slug:string; type:AdminOrganization["type"]; description:string; website:string; status:AdminOrganization["status"]; coverage_areas:string; contact_email:string|null; contact_phone:string|null; accessibility_info:string|null; updated_at:string; representatives_json:string|null; listings:number; referrals:number; applications:number };
export async function listAdminOrganizations(actor: Actor): Promise<AdminOrganization[]> {
  requireAdmin(actor);
  const rows = await getRawDb().prepare(`SELECT o.*,
    (SELECT COUNT(*) FROM catalog_listings c WHERE c.organization_id=o.id) AS listings,
    (SELECT COUNT(*) FROM referrals r WHERE r.organization_id=o.id) AS referrals,
    (SELECT COUNT(*) FROM applications a WHERE a.organization_id=o.id) AS applications,
    (SELECT json_group_array(json_object('id',u.id,'displayName',u.display_name,'email',u.email,'title',COALESCE(m.title,''))) FROM organization_memberships m JOIN users u ON u.id=m.user_id WHERE m.organization_id=o.id) AS representatives_json
    FROM organizations o ORDER BY CASE o.status WHEN 'PUBLISHED' THEN 0 ELSE 1 END,o.updated_at DESC`)
    .all<OrganizationRow>();
  return rows.results.map((row:OrganizationRow) => ({ id:row.id,name:row.name,slug:row.slug,type:row.type,description:row.description,website:row.website??"",status:row.status,coverageAreas: JSON.parse(row.coverage_areas || "[]"), contactEmail:row.contact_email??"", contactPhone:row.contact_phone??"", accessibilityInfo:row.accessibility_info??"", representatives:JSON.parse(row.representatives_json || "[]"), listings:Number(row.listings),referrals:Number(row.referrals),applications:Number(row.applications),updatedAt:row.updated_at }));
}

export async function createAdminOrganization(actor: Actor, input: Record<string,unknown>) {
  requireAdmin(actor);
  const name=clean(input.name,160), description=clean(input.description,2000), type=clean(input.type) as AdminOrganization["type"];
  if (name.length < 2 || description.length < 20 || !["SERVICE_PROVIDER","EMPLOYER","EDUCATION_PROVIDER","TRAINING_PROVIDER"].includes(type)) throw new CatalogError("Enter an organization name, type and useful description.",400);
  const id=crypto.randomUUID(), slug=`${slugify(name)}-${id.slice(0,6)}`;
  const areas=Array.isArray(input.coverageAreas)?input.coverageAreas.map((v)=>clean(v,80)).filter(Boolean):clean(input.coverageAreas,500).split(",").map((v)=>v.trim()).filter(Boolean);
  await getRawDb().batch([
    getRawDb().prepare(`INSERT INTO organizations (id,name,slug,type,description,coverage_areas,contact_email,contact_phone,website,accessibility_info,status) VALUES (?,?,?,?,?,?,?,?,?,?,'DRAFT')`).bind(id,name,slug,type,description,JSON.stringify(areas),clean(input.contactEmail,190)||null,clean(input.contactPhone,60)||null,clean(input.website,300)||null,clean(input.accessibilityInfo,1200)||null),
    getRawDb().prepare("INSERT INTO activity_logs (id,actor_id,action,entity_type,entity_id,summary) VALUES (?,?,'ORGANIZATION_CREATED','ORGANIZATION',?,?)").bind(crypto.randomUUID(),actor.id,id,`${name} added`),
  ]);
  return {id,slug};
}

export async function updateAdminOrganization(actor:Actor,id:string,input:Record<string,unknown>) {
  requireAdmin(actor);
  const current=await getRawDb().prepare("SELECT name,status FROM organizations WHERE id=?").bind(id).first<{name:string;status:AdminOrganization["status"]}>();
  if(!current) throw new CatalogError("Organization not found.",404);
  const status=(clean(input.status) as AdminOrganization["status"])||current.status;
  if(!["DRAFT","SUBMITTED","CHANGES_REQUESTED","PUBLISHED","CLOSED","ARCHIVED"].includes(status)) throw new CatalogError("Choose a valid organization status.",400);
  await getRawDb().batch([
    getRawDb().prepare("UPDATE organizations SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(status,id),
    getRawDb().prepare("INSERT INTO activity_logs (id,actor_id,action,entity_type,entity_id,summary) VALUES (?,?,'ORGANIZATION_UPDATED','ORGANIZATION',?,?)").bind(crypto.randomUUID(),actor.id,id,`${current.name}: ${status}`),
  ]);
  return {id,status};
}

export async function setOrganizationRepresentative(actor:Actor,organizationId:string,input:{userId?:unknown;title?:unknown;action?:unknown}) {
  requireAdmin(actor);
  const userId=clean(input.userId,80), action=clean(input.action)||"ASSIGN", title=clean(input.title,120);
  const rep=await getRawDb().prepare("SELECT display_name FROM users WHERE id=? AND role='ORG_REP' AND status='ACTIVE'").bind(userId).first<{display_name:string}>();
  if(!rep) throw new CatalogError("Choose an active organization representative.",400);
  if(action==="REMOVE") await getRawDb().prepare("DELETE FROM organization_memberships WHERE user_id=? AND organization_id=?").bind(userId,organizationId).run();
  else await getRawDb().prepare(`INSERT INTO organization_memberships (id,user_id,organization_id,title) VALUES (?,?,?,?) ON CONFLICT(user_id,organization_id) DO UPDATE SET title=excluded.title,updated_at=CURRENT_TIMESTAMP`).bind(crypto.randomUUID(),userId,organizationId,title||null).run();
  await getRawDb().prepare("INSERT INTO activity_logs (id,actor_id,action,entity_type,entity_id,summary) VALUES (?,?,?,?,?,?)").bind(crypto.randomUUID(),actor.id,`ORGANIZATION_REP_${action}`,"ORGANIZATION",organizationId,`${rep.display_name}: ${action.toLowerCase()}`).run();
  return {organizationId,userId,action};
}

async function count(query:string) { const row=await getRawDb().prepare(query).first<{total:number}>(); return Number(row?.total??0); }
export async function getAdminAnalytics(actor:Actor) {
  requireAdmin(actor);
  const [users,organizations,listings,referrals,applications,feedback,saved]=await Promise.all([
    count("SELECT COUNT(*) total FROM users WHERE status='ACTIVE'"),count("SELECT COUNT(*) total FROM organizations WHERE status='PUBLISHED'"),count("SELECT COUNT(*) total FROM catalog_listings WHERE status='PUBLISHED'"),count("SELECT COUNT(*) total FROM referrals WHERE status NOT IN ('COMPLETED','CANCELLED')"),count("SELECT COUNT(*) total FROM applications WHERE stage NOT IN ('REJECTED','WITHDRAWN')"),count("SELECT COUNT(*) total FROM feedback_reports WHERE status NOT IN ('RESOLVED','ARCHIVED')"),count("SELECT COUNT(*) total FROM saved_items")
  ]);
  const activity=await getRawDb().prepare("SELECT action,entity_type,summary,created_at FROM activity_logs ORDER BY created_at DESC LIMIT 8").all<{action:string;entity_type:string;summary:string;created_at:string}>();
  const roles=await getRawDb().prepare("SELECT role label,COUNT(*) value FROM users WHERE status='ACTIVE' GROUP BY role ORDER BY value DESC").all<{label:string;value:number}>();
  const referralStages=await getRawDb().prepare("SELECT status label,COUNT(*) value FROM referrals GROUP BY status ORDER BY value DESC").all<{label:string;value:number}>();
  const applicationStages=await getRawDb().prepare("SELECT stage label,COUNT(*) value FROM applications GROUP BY stage ORDER BY value DESC").all<{label:string;value:number}>();
  return {totals:{users,organizations,listings,referrals,applications,feedback,saved},roles:roles.results as {label:string;value:number}[],referralStages:referralStages.results as {label:string;value:number}[],applicationStages:applicationStages.results as {label:string;value:number}[],activity:activity.results as {action:string;entity_type:string;summary:string;created_at:string}[]};
}
