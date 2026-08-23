import { getRawDb } from ".";
import { catalogItems, type CatalogItem, type CatalogKind } from "../data/catalog";
import { getChatGPTUser } from "../app/chatgpt-auth";
import { resolveCatalogTransition, type ActorRole, type CatalogAction, type CatalogStatus } from "./catalog-workflow";

export type Actor = { id: string; email: string; displayName: string; role: ActorRole };
export type CatalogRow = {
  id: string;
  reference: string;
  slug: string;
  kind: CatalogKind;
  title: string;
  organization_name: string;
  district: string;
  division: string;
  delivery_mode: CatalogItem["deliveryMode"];
  summary: string;
  description: string;
  category: string;
  deadline: string | null;
  salary: string | null;
  accessibility: string;
  eligibility: string;
  contact: string;
  featured: number;
  status: CatalogStatus;
  submitted_at: string | null;
  updated_at: string;
  created_by_id: string | null;
};

function parseList(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

export function mapCatalogRow(row: CatalogRow): CatalogItem {
  return {
    id: row.id,
    reference: row.reference,
    slug: row.slug,
    kind: row.kind,
    title: row.title,
    organization: row.organization_name,
    district: row.district,
    division: row.division,
    deliveryMode: row.delivery_mode,
    summary: row.summary,
    description: row.description,
    deadline: row.deadline ?? undefined,
    category: row.category,
    accessibility: parseList(row.accessibility),
    eligibility: parseList(row.eligibility),
    contact: row.contact,
    featured: Boolean(row.featured),
    salary: row.salary ?? undefined,
    status: row.status,
    submittedAt: row.submitted_at ?? undefined,
    updatedAt: row.updated_at,
  };
}

export async function ensureCatalogSeeded() {
  const d1 = getRawDb();
  const statements = catalogItems.map((item, index) =>
    d1.prepare(`INSERT OR IGNORE INTO catalog_listings (
      id, reference, slug, kind, title, organization_name, district, division,
      delivery_mode, summary, description, category, deadline, salary,
      accessibility, eligibility, contact, featured, status, published_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PUBLISHED', CURRENT_TIMESTAMP)`)
      .bind(
        `seed-${item.slug}`,
        `BSC-C-${String(1001 + index)}`,
        item.slug,
        item.kind,
        item.title,
        item.organization,
        item.district,
        item.division,
        item.deliveryMode,
        item.summary,
        item.description,
        item.category,
        item.deadline ?? null,
        item.salary ?? null,
        JSON.stringify(item.accessibility),
        JSON.stringify(item.eligibility),
        item.contact,
        item.featured ? 1 : 0,
      )
  );
  await d1.batch(statements);
}

export async function listPublishedCatalog(): Promise<CatalogItem[]> {
  await ensureCatalogSeeded();
  const result = await getRawDb().prepare(`SELECT * FROM catalog_listings
    WHERE status = 'PUBLISHED'
    ORDER BY featured DESC, updated_at DESC, title ASC`).all<CatalogRow>();
  return result.results.map(mapCatalogRow);
}

export async function getPublishedCatalogBySlug(slug: string): Promise<CatalogItem | null> {
  await ensureCatalogSeeded();
  const row = await getRawDb().prepare(`SELECT * FROM catalog_listings
    WHERE slug = ? AND status = 'PUBLISHED' LIMIT 1`).bind(slug).first<CatalogRow>();
  return row ? mapCatalogRow(row) : null;
}

export async function requireCatalogActor(): Promise<Actor> {
  const identity = await getChatGPTUser();
  if (!identity) throw new CatalogError("Sign in is required.", 401);
  const d1 = getRawDb();
  let actor = await d1.prepare("SELECT id, email, display_name, role FROM users WHERE email = ? AND status = 'ACTIVE' LIMIT 1")
    .bind(identity.email.toLowerCase()).first<{ id: string; email: string; display_name: string; role: ActorRole }>();

  if (!actor) {
    const count = await d1.prepare("SELECT COUNT(*) AS total FROM users").first<{ total: number }>();
    if (Number(count?.total ?? 0) !== 0) throw new CatalogError("Your account has not been assigned a workspace role.", 403);
    const id = crypto.randomUUID();
    await d1.prepare(`INSERT INTO users (id, email, display_name, role, status)
      VALUES (?, ?, ?, 'ADMIN', 'ACTIVE')`).bind(id, identity.email.toLowerCase(), identity.displayName).run();
    actor = { id, email: identity.email.toLowerCase(), display_name: identity.displayName, role: "ADMIN" };
  }

  return { id: actor.id, email: actor.email, displayName: actor.display_name, role: actor.role };
}

export async function listManagedCatalog(actor: Actor, scope: "admin" | "organization"): Promise<CatalogItem[]> {
  await ensureCatalogSeeded();
  if (scope === "admin" && actor.role !== "ADMIN") throw new CatalogError("Administrator access is required.", 403);
  const d1 = getRawDb();
  const result = scope === "admin"
    ? await d1.prepare("SELECT * FROM catalog_listings WHERE status != 'ARCHIVED' ORDER BY updated_at DESC").all<CatalogRow>()
    : await d1.prepare("SELECT * FROM catalog_listings WHERE created_by_id = ? AND status != 'ARCHIVED' ORDER BY updated_at DESC").bind(actor.id).all<CatalogRow>();
  return result.results.map(mapCatalogRow);
}

export type CreateCatalogInput = {
  kind: CatalogKind;
  title: string;
  organization: string;
  district: string;
  division?: string;
  deliveryMode: CatalogItem["deliveryMode"];
  summary: string;
  description?: string;
  category?: string;
  deadline?: string;
  salary?: string;
  accessibility?: string[];
  eligibility?: string[];
  contact?: string;
};

function slugify(value: string) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "").slice(0, 55);
}

export async function createCatalogDraft(actor: Actor, input: CreateCatalogInput): Promise<CatalogItem> {
  if (!["ADMIN", "ORG_REP"].includes(actor.role)) throw new CatalogError("Organization or administrator access is required.", 403);
  const title = input.title?.trim();
  const summary = input.summary?.trim();
  const organization = input.organization?.trim();
  if (!title || !summary || !organization || !input.kind || !input.district || !input.deliveryMode) {
    throw new CatalogError("Complete every required listing field.", 400);
  }
  const id = crypto.randomUUID();
  const slug = `${slugify(title)}-${id.slice(0, 6)}`;
  const reference = `BSC-C-${Date.now().toString().slice(-8)}`;
  const d1 = getRawDb();
  await d1.prepare(`INSERT INTO catalog_listings (
    id, reference, slug, kind, title, organization_name, district, division,
    delivery_mode, summary, description, category, deadline, salary,
    accessibility, eligibility, contact, featured, status, created_by_id
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 'DRAFT', ?)`)
    .bind(
      id, reference, slug, input.kind, title, organization, input.district,
      input.division?.trim() || input.district, input.deliveryMode, summary,
      input.description?.trim() || summary, input.category?.trim() || "General",
      input.deadline?.trim() || null, input.salary?.trim() || null,
      JSON.stringify(input.accessibility ?? []), JSON.stringify(input.eligibility ?? []),
      input.contact?.trim() || "Continue through B-SCAN Connect", actor.id,
    ).run();
  const row = await d1.prepare("SELECT * FROM catalog_listings WHERE id = ?").bind(id).first<CatalogRow>();
  if (!row) throw new CatalogError("The listing could not be saved.", 500);
  return mapCatalogRow(row);
}

export async function transitionCatalogListing(actor: Actor, id: string, action: CatalogAction, comment?: string): Promise<CatalogItem> {
  const d1 = getRawDb();
  const current = await d1.prepare("SELECT * FROM catalog_listings WHERE id = ? LIMIT 1").bind(id).first<CatalogRow>();
  if (!current) throw new CatalogError("Listing not found.", 404);
  if (actor.role === "ORG_REP" && current.created_by_id !== actor.id) throw new CatalogError("You can only update your organization’s listings.", 403);
  const nextStatus = resolveCatalogTransition(action, current.status, actor.role);
  if (!nextStatus) throw new CatalogError("That action is not allowed for the listing’s current status.", 409);

  const eventId = crypto.randomUUID();
  const logId = crypto.randomUUID();
  const submittedAt = nextStatus === "SUBMITTED" ? "CURRENT_TIMESTAMP" : "submitted_at";
  const publishedAt = nextStatus === "PUBLISHED" ? "CURRENT_TIMESTAMP" : "published_at";
  const closedAt = nextStatus === "CLOSED" ? "CURRENT_TIMESTAMP" : "closed_at";
  const archivedAt = nextStatus === "ARCHIVED" ? "CURRENT_TIMESTAMP" : "archived_at";
  const results = await d1.batch([
    d1.prepare(`UPDATE catalog_listings SET status = ?, updated_at = CURRENT_TIMESTAMP,
      submitted_at = ${submittedAt}, published_at = ${publishedAt},
      closed_at = ${closedAt}, archived_at = ${archivedAt}
      WHERE id = ? AND status = ?`).bind(nextStatus, id, current.status),
    d1.prepare(`INSERT INTO content_approval_events
      (id, entity_type, entity_id, from_status, to_status, actor_id, comment)
      SELECT ?, 'CATALOG_LISTING', ?, ?, ?, ?, ? WHERE changes() = 1`)
      .bind(eventId, id, current.status, nextStatus, actor.id, comment?.trim() || null),
    d1.prepare(`INSERT INTO activity_logs (id, actor_id, action, entity_type, entity_id, summary)
      SELECT ?, ?, ?, 'CATALOG_LISTING', ?, ? WHERE changes() = 1`)
      .bind(logId, actor.id, `CATALOG_${action}`, id, `${current.title}: ${current.status} → ${nextStatus}`),
  ]);
  if (Number(results[0].meta.changes ?? 0) !== 1) throw new CatalogError("The listing changed before this action completed. Refresh and try again.", 409);
  const row = await d1.prepare("SELECT * FROM catalog_listings WHERE id = ?").bind(id).first<CatalogRow>();
  if (!row) throw new CatalogError("The listing could not be reloaded.", 500);
  return mapCatalogRow(row);
}

export class CatalogError extends Error {
  constructor(message: string, public status: number) {
    super(message);
  }
}

export function catalogErrorResponse(error: unknown) {
  if (error instanceof CatalogError) return Response.json({ error: error.message }, { status: error.status });
  const message = error instanceof Error ? error.message : "Unexpected error";
  return Response.json({ error: message }, { status: 500 });
}
