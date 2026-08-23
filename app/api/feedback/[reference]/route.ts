import { deleteMyFeedback, updateMyFeedback } from "../../../../db/feedback-repository";
import { catalogErrorResponse, requireCatalogActor } from "../../../../db/catalog-repository";
export async function PATCH(request:Request,{params}:{params:Promise<{reference:string}>}){try{return Response.json({feedback:await updateMyFeedback(await requireCatalogActor(),(await params).reference,await request.json())});}catch(error){return catalogErrorResponse(error);}}
export async function DELETE(_:Request,{params}:{params:Promise<{reference:string}>}){try{return Response.json({feedback:await deleteMyFeedback(await requireCatalogActor(),(await params).reference)});}catch(error){return catalogErrorResponse(error);}}
