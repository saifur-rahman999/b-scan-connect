import type { CatalogItem } from "../data/catalog";
import { ensureCatalogSeeded, mapCatalogRow, type Actor, type CatalogRow } from "./catalog-repository";
import { getRawDb } from ".";

export type MemberProfile = {
  preferredLocations: string[];
  supportNeeds: string[];
  serviceInterests: string[];
  educationSummary: string;
  skills: string[];
  employmentPreferences: string[];
  workArrangement: "REMOTE" | "HYBRID" | "ONSITE" | "FLEXIBLE" | null;
  opportunityInterests: string[];
  accessibilityPreferences: string[];
  recommendationConsent: boolean;
  completionPercent: number;
  profileVersion: number;
};

export type Recommendation = {
  item: CatalogItem;
  score: number;
  matchLevel: "Strong" | "Good" | "Possible";
  contributingFactors: string[];
  missingInformation: string[];
  conflicts: string[];
  confidence: "High" | "Medium" | "Low";
};

type ProfileRow = {
  preferred_locations: string;
  support_needs: string;
  service_interests: string;
  education_summary: string | null;
  skills: string;
  employment_preferences: string;
  work_arrangement: MemberProfile["workArrangement"];
  opportunity_interests: string;
  accessibility_preferences: string;
  recommendation_consent: number;
  completion_percent: number;
  profile_version: number;
};

const ENTITY_TYPE = "CATALOG_LISTING";
const arrangements = ["REMOTE", "HYBRID", "ONSITE", "FLEXIBLE"] as const;

function parseList(value: string | null): string[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((entry): entry is string => typeof entry === "string") : [];
  } catch {
    return [];
  }
}

function cleanList(value: unknown, limit = 12): string[] {
  if (!Array.isArray(value)) return [];
  return [...new Set(value.filter((entry): entry is string => typeof entry === "string").map((entry) => entry.trim()).filter(Boolean))].slice(0, limit);
}

function mapProfile(row: ProfileRow): MemberProfile {
  return {
    preferredLocations: parseList(row.preferred_locations),
    supportNeeds: parseList(row.support_needs),
    serviceInterests: parseList(row.service_interests),
    educationSummary: row.education_summary ?? "",
    skills: parseList(row.skills),
    employmentPreferences: parseList(row.employment_preferences),
    workArrangement: row.work_arrangement,
    opportunityInterests: parseList(row.opportunity_interests),
    accessibilityPreferences: parseList(row.accessibility_preferences),
    recommendationConsent: Boolean(row.recommendation_consent),
    completionPercent: row.completion_percent,
    profileVersion: row.profile_version,
  };
}

export async function getMemberProfile(actor: Actor): Promise<MemberProfile> {
  const d1 = getRawDb();
  await d1.prepare("INSERT OR IGNORE INTO pwd_profiles (id, user_id) VALUES (?, ?)").bind(crypto.randomUUID(), actor.id).run();
  const row = await d1.prepare(`SELECT preferred_locations, support_needs, service_interests,
    education_summary, skills, employment_preferences, work_arrangement,
    opportunity_interests, accessibility_preferences, recommendation_consent,
    completion_percent, profile_version FROM pwd_profiles WHERE user_id = ? LIMIT 1`)
    .bind(actor.id).first<ProfileRow>();
  if (!row) throw new Error("Your profile could not be loaded.");
  return mapProfile(row);
}

export async function updateMemberProfile(actor: Actor, input: Partial<MemberProfile>): Promise<MemberProfile> {
  await getMemberProfile(actor);
  const profile = {
    preferredLocations: cleanList(input.preferredLocations),
    supportNeeds: cleanList(input.supportNeeds),
    serviceInterests: cleanList(input.serviceInterests),
    educationSummary: typeof input.educationSummary === "string" ? input.educationSummary.trim().slice(0, 1200) : "",
    skills: cleanList(input.skills, 20),
    employmentPreferences: cleanList(input.employmentPreferences),
    workArrangement: arrangements.includes(input.workArrangement as typeof arrangements[number]) ? input.workArrangement : null,
    opportunityInterests: cleanList(input.opportunityInterests),
    accessibilityPreferences: cleanList(input.accessibilityPreferences),
    recommendationConsent: input.recommendationConsent === true,
  };
  const completed = [profile.preferredLocations.length, profile.supportNeeds.length, profile.serviceInterests.length,
    profile.educationSummary, profile.skills.length, profile.employmentPreferences.length, profile.workArrangement,
    profile.opportunityInterests.length, profile.accessibilityPreferences.length].filter(Boolean).length;
  const completionPercent = Math.round((completed / 9) * 100);
  await getRawDb().prepare(`UPDATE pwd_profiles SET preferred_locations = ?, support_needs = ?, service_interests = ?,
    education_summary = ?, skills = ?, employment_preferences = ?, work_arrangement = ?, opportunity_interests = ?,
    accessibility_preferences = ?, recommendation_consent = ?, completion_percent = ?,
    profile_version = profile_version + 1, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?`)
    .bind(JSON.stringify(profile.preferredLocations), JSON.stringify(profile.supportNeeds), JSON.stringify(profile.serviceInterests),
      profile.educationSummary || null, JSON.stringify(profile.skills), JSON.stringify(profile.employmentPreferences),
      profile.workArrangement, JSON.stringify(profile.opportunityInterests), JSON.stringify(profile.accessibilityPreferences),
      profile.recommendationConsent ? 1 : 0, completionPercent, actor.id).run();
  return getMemberProfile(actor);
}

export async function listSavedCatalog(actor: Actor): Promise<CatalogItem[]> {
  await ensureCatalogSeeded();
  const result = await getRawDb().prepare(`SELECT c.* FROM saved_items s
    JOIN catalog_listings c ON c.id = s.entity_id
    WHERE s.user_id = ? AND s.entity_type = ? AND c.status = 'PUBLISHED'
    ORDER BY s.created_at DESC`).bind(actor.id, ENTITY_TYPE).all<CatalogRow>();
  return result.results.map(mapCatalogRow);
}

export async function setCatalogSaved(actor: Actor, listingId: string, saved: boolean) {
  const d1 = getRawDb();
  const listing = await d1.prepare("SELECT id FROM catalog_listings WHERE id = ? AND status = 'PUBLISHED' LIMIT 1").bind(listingId).first<{ id: string }>();
  if (!listing) throw new Error("That listing is no longer available.");
  if (saved) {
    await d1.prepare("INSERT OR IGNORE INTO saved_items (id, user_id, entity_type, entity_id) VALUES (?, ?, ?, ?)")
      .bind(crypto.randomUUID(), actor.id, ENTITY_TYPE, listingId).run();
  } else {
    await d1.prepare("DELETE FROM saved_items WHERE user_id = ? AND entity_type = ? AND entity_id = ?")
      .bind(actor.id, ENTITY_TYPE, listingId).run();
  }
  return { saved };
}

function includesAny(values: string[], haystack: string) {
  const normalized = haystack.toLowerCase();
  return values.filter((value) => normalized.includes(value.toLowerCase()));
}

function recommendationFor(item: CatalogItem, profile: MemberProfile): Recommendation {
  let score = 20;
  const factors: string[] = ["The listing is active and has completed content review."];
  const missing: string[] = [];
  const conflicts: string[] = [];
  if (profile.preferredLocations.length) {
    if (profile.preferredLocations.some((location) => location === item.district || item.district === "Nationwide")) {
      score += 25; factors.push(`Location aligns with your preference for ${item.district}.`);
    } else conflicts.push(`Location is ${item.district}, outside your saved locations.`);
  } else missing.push("Add preferred locations to compare travel needs.");
  const deliveryByWork = { REMOTE: "Online", HYBRID: "Hybrid", ONSITE: "In person", FLEXIBLE: item.deliveryMode } as const;
  if (profile.workArrangement) {
    if (deliveryByWork[profile.workArrangement] === item.deliveryMode) { score += 20; factors.push(`${item.deliveryMode} delivery matches your work arrangement.`); }
    else conflicts.push(`${item.deliveryMode} delivery differs from your ${profile.workArrangement.toLowerCase()} preference.`);
  } else missing.push("Add a work arrangement to compare delivery options.");
  const interestMatches = includesAny([...profile.serviceInterests, ...profile.opportunityInterests], `${item.kind} ${item.category} ${item.title}`);
  if (interestMatches.length) { score += 20; factors.push(`Your interests align with ${item.category.toLowerCase()}.`); }
  else if (!profile.serviceInterests.length && !profile.opportunityInterests.length) missing.push("Add service or opportunity interests for more relevant results.");
  const accessMatches = profile.accessibilityPreferences.filter((value) => item.accessibility.some((feature) => feature.toLowerCase().includes(value.toLowerCase()) || value.toLowerCase().includes(feature.toLowerCase())));
  if (accessMatches.length) { score += 20; factors.push(`${accessMatches.length} accessibility preference${accessMatches.length === 1 ? "" : "s"} align.`); }
  else if (profile.accessibilityPreferences.length) conflicts.push("No exact accessibility preference match is listed; contact the organization to confirm adjustments.");
  else missing.push("Add accessibility preferences to compare available adjustments.");
  if (item.featured) score += 5;
  score = Math.min(score, 100);
  return { item, score, matchLevel: score >= 75 ? "Strong" : score >= 50 ? "Good" : "Possible", contributingFactors: factors,
    missingInformation: missing, conflicts, confidence: missing.length <= 1 ? "High" : missing.length <= 3 ? "Medium" : "Low" };
}

export async function buildRecommendations(actor: Actor): Promise<{ profile: MemberProfile; recommendations: Recommendation[] }> {
  const profile = await getMemberProfile(actor);
  if (!profile.recommendationConsent) return { profile, recommendations: [] };
  await ensureCatalogSeeded();
  const rows = await getRawDb().prepare("SELECT * FROM catalog_listings WHERE status = 'PUBLISHED'").all<CatalogRow>();
  const recommendations = rows.results.map(mapCatalogRow).map((item) => recommendationFor(item, profile)).sort((a, b) => b.score - a.score);
  const d1 = getRawDb();
  const writes = recommendations.map((result) => d1.prepare(`INSERT INTO recommendation_results
    (id, user_id, profile_version, entity_type, entity_id, score, match_level, contributing_factors, missing_information, conflicts, confidence)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .bind(crypto.randomUUID(), actor.id, profile.profileVersion, ENTITY_TYPE, result.item.id, result.score, result.matchLevel,
      JSON.stringify(result.contributingFactors), JSON.stringify(result.missingInformation), JSON.stringify(result.conflicts), result.confidence));
  await d1.batch([d1.prepare("DELETE FROM recommendation_results WHERE user_id = ?").bind(actor.id), ...writes]);
  return { profile, recommendations };
}
