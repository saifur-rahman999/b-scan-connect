import { catalogErrorResponse, requireCatalogActor } from "../../../../../db/catalog-repository";
import { addReferralMessage } from "../../../../../db/referral-repository";
export async function POST(request:Request,{params}:{params:Promise<{reference:string}>}){try{const actor=await requireCatalogActor();const body=await request.json() as {message?:string;queueAccess?:boolean};const {reference}=await params;return Response.json(await addReferralMessage(actor,reference,body.message??"",body.queueAccess===true));}catch(error){return catalogErrorResponse(error);}}
