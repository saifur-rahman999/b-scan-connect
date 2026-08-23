import { transitionFeedback } from "../../../../../db/feedback-repository";
import { catalogErrorResponse, requireCatalogActor } from "../../../../../db/catalog-repository";
export async function PATCH(request:Request,{params}:{params:Promise<{reference:string}>}){try{return Response.json({feedback:await transitionFeedback(await requireCatalogActor(),(await params).reference,await request.json())});}catch(error){return catalogErrorResponse(error);}}
