import { catalogErrorResponse, requireCatalogActor } from "../../../db/catalog-repository";
import { buildRecommendations } from "../../../db/member-experience";

export async function GET() {
  try {
    const actor = await requireCatalogActor();
    return Response.json(await buildRecommendations(actor));
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
