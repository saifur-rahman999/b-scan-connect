import { createAdminUser, listAdminUsers } from "../../../../db/admin-repository";
import { catalogErrorResponse, requireCatalogActor } from "../../../../db/catalog-repository";
export async function GET(){try{return Response.json({users:await listAdminUsers(await requireCatalogActor())});}catch(error){return catalogErrorResponse(error);}}
export async function POST(request:Request){try{return Response.json({user:await createAdminUser(await requireCatalogActor(),await request.json())},{status:201});}catch(error){return catalogErrorResponse(error);}}
