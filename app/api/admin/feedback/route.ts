import { listFeedbackQueue } from "../../../../db/feedback-repository";
import { catalogErrorResponse, requireCatalogActor } from "../../../../db/catalog-repository";
export async function GET(){try{return Response.json({feedback:await listFeedbackQueue(await requireCatalogActor())});}catch(error){return catalogErrorResponse(error);}}
