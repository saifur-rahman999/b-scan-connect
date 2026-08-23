import { catalogErrorResponse, requireCatalogActor } from "../../../db/catalog-repository";
import { getMemberProfile, updateMemberProfile } from "../../../db/member-experience";

export async function GET() {
  try {
    const actor = await requireCatalogActor();
    return Response.json({ profile: await getMemberProfile(actor) });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

export async function PUT(request: Request) {
  try {
    const actor = await requireCatalogActor();
    const input = await request.json();
    return Response.json({ profile: await updateMemberProfile(actor, input) });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
