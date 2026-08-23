import assert from "node:assert/strict";
import test from "node:test";

async function render(pathname = "/", authenticated = false) {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}-${pathname}`);
  const { default: worker } = await import(workerUrl.href);
  const headers = { accept: "text/html" };
  if (authenticated) headers["oai-authenticated-user-email"] = "owner@example.com";
  return worker.fetch(new Request(`http://localhost${pathname}`, { headers }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
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
});

test("renders the stakeholder workspace route", async () => {
  const response = await render("/workspace", true);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /Stakeholder Workspace \| B-SCAN Connect/i);
  assert.match(html, /Switch stakeholder role/i);
  assert.match(html, /Recommended next actions/i);
  assert.doesNotMatch(html, /Connected course of action/i);
  assert.doesNotMatch(html, /demo|prototype|demonstration|fictional/i);
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
