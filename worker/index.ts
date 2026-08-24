/** Cloudflare Worker entry point for the vinext-starter template. */
import { handleImageOptimization, DEFAULT_DEVICE_SIZES, DEFAULT_IMAGE_SIZES } from "vinext/server/image-optimization";
import handler from "vinext/server/app-router-entry";

interface Env {
  ASSETS: Fetcher;
  DB: D1Database;
  IMAGES: {
    input(stream: ReadableStream): {
      transform(options: Record<string, unknown>): {
        output(options: { format: string; quality: number }): Promise<{ response(): Response }>;
      };
    };
  };
}

interface ExecutionContext {
  waitUntil(promise: Promise<unknown>): void;
  passThroughOnException(): void;
}

const MAX_MUTATION_BYTES = 64 * 1024;
const MUTATION_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

function jsonError(status: number, error: string, requestId: string, extraHeaders: Record<string,string> = {}) {
  return Response.json({ error, requestId }, { status, headers: { "Cache-Control": "no-store", "X-Request-ID": requestId, ...extraHeaders } });
}

function routeScope(pathname: string) {
  if (pathname.startsWith("/api/auth/")) return "/api/auth";
  if (pathname.startsWith("/api/admin/")) return "/api/admin";
  if (pathname.includes("/messages")) return "/api/messages";
  if (pathname.startsWith("/api/feedback")) return "/api/feedback";
  return pathname.split("/").slice(0, 3).join("/") || "/api";
}

function scopeLimit(scope: string) {
  if (scope === "/api/auth") return 8;
  if (scope === "/api/messages" || scope === "/api/feedback") return 10;
  if (scope === "/api/admin") return 20;
  return 30;
}

async function hashSubject(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function protectMutation(request: Request, env: Env, ctx: ExecutionContext, requestId: string) {
  const url = new URL(request.url);
  if (!url.pathname.startsWith("/api/") || !MUTATION_METHODS.has(request.method)) return null;

  const fetchSite = request.headers.get("sec-fetch-site");
  if (fetchSite === "cross-site") return jsonError(403, "Cross-site requests are not allowed.", requestId);
  const origin = request.headers.get("origin");
  if (origin) {
    try {
      if (new URL(origin).origin !== url.origin) return jsonError(403, "Request origin was not accepted.", requestId);
    } catch {
      return jsonError(403, "Request origin was not accepted.", requestId);
    }
  }

  if (["POST", "PUT", "PATCH"].includes(request.method) && request.body !== null) {
    const contentType = request.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase();
    if (contentType !== "application/json") return jsonError(415, "This endpoint accepts JSON requests only.", requestId);
  }
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (Number.isFinite(contentLength) && contentLength > MAX_MUTATION_BYTES) return jsonError(413, "Request body is too large.", requestId);

  const subject = request.headers.get("oai-authenticated-user-email")?.toLowerCase()
    || request.headers.get("cf-connecting-ip")
    || "anonymous";
  const subjectHash = await hashSubject(subject);
  const scope = routeScope(url.pathname);
  const windowStartedAt = Math.floor(Date.now() / 60000);
  const bucketId = `${subjectHash}:${scope}:${windowStartedAt}`;
  const row = await env.DB.prepare(`INSERT INTO request_rate_limits
    (id,subject_hash,route_scope,window_started_at,request_count,updated_at)
    VALUES (?,?,?,?,1,CURRENT_TIMESTAMP)
    ON CONFLICT(id) DO UPDATE SET request_count=request_count+1,updated_at=CURRENT_TIMESTAMP
    RETURNING request_count`).bind(bucketId,subjectHash,scope,windowStartedAt).first<{request_count:number}>();
  const count = Number(row?.request_count ?? 1);
  const limit = scopeLimit(scope);
  if (count === 1 && windowStartedAt % 60 === 0) {
    ctx.waitUntil(env.DB.prepare("DELETE FROM request_rate_limits WHERE window_started_at < ?").bind(windowStartedAt - 1440).run());
  }
  if (count > limit) {
    if (count === limit + 1) {
      ctx.waitUntil(env.DB.prepare(`INSERT INTO activity_logs (id,actor_id,action,entity_type,entity_id,summary)
        SELECT ?,u.id,'RATE_LIMITED','SECURITY',NULL,? FROM users u WHERE lower(u.email)=? LIMIT 1`)
        .bind(crypto.randomUUID(),`${scope}: mutation limit exceeded`,subject.toLowerCase()).run());
    }
    return jsonError(429, "Too many requests. Wait a minute and try again.", requestId, { "Retry-After": "60" });
  }
  return null;
}

function appendVary(headers: Headers, value: string) {
  const current = headers.get("Vary");
  const values = new Set((current ? current.split(",") : []).map((entry) => entry.trim()).filter(Boolean));
  values.add(value);
  headers.set("Vary", [...values].join(", "));
}

function secureResponse(request: Request, response: Response, requestId: string) {
  const headers = new Headers(response.headers);
  headers.set("X-Request-ID", headers.get("X-Request-ID") ?? requestId);
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("X-Frame-Options", "DENY");
  headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=(), payment=(), usb=()");
  headers.set("Cross-Origin-Opener-Policy", "same-origin");
  headers.set("Cross-Origin-Resource-Policy", "same-origin");
  headers.set("Content-Security-Policy", "default-src 'self'; base-uri 'self'; object-src 'none'; frame-ancestors 'none'; form-action 'self'; img-src 'self' data: blob:; font-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'");
  if (new URL(request.url).protocol === "https:") headers.set("Strict-Transport-Security", "max-age=31536000; includeSubDomains");
  const pathname = new URL(request.url).pathname;
  if (pathname.startsWith("/workspace") || (pathname.startsWith("/api/") && pathname !== "/api/catalog")) {
    headers.set("Cache-Control", "private, no-store");
    appendVary(headers, "oai-authenticated-user-email");
  }
  return new Response(response.body, { status: response.status, statusText: response.statusText, headers });
}

// Image security config. SVG sources with .svg extension auto-skip the
// optimization endpoint on the client side (served directly, no proxy).
// To route SVGs through the optimizer (with security headers), set
// dangerouslyAllowSVG: true in next.config.js and uncomment below:
// const imageConfig: ImageConfig = { dangerouslyAllowSVG: true };

const worker = {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const requestId = crypto.randomUUID();

    const blocked = await protectMutation(request, env, ctx, requestId);
    if (blocked) return secureResponse(request, blocked, requestId);

    if (url.pathname === "/_vinext/image") {
      const allowedWidths = [...DEFAULT_DEVICE_SIZES, ...DEFAULT_IMAGE_SIZES];
      const response = await handleImageOptimization(request, {
        fetchAsset: (path) => env.ASSETS.fetch(new Request(new URL(path, request.url))),
        transformImage: async (body, { width, format, quality }) => {
          const result = await env.IMAGES.input(body).transform(width > 0 ? { width } : {}).output({ format, quality });
          return result.response();
        },
      }, allowedWidths);
      return secureResponse(request, response, requestId);
    }

    const response = await handler.fetch(request, env, ctx);
    return secureResponse(request, response, requestId);
  },
};

export default worker;
