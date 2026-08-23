export type CatalogStatus = "DRAFT" | "SUBMITTED" | "CHANGES_REQUESTED" | "PUBLISHED" | "CLOSED" | "ARCHIVED";
export type CatalogAction = "SUBMIT" | "PUBLISH" | "REQUEST_CHANGES" | "CLOSE" | "ARCHIVE";
export type ActorRole = "PWD_USER" | "ADMIN" | "REFERRAL_OFFICER" | "ORG_REP";

const transitions: Record<CatalogAction, { from: CatalogStatus[]; to: CatalogStatus; roles: ActorRole[] }> = {
  SUBMIT: { from: ["DRAFT", "CHANGES_REQUESTED"], to: "SUBMITTED", roles: ["ADMIN", "ORG_REP"] },
  PUBLISH: { from: ["SUBMITTED"], to: "PUBLISHED", roles: ["ADMIN"] },
  REQUEST_CHANGES: { from: ["SUBMITTED"], to: "CHANGES_REQUESTED", roles: ["ADMIN"] },
  CLOSE: { from: ["PUBLISHED"], to: "CLOSED", roles: ["ADMIN"] },
  ARCHIVE: { from: ["PUBLISHED", "CLOSED"], to: "ARCHIVED", roles: ["ADMIN"] },
};

export function resolveCatalogTransition(action: CatalogAction, fromStatus: CatalogStatus, role: ActorRole) {
  const transition = transitions[action];
  if (!transition || !transition.from.includes(fromStatus) || !transition.roles.includes(role)) {
    return null;
  }
  return transition.to;
}
