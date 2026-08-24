import assert from "node:assert/strict";
import test from "node:test";

async function dispatch(pathname = "/", init = {}, bindings = {}) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  const env = {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
    ...bindings,
  };
  globalThis.__testCloudflareEnv = env;
  return worker.fetch(new Request(`http://localhost${pathname}`, init), env, { waitUntil() {}, passThroughOnException() {} });
}

async function render(pathname = "/", authenticated = false, bindings = {}) {
  const headers = { accept: "text/html" };
  if (authenticated) headers["oai-authenticated-user-email"] = "owner@example.com";
  return dispatch(pathname, { headers }, bindings);
}

function actorDb(role, displayName) {
  return {
    prepare(sql) {
      return {
        bind() {
          return {
            first: async () => sql.includes("FROM users") ? { id: `${role.toLowerCase()}-1`, email: "owner@example.com", display_name: displayName, role } : null,
            run: async () => ({ success: true, meta: { changes: 0 } }),
          };
        },
      };
    },
  };
}

test("renders the product landing page", async () => {
  const response = await render("/");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>B-SCAN Connect<\/title>/i);
  assert.match(html, /Find the support and opportunities/i);
  assert.doesNotMatch(html, /All people, organizations and opportunities shown/i);
  assert.doesNotMatch(html, /demo|prototype|demonstration|fictional/i);
  assert.doesNotMatch(html, /Starter Project/i);
  assert.equal(response.headers.get("x-frame-options"), "DENY");
  assert.equal(response.headers.get("x-content-type-options"), "nosniff");
  assert.match(response.headers.get("content-security-policy") ?? "", /frame-ancestors 'none'/i);
  assert.match(response.headers.get("permissions-policy") ?? "", /camera=\(\)/i);
  assert.match(response.headers.get("x-request-id") ?? "", /^[0-9a-f-]{36}$/i);
});

test("binds the member workspace to the authenticated account role", async () => {
  const response = await render("/workspace", true, { DB: actorDb("PWD_USER", "Nadia Sultana") });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Stakeholder Workspace \| B-SCAN Connect/i);
  assert.match(html, /Signed in as/i);
  assert.match(html, /PwD user/i);
  assert.match(html, /Welcome, Nadia/i);
  assert.match(html, /Recommended next actions/i);
  assert.match(html, /href="\/workspace\/feedback"/i);
  assert.doesNotMatch(html, /Switch stakeholder role/i);
  assert.doesNotMatch(html, /Open approval queue/i);
  assert.doesNotMatch(html, /Connected course of action/i);
  assert.doesNotMatch(html, /demo|prototype|demonstration|fictional/i);
});

test("renders administrator navigation only for an administrator account", async () => {
  const response = await render("/workspace", true, { DB: actorDb("ADMIN", "Zulkarnine Khan") });
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /B-SCAN administrator/i);
  assert.match(html, /href="\/workspace\/admin\/users"/i);
  assert.match(html, /Open approval queue/i);
  assert.doesNotMatch(html, /Switch stakeholder role/i);
  assert.doesNotMatch(html, /Complete my profile/i);
});

test("binds staff workspaces to their assigned account roles", async () => {
  for (const [role, label] of [["REFERRAL_OFFICER", "Referral officer"], ["ORG_REP", "Organization representative"]]) {
    const response = await render("/workspace", true, { DB: actorDb(role, "Assigned Staff") });
    assert.equal(response.status, 200);
    const html = await response.text();
    assert.match(html, new RegExp(label, "i"));
    assert.doesNotMatch(html, /Switch stakeholder role/i);
    assert.doesNotMatch(html, /Complete my profile/i);
  }
});

test("renders the discovery catalogue", async () => {
  const response = await render("/discover");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Find support and opportunities/i);
  assert.match(html, /Filter listings/i);
  assert.match(html, /Reviewed listings/i);
});

test("renders a listing detail page", async () => {
  const response = await render("/discover/accessible-digital-skills-bootcamp");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Accessible Digital Skills Bootcamp/i);
  assert.match(html, /Accessibility and adjustments/i);
});

test("starts the application journey from an opportunity", async () => {
  const response = await render("/discover/junior-customer-support-associate");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Junior Customer Support Associate/i);
  assert.match(html, /Start application/i);
  assert.match(html, /\/workspace\/applications\/new\?listing=junior-customer-support-associate/i);
});

test("publishes privacy and terms information", async () => {
  const privacy = await render("/privacy");
  assert.equal(privacy.status, 200);
  assert.match(await privacy.text(), /Your information and choices/i);
  const terms = await render("/terms");
  assert.equal(terms.status, 200);
  assert.match(await terms.text(), /Using B-SCAN Connect/i);
});

test("blocks unsafe cross-site mutations before application code", async () => {
  const response = await dispatch("/api/profile", {
    method: "PUT",
    headers: { "content-type": "application/json", origin: "https://malicious.invalid", "sec-fetch-site": "cross-site" },
    body: "{}",
  });
  assert.equal(response.status, 403);
  assert.match((await response.json()).error, /cross-site/i);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
});

test("rejects oversized and incorrectly formatted mutations", async () => {
  const oversized = await dispatch("/api/profile", { method: "PUT", headers: { "content-type": "application/json", "content-length": "70000" }, body: "{}" });
  assert.equal(oversized.status, 413);
  const wrongType = await dispatch("/api/profile", { method: "PUT", headers: { "content-type": "text/plain" }, body: "{}" });
  assert.equal(wrongType.status, 415);
});

test("limits repeated mutations with a distributed counter", async () => {
  const DB = { prepare() { return { bind() { return { first: async () => ({ request_count: 31 }), run: async () => ({ success: true }) }; } }; } };
  const response = await dispatch("/api/profile", {
    method: "PUT",
    headers: { "content-type": "application/json", "oai-authenticated-user-email": "owner@example.com" },
    body: "{}",
  }, { DB });
  assert.equal(response.status, 429);
  assert.equal(response.headers.get("retry-after"), "60");
});
