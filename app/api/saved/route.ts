import { catalogErrorResponse, requireCatalogActor } from "../../../db/catalog-repository";
import { listSavedCatalog, setCatalogSaved } from "../../../db/member-experience";

export async function GET() {
  try {
    const actor = await requireCatalogActor();
    return Response.json({ listings: await listSavedCatalog(actor) });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const actor = await requireCatalogActor();
    const body = await request.json() as { listingId?: string; saved?: boolean };
    if (!body.listingId) return Response.json({ error: "Choose a listing to update." }, { status: 400 });
    return Response.json(await setCatalogSaved(actor, body.listingId, body.saved !== false));
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
