import { getRawDb } from ".";
import { CatalogError, type Actor } from "./catalog-repository";

export type ApplicationStage =
  | "PREPARING"
  | "APPLIED"
  | "SHORTLISTED"
  | "INTERVIEW"
  | "ASSESSMENT"
  | "OFFERED"
  | "REJECTED"
  | "WITHDRAWN";

export type ApplicationAction =
  | "APPLY"
  | "WITHDRAW"
  | "SHORTLIST"
  | "SCHEDULE_INTERVIEW"
  | "START_ASSESSMENT"
  | "OFFER"
  | "REJECT";

export type ApplicationRecord = {
  id: string;
  reference: string;
  userId: string;
  listingId: string;
  listingSlug: string;
  listingTitle: string;
  organization: string;
  organizationId: string | null;
  district: string;
  applicationType: "JOB" | "TRAINING" | "EDUCATION";
  stage: ApplicationStage;
  preparationInfo: string;
  privateNotes: string;
  submittedAt: string | null;
  withdrawnAt: string | null;
  applicantName: string;
  createdAt: string;
  updatedAt: string;
};

type ApplicationRow = {
  id: string;
  reference: string;
  user_id: string;
  catalog_listing_id: string;
  listing_slug: string;
  listing_title: string;
  organization_name: string;
  organization_id: string | null;
  district: string;
  application_type: ApplicationRecord["applicationType"];
  stage: ApplicationStage;
  preparation_info: string | null;
  private_notes: string | null;
  submitted_at: string | null;
  withdrawn_at: string | null;
  applicant_name: string;
  created_at: string;
  updated_at: string;
};

const selectApplication = `SELECT a.id,a.reference,a.user_id,a.catalog_listing_id,
  a.application_type,a.stage,a.preparation_info,a.private_notes,a.submitted_at,
  a.withdrawn_at,a.created_at,a.updated_at,c.slug AS listing_slug,
  c.title AS listing_title,c.organization_name,c.organization_id,c.district,
  applicant.display_name AS applicant_name
  FROM applications a
  JOIN catalog_listings c ON c.id=a.catalog_listing_id
  JOIN users applicant ON applicant.id=a.user_id`;

function mapApplication(row: ApplicationRow): ApplicationRecord {
  return {
    id: row.id,
    reference: row.reference,
    userId: row.user_id,
    listingId: row.catalog_listing_id,
    listingSlug: row.listing_slug,
    listingTitle: row.listing_title,
    organization: row.organization_name,
    organizationId: row.organization_id,
    district: row.district,
    applicationType: row.application_type,
    stage: row.stage,
    preparationInfo: row.preparation_info ?? "",
    privateNotes: row.private_notes ?? "",
    submittedAt: row.submitted_at,
    withdrawnAt: row.withdrawn_at,
    applicantName: row.applicant_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function createApplication(
  actor: Actor,
  listingId: string,
  preparationInfo: string,
  privateNotes = "",
) {
  const d1 = getRawDb();
  const listing = await d1.prepare(`SELECT id,title,kind,organization_id FROM catalog_listings
    WHERE id=? AND kind IN ('job','training','education') AND status='PUBLISHED' LIMIT 1`)
    .bind(listingId)
    .first<{ id: string; title: string; kind: "job" | "training" | "education"; organization_id: string | null }>();
  if (!listing) throw new CatalogError("That opportunity is not accepting applications.", 404);

  const preparation = preparationInfo.trim().slice(0, 2000);
  if (preparation.length < 20) throw new CatalogError("Add a short application summary before saving.", 400);
  const notes = privateNotes.trim().slice(0, 2000);
  const existing = await d1.prepare(`SELECT reference FROM applications
    WHERE user_id=? AND catalog_listing_id=? AND stage NOT IN ('REJECTED','WITHDRAWN') LIMIT 1`)
    .bind(actor.id, listingId)
    .first<{ reference: string }>();
  if (existing) throw new CatalogError(`You already have an active application for this opportunity (${existing.reference}).`, 409);

  const id = crypto.randomUUID();
  const reference = `BSC-A-${Date.now().toString().slice(-8)}`;
  const applicationType = listing.kind.toUpperCase();
  await d1.batch([
    d1.prepare(`INSERT INTO applications
      (id,reference,user_id,organization_id,catalog_listing_id,application_type,target_id,stage,preparation_info,private_notes)
      VALUES (?,?,?,?,?,?,?,'PREPARING',?,?)`)
      .bind(id, reference, actor.id, listing.organization_id, listing.id, applicationType, listing.id, preparation, notes || null),
    d1.prepare(`INSERT INTO application_events
      (id,application_id,actor_id,from_stage,to_stage,user_visible_instructions)
      VALUES (?,?,?,NULL,'PREPARING','Application started and ready for review.')`)
      .bind(crypto.randomUUID(), id, actor.id),
    d1.prepare(`INSERT INTO notifications
      (id,user_id,type,title,body,related_type,related_id)
      VALUES (?,?,'APPLICATION_CREATED','Application started',?,'APPLICATION',?)`)
      .bind(crypto.randomUUID(), actor.id, `${reference} for ${listing.title} is ready to prepare.`, id),
    d1.prepare(`INSERT INTO activity_logs
      (id,actor_id,action,entity_type,entity_id,summary)
      VALUES (?,?,'APPLICATION_CREATED','APPLICATION',?,?)`)
      .bind(crypto.randomUUID(), actor.id, id, `${reference}: application started`),
  ]);
  return getApplication(actor, reference, false);
}

export async function listMyApplications(actor: Actor) {
  const rows = await getRawDb().prepare(`${selectApplication}
    WHERE a.user_id=? ORDER BY a.updated_at DESC`).bind(actor.id).all<ApplicationRow>();
  return rows.results.map(mapApplication);
}

export async function listApplicationQueue(actor: Actor) {
  if (!["ADMIN", "ORG_REP"].includes(actor.role)) throw new CatalogError("Application queue access is required.", 403);
  const where = actor.role === "ORG_REP"
    ? `WHERE EXISTS (SELECT 1 FROM organization_memberships m
        WHERE m.user_id=? AND m.organization_id=c.organization_id)`
    : "";
  const query = getRawDb().prepare(`${selectApplication} ${where}
    ORDER BY CASE a.stage WHEN 'APPLIED' THEN 0 WHEN 'SHORTLISTED' THEN 1
      WHEN 'INTERVIEW' THEN 2 ELSE 3 END,a.updated_at DESC`);
  const rows = actor.role === "ORG_REP"
    ? await query.bind(actor.id).all<ApplicationRow>()
    : await query.all<ApplicationRow>();
  return rows.results.map(mapApplication);
}

export async function getApplication(actor: Actor, reference: string, queueAccess = false) {
  const row = await getRawDb().prepare(`${selectApplication} WHERE a.reference=? LIMIT 1`)
    .bind(reference).first<ApplicationRow>();
  if (!row) throw new CatalogError("Application not found.", 404);
  if (row.user_id !== actor.id) {
    if (!queueAccess || !["ADMIN", "ORG_REP"].includes(actor.role)) {
      throw new CatalogError("You do not have access to this application.", 403);
    }
    if (actor.role === "ORG_REP") {
      const membership = await getRawDb().prepare(`SELECT id FROM organization_memberships
        WHERE user_id=? AND organization_id=? LIMIT 1`)
        .bind(actor.id, row.organization_id).first<{ id: string }>();
      if (!membership) throw new CatalogError("You do not have access to this organization’s applications.", 403);
    }
  }
  return mapApplication(row);
}

export async function getApplicationTimeline(actor: Actor, reference: string, queueAccess = false) {
  const application = await getApplication(actor, reference, queueAccess);
  const rows = await getRawDb().prepare(`SELECT e.id,e.from_stage,e.to_stage,
    e.user_visible_instructions,e.important_date,e.created_at,u.display_name AS actor_name
    FROM application_events e JOIN users u ON u.id=e.actor_id
    WHERE e.application_id=? ORDER BY e.created_at ASC`)
    .bind(application.id)
    .all<{ id: string; from_stage: string | null; to_stage: string; user_visible_instructions: string | null; important_date: string | null; created_at: string; actor_name: string }>();
  return {
    application,
    events: rows.results.map((event) => ({
      id: event.id,
      fromStage: event.from_stage,
      toStage: event.to_stage,
      instructions: event.user_visible_instructions,
      importantDate: event.important_date,
      createdAt: event.created_at,
      actorName: event.actor_name,
    })),
  };
}

export async function updateApplicationDraft(
  actor: Actor,
  reference: string,
  preparationInfo: string,
  privateNotes: string,
) {
  const application = await getApplication(actor, reference, false);
  if (application.userId !== actor.id) throw new CatalogError("Only the applicant can update this application.", 403);
  if (application.stage !== "PREPARING") throw new CatalogError("Only applications being prepared can be edited.", 409);
  const preparation = preparationInfo.trim().slice(0, 2000);
  if (preparation.length < 20) throw new CatalogError("Add a short application summary before saving.", 400);
  const notes = privateNotes.trim().slice(0, 2000);
  const d1 = getRawDb();
  await d1.batch([
    d1.prepare(`UPDATE applications SET preparation_info=?,private_notes=?,updated_at=CURRENT_TIMESTAMP
      WHERE id=? AND stage='PREPARING'`).bind(preparation, notes || null, application.id),
    d1.prepare(`INSERT INTO application_events
      (id,application_id,actor_id,from_stage,to_stage,user_visible_instructions)
      VALUES (?,?,?,'PREPARING','PREPARING','Application preparation updated.')`)
      .bind(crypto.randomUUID(), application.id, actor.id),
  ]);
  return getApplication(actor, reference, false);
}

type TransitionRule = {
  roles: Actor["role"][] | "OWNER";
  from: ApplicationStage[];
  to: ApplicationStage;
  summary: string;
};

const transitions: Record<ApplicationAction, TransitionRule> = {
  APPLY: { roles: "OWNER", from: ["PREPARING"], to: "APPLIED", summary: "Application submitted to the organization." },
  WITHDRAW: { roles: "OWNER", from: ["PREPARING", "APPLIED", "SHORTLISTED", "INTERVIEW", "ASSESSMENT"], to: "WITHDRAWN", summary: "Application withdrawn by the applicant." },
  SHORTLIST: { roles: ["ADMIN", "ORG_REP"], from: ["APPLIED"], to: "SHORTLISTED", summary: "Application shortlisted for the next stage." },
  SCHEDULE_INTERVIEW: { roles: ["ADMIN", "ORG_REP"], from: ["SHORTLISTED"], to: "INTERVIEW", summary: "Interview scheduled." },
  START_ASSESSMENT: { roles: ["ADMIN", "ORG_REP"], from: ["SHORTLISTED", "INTERVIEW"], to: "ASSESSMENT", summary: "Application moved to assessment." },
  OFFER: { roles: ["ADMIN", "ORG_REP"], from: ["SHORTLISTED", "INTERVIEW", "ASSESSMENT"], to: "OFFERED", summary: "An offer was recorded for this application." },
  REJECT: { roles: ["ADMIN", "ORG_REP"], from: ["APPLIED", "SHORTLISTED", "INTERVIEW", "ASSESSMENT"], to: "REJECTED", summary: "The application was not selected." },
};

export async function transitionApplication(
  actor: Actor,
  reference: string,
  action: ApplicationAction,
  instructions?: string,
  importantDate?: string,
) {
  const application = await getApplication(actor, reference, !["APPLY", "WITHDRAW"].includes(action));
  const rule = transitions[action];
  if (!rule || !rule.from.includes(application.stage)) {
    throw new CatalogError("That action is not available for the application’s current stage.", 409);
  }
  if (rule.roles === "OWNER") {
    if (application.userId !== actor.id) throw new CatalogError("Only the applicant can perform that action.", 403);
  } else if (!rule.roles.includes(actor.role)) {
    throw new CatalogError("Your role cannot perform that application action.", 403);
  }

  const note = instructions?.trim().slice(0, 1000) || rule.summary;
  const date = importantDate?.trim() || null;
  if (action === "SCHEDULE_INTERVIEW" && (!date || Number.isNaN(Date.parse(date)))) {
    throw new CatalogError("Add a valid interview date and time.", 400);
  }
  const submittedAt = action === "APPLY" ? "CURRENT_TIMESTAMP" : "submitted_at";
  const withdrawnAt = action === "WITHDRAW" ? "CURRENT_TIMESTAMP" : "withdrawn_at";
  const d1 = getRawDb();
  const results = await d1.batch([
    d1.prepare(`UPDATE applications SET stage=?,submitted_at=${submittedAt},
      withdrawn_at=${withdrawnAt},updated_at=CURRENT_TIMESTAMP WHERE id=? AND stage=?`)
      .bind(rule.to, application.id, application.stage),
    d1.prepare(`INSERT INTO application_events
      (id,application_id,actor_id,from_stage,to_stage,user_visible_instructions,important_date)
      SELECT ?,?,?,?,?,?,? WHERE changes()=1`)
      .bind(crypto.randomUUID(), application.id, actor.id, application.stage, rule.to, note, date),
    d1.prepare(`INSERT INTO notifications
      (id,user_id,type,title,body,related_type,related_id)
      SELECT ?,?,'APPLICATION_UPDATED','Application updated',?,'APPLICATION',? WHERE changes()=1`)
      .bind(crypto.randomUUID(), application.userId, `${application.reference}: ${rule.to.toLowerCase()}.`, application.id),
    d1.prepare(`INSERT INTO activity_logs
      (id,actor_id,action,entity_type,entity_id,summary)
      SELECT ?,?,?,'APPLICATION',?,? WHERE changes()=1`)
      .bind(crypto.randomUUID(), actor.id, `APPLICATION_${action}`, application.id, `${application.reference}: ${application.stage} → ${rule.to}`),
  ]);
  if (Number(results[0].meta.changes ?? 0) !== 1) {
    throw new CatalogError("The application changed before this action completed. Refresh and try again.", 409);
  }
  return getApplication(actor, reference, !["APPLY", "WITHDRAW"].includes(action));
}

export async function deleteApplicationDraft(actor: Actor, reference: string) {
  const application = await getApplication(actor, reference, false);
  if (application.userId !== actor.id) throw new CatalogError("Only the applicant can remove this draft.", 403);
  if (application.stage !== "PREPARING" || application.submittedAt) {
    throw new CatalogError("Only an unsubmitted application can be removed.", 409);
  }
  const d1 = getRawDb();
  await d1.batch([
    d1.prepare("DELETE FROM application_events WHERE application_id=?").bind(application.id),
    d1.prepare("DELETE FROM notifications WHERE user_id=? AND related_type='APPLICATION' AND related_id=?").bind(actor.id, application.id),
    d1.prepare("DELETE FROM applications WHERE id=? AND stage='PREPARING'").bind(application.id),
  ]);
  return { deleted: true };
}
