import { createFeedback, listMyFeedback } from "../../../db/feedback-repository";
import { catalogErrorResponse, requireCatalogActor } from "../../../db/catalog-repository";
export async function GET(){try{return Response.json({feedback:await listMyFeedback(await requireCatalogActor())});}catch(error){return catalogErrorResponse(error);}}
export async function POST(request:Request){try{return Response.json({feedback:await createFeedback(await requireCatalogActor(),await request.json())},{status:201});}catch(error){return catalogErrorResponse(error);}}
