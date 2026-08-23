import {
  catalogErrorResponse,
  createCatalogDraft,
  listPublishedCatalog,
  requireCatalogActor,
  type CreateCatalogInput,
} from "../../../db/catalog-repository";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const listings = await listPublishedCatalog();
    return Response.json({ listings }, { headers: { "Cache-Control": "public, max-age=60" } });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireCatalogActor();
    const payload = await request.json() as CreateCatalogInput;
    const listing = await createCatalogDraft(actor, payload);
    return Response.json({ listing }, { status: 201 });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
