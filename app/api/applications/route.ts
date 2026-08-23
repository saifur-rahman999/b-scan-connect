import { createApplication, listApplicationQueue, listMyApplications } from "../../../db/application-repository";
import { catalogErrorResponse, requireCatalogActor } from "../../../db/catalog-repository";

export async function GET(request: Request) {
  try {
    const actor = await requireCatalogActor();
    const queue = new URL(request.url).searchParams.get("scope") === "queue";
    return Response.json({ applications: queue ? await listApplicationQueue(actor) : await listMyApplications(actor) });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const actor = await requireCatalogActor();
    const body = await request.json() as { listingId?: string; preparationInfo?: string; privateNotes?: string };
    if (!body.listingId) return Response.json({ error: "Choose an opportunity before starting." }, { status: 400 });
    const application = await createApplication(actor, body.listingId, body.preparationInfo ?? "", body.privateNotes ?? "");
    return Response.json({ application }, { status: 201 });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
