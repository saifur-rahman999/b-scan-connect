import { updateAdminUser } from "../../../../../db/admin-repository";
import { catalogErrorResponse, requireCatalogActor } from "../../../../../db/catalog-repository";
export async function PATCH(request:Request,{params}:{params:Promise<{id:string}>}){try{return Response.json({user:await updateAdminUser(await requireCatalogActor(),(await params).id,await request.json())});}catch(error){return catalogErrorResponse(error);}}
