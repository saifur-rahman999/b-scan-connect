import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const timestamps = {
  createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
};

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull(),
  displayName: text("display_name").notNull(),
  role: text("role", { enum: ["PWD_USER", "ADMIN", "REFERRAL_OFFICER", "ORG_REP"] }).notNull(),
  status: text("status", { enum: ["ACTIVE", "SUSPENDED", "DEACTIVATED", "ARCHIVED"] }).notNull().default("ACTIVE"),
  ...timestamps,
}, (table) => [uniqueIndex("users_email_idx").on(table.email), index("users_role_status_idx").on(table.role, table.status)]);

export const locations = sqliteTable("locations", {
  id: text("id").primaryKey(),
  division: text("division").notNull(),
  district: text("district").notNull(),
  area: text("area"),
}, (table) => [index("locations_district_idx").on(table.district)]);

export const organizations = sqliteTable("organizations", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  type: text("type", { enum: ["SERVICE_PROVIDER", "EMPLOYER", "EDUCATION_PROVIDER", "TRAINING_PROVIDER"] }).notNull(),
  description: text("description").notNull(),
  locationId: text("location_id").references(() => locations.id),
  coverageAreas: text("coverage_areas", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  website: text("website"),
  accessibilityInfo: text("accessibility_info"),
  status: text("status", { enum: ["DRAFT", "SUBMITTED", "CHANGES_REQUESTED", "PUBLISHED", "CLOSED", "ARCHIVED"] }).notNull().default("DRAFT"),
  ...timestamps,
}, (table) => [uniqueIndex("organizations_slug_idx").on(table.slug), index("organizations_status_type_idx").on(table.status, table.type)]);

export const organizationMemberships = sqliteTable("organization_memberships", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  organizationId: text("organization_id").notNull().references(() => organizations.id),
  title: text("title"),
  ...timestamps,
}, (table) => [uniqueIndex("organization_member_idx").on(table.userId, table.organizationId)]);

export const pwdProfiles = sqliteTable("pwd_profiles", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  locationId: text("location_id").references(() => locations.id),
  preferredLocations: text("preferred_locations", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  disabilityDisclosure: text("disability_disclosure"),
  supportNeeds: text("support_needs", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  serviceInterests: text("service_interests", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  educationSummary: text("education_summary"),
  skills: text("skills", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  employmentPreferences: text("employment_preferences", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  workArrangement: text("work_arrangement", { enum: ["REMOTE", "HYBRID", "ONSITE", "FLEXIBLE"] }),
  opportunityInterests: text("opportunity_interests", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  accessibilityPreferences: text("accessibility_preferences", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  recommendationConsent: integer("recommendation_consent", { mode: "boolean" }).notNull().default(false),
  completionPercent: integer("completion_percent").notNull().default(0),
  profileVersion: integer("profile_version").notNull().default(1),
  ...timestamps,
}, (table) => [uniqueIndex("pwd_profiles_user_idx").on(table.userId)]);

export const services = sqliteTable("services", {
  id: text("id").primaryKey(), organizationId: text("organization_id").notNull().references(() => organizations.id),
  title: text("title").notNull(), category: text("category").notNull(), description: text("description").notNull(), eligibility: text("eligibility"),
  locationId: text("location_id").references(() => locations.id), deliveryMode: text("delivery_mode").notNull(), fees: text("fees"), openingHours: text("opening_hours"),
  contactMethod: text("contact_method"), accessibilityFeatures: text("accessibility_features", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  status: text("status").notNull().default("DRAFT"), ...timestamps,
}, (table) => [index("services_discovery_idx").on(table.status, table.category, table.locationId)]);

export const jobs = sqliteTable("jobs", {
  id: text("id").primaryKey(), organizationId: text("organization_id").notNull().references(() => organizations.id),
  title: text("title").notNull(), description: text("description").notNull(), responsibilities: text("responsibilities"), requiredEducation: text("required_education"),
  requiredSkills: text("required_skills", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`), experience: text("experience"), employmentType: text("employment_type").notNull(),
  workArrangement: text("work_arrangement").notNull(), locationId: text("location_id").references(() => locations.id), salaryRange: text("salary_range"), positions: integer("positions").notNull().default(1),
  deadline: text("deadline").notNull(), applicationInstructions: text("application_instructions"), inclusionInfo: text("inclusion_info"), accommodations: text("accommodations", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  status: text("status").notNull().default("DRAFT"), ...timestamps,
}, (table) => [index("jobs_discovery_idx").on(table.status, table.workArrangement, table.locationId, table.deadline)]);

export const opportunities = sqliteTable("opportunities", {
  id: text("id").primaryKey(), organizationId: text("organization_id").notNull().references(() => organizations.id),
  type: text("type", { enum: ["EDUCATION", "TRAINING", "SCHOLARSHIP", "INTERNSHIP", "VOLUNTEERING"] }).notNull(), title: text("title").notNull(), description: text("description").notNull(),
  eligibility: text("eligibility"), deliveryMode: text("delivery_mode").notNull(), locationId: text("location_id").references(() => locations.id), deadline: text("deadline").notNull(),
  accessibilityFeatures: text("accessibility_features", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`), status: text("status").notNull().default("DRAFT"), ...timestamps,
}, (table) => [index("opportunities_discovery_idx").on(table.status, table.type, table.deadline)]);

export const contentApprovalEvents = sqliteTable("content_approval_events", {
  id: text("id").primaryKey(), entityType: text("entity_type").notNull(), entityId: text("entity_id").notNull(), fromStatus: text("from_status"), toStatus: text("to_status").notNull(),
  actorId: text("actor_id").notNull().references(() => users.id), comment: text("comment"), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("approval_entity_idx").on(table.entityType, table.entityId, table.createdAt)]);

export const catalogListings = sqliteTable("catalog_listings", {
  id: text("id").primaryKey(),
  reference: text("reference").notNull(),
  slug: text("slug").notNull(),
  kind: text("kind", { enum: ["service", "job", "training", "education"] }).notNull(),
  title: text("title").notNull(),
  organizationName: text("organization_name").notNull(),
  organizationId: text("organization_id").references(() => organizations.id),
  district: text("district").notNull(),
  division: text("division").notNull(),
  deliveryMode: text("delivery_mode", { enum: ["In person", "Online", "Hybrid"] }).notNull(),
  summary: text("summary").notNull(),
  description: text("description").notNull(),
  category: text("category").notNull(),
  deadline: text("deadline"),
  salary: text("salary"),
  accessibility: text("accessibility", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  eligibility: text("eligibility", { mode: "json" }).$type<string[]>().notNull().default(sql`'[]'`),
  contact: text("contact").notNull(),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  status: text("status", { enum: ["DRAFT", "SUBMITTED", "CHANGES_REQUESTED", "PUBLISHED", "CLOSED", "ARCHIVED"] }).notNull().default("DRAFT"),
  createdById: text("created_by_id").references(() => users.id),
  submittedAt: text("submitted_at"),
  publishedAt: text("published_at"),
  closedAt: text("closed_at"),
  archivedAt: text("archived_at"),
  ...timestamps,
}, (table) => [
  uniqueIndex("catalog_listings_reference_idx").on(table.reference),
  uniqueIndex("catalog_listings_slug_idx").on(table.slug),
  index("catalog_discovery_idx").on(table.status, table.kind, table.district),
  index("catalog_management_idx").on(table.createdById, table.status, table.updatedAt),
]);

export const savedItems = sqliteTable("saved_items", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id), entityType: text("entity_type").notNull(), entityId: text("entity_id").notNull(), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [uniqueIndex("saved_user_item_idx").on(table.userId, table.entityType, table.entityId)]);

export const recommendationResults = sqliteTable("recommendation_results", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id), profileVersion: integer("profile_version").notNull(), entityType: text("entity_type").notNull(), entityId: text("entity_id").notNull(),
  score: real("score").notNull(), matchLevel: text("match_level").notNull(), contributingFactors: text("contributing_factors", { mode: "json" }).$type<string[]>().notNull(), missingInformation: text("missing_information", { mode: "json" }).$type<string[]>().notNull(),
  conflicts: text("conflicts", { mode: "json" }).$type<string[]>().notNull(), confidence: text("confidence").notNull(), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("recommendations_user_score_idx").on(table.userId, table.profileVersion, table.score)]);

export const referrals = sqliteTable("referrals", {
  id: text("id").primaryKey(), reference: text("reference").notNull(), userId: text("user_id").notNull().references(() => users.id), serviceId: text("service_id").references(() => services.id), catalogListingId: text("catalog_listing_id").references(() => catalogListings.id),
  organizationId: text("organization_id").references(() => organizations.id), assignedOfficerId: text("assigned_officer_id").references(() => users.id),
  status: text("status").notNull().default("SUBMITTED"), requestSummary: text("request_summary").notNull(), cancelledAt: text("cancelled_at"), ...timestamps,
}, (table) => [uniqueIndex("referrals_reference_idx").on(table.reference), index("referrals_queue_idx").on(table.status, table.assignedOfficerId, table.updatedAt)]);

export const referralEvents = sqliteTable("referral_events", {
  id: text("id").primaryKey(), referralId: text("referral_id").notNull().references(() => referrals.id), actorId: text("actor_id").notNull().references(() => users.id),
  eventType: text("event_type").notNull(), fromStatus: text("from_status"), toStatus: text("to_status"), summary: text("summary").notNull(), metadata: text("metadata", { mode: "json" }).$type<Record<string, unknown>>(), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("referral_events_timeline_idx").on(table.referralId, table.createdAt)]);

export const referralMessages = sqliteTable("referral_messages", {
  id: text("id").primaryKey(), referralId: text("referral_id").notNull().references(() => referrals.id), authorId: text("author_id").notNull().references(() => users.id),
  visibility: text("visibility", { enum: ["USER_VISIBLE", "INTERNAL"] }).notNull(), message: text("message").notNull(), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("referral_messages_idx").on(table.referralId, table.visibility, table.createdAt)]);

export const referralAppointments = sqliteTable("referral_appointments", {
  id: text("id").primaryKey(), referralId: text("referral_id").notNull().references(() => referrals.id), proposedById: text("proposed_by_id").notNull().references(() => users.id),
  scheduledAt: text("scheduled_at").notNull(), locationOrLink: text("location_or_link").notNull(), instructions: text("instructions"), status: text("status").notNull().default("PROPOSED"), ...timestamps,
}, (table) => [index("referral_appointments_idx").on(table.referralId, table.scheduledAt)]);

export const applications = sqliteTable("applications", {
  id: text("id").primaryKey(), reference: text("reference").notNull(), userId: text("user_id").notNull().references(() => users.id), organizationId: text("organization_id").notNull().references(() => organizations.id),
  applicationType: text("application_type").notNull(), targetId: text("target_id").notNull(), stage: text("stage").notNull().default("INTERESTED"), preparationInfo: text("preparation_info"), privateNotes: text("private_notes"), submittedAt: text("submitted_at"), withdrawnAt: text("withdrawn_at"), ...timestamps,
}, (table) => [uniqueIndex("applications_reference_idx").on(table.reference), index("applications_pipeline_idx").on(table.organizationId, table.applicationType, table.stage)]);

export const applicationEvents = sqliteTable("application_events", {
  id: text("id").primaryKey(), applicationId: text("application_id").notNull().references(() => applications.id), actorId: text("actor_id").notNull().references(() => users.id),
  fromStage: text("from_stage"), toStage: text("to_stage").notNull(), userVisibleInstructions: text("user_visible_instructions"), importantDate: text("important_date"), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("application_events_timeline_idx").on(table.applicationId, table.createdAt)]);

export const notifications = sqliteTable("notifications", {
  id: text("id").primaryKey(), userId: text("user_id").notNull().references(() => users.id), type: text("type").notNull(), title: text("title").notNull(), body: text("body").notNull(),
  relatedType: text("related_type"), relatedId: text("related_id"), readAt: text("read_at"), archivedAt: text("archived_at"), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("notifications_inbox_idx").on(table.userId, table.readAt, table.archivedAt, table.createdAt)]);

export const feedbackReports = sqliteTable("feedback_reports", {
  id: text("id").primaryKey(), reference: text("reference").notNull(), userId: text("user_id").notNull().references(() => users.id), category: text("category").notNull(), title: text("title").notNull(), description: text("description").notNull(),
  status: text("status").notNull().default("DRAFT"), assignedToId: text("assigned_to_id").references(() => users.id), response: text("response"), resolvedAt: text("resolved_at"), ...timestamps,
}, (table) => [uniqueIndex("feedback_reference_idx").on(table.reference), index("feedback_queue_idx").on(table.status, table.category, table.assignedToId)]);

export const activityLogs = sqliteTable("activity_logs", {
  id: text("id").primaryKey(), actorId: text("actor_id").references(() => users.id), action: text("action").notNull(), entityType: text("entity_type").notNull(), entityId: text("entity_id"), summary: text("summary").notNull(), createdAt: text("created_at").notNull().default(sql`CURRENT_TIMESTAMP`),
}, (table) => [index("activity_logs_recent_idx").on(table.createdAt), index("activity_logs_entity_idx").on(table.entityType, table.entityId)]);
