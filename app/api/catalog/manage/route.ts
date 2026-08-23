import {
  catalogErrorResponse,
  listManagedCatalog,
  requireCatalogActor,
} from "../../../../db/catalog-repository";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const actor = await requireCatalogActor();
    const url = new URL(request.url);
    const scope = url.searchParams.get("scope") === "organization" ? "organization" : "admin";
    const listings = await listManagedCatalog(actor, scope);
    return Response.json({ listings, actor: { role: actor.role, displayName: actor.displayName } });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
