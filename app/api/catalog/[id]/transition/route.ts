import {
  catalogErrorResponse,
  requireCatalogActor,
  transitionCatalogListing,
} from "../../../../../db/catalog-repository";
import type { CatalogAction } from "../../../../../db/catalog-workflow";

export const dynamic = "force-dynamic";

const actions = new Set<CatalogAction>(["SUBMIT", "PUBLISH", "REQUEST_CHANGES", "CLOSE", "ARCHIVE"]);

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const actor = await requireCatalogActor();
    const payload = await request.json() as { action?: string; comment?: string };
    if (!payload.action || !actions.has(payload.action as CatalogAction)) {
      return Response.json({ error: "Choose a valid listing action." }, { status: 400 });
    }
    const { id } = await params;
    const listing = await transitionCatalogListing(actor, id, payload.action as CatalogAction, payload.comment);
    return Response.json({ listing });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
