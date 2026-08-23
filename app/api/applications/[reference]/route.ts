import {
  deleteApplicationDraft,
  getApplicationTimeline,
  transitionApplication,
  updateApplicationDraft,
  type ApplicationAction,
} from "../../../../db/application-repository";
import { catalogErrorResponse, requireCatalogActor } from "../../../../db/catalog-repository";

const actions = new Set<ApplicationAction>([
  "APPLY",
  "WITHDRAW",
  "SHORTLIST",
  "SCHEDULE_INTERVIEW",
  "START_ASSESSMENT",
  "OFFER",
  "REJECT",
]);

export async function GET(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const actor = await requireCatalogActor();
    const { reference } = await params;
    const queue = new URL(request.url).searchParams.get("scope") === "queue";
    return Response.json(await getApplicationTimeline(actor, reference, queue));
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const actor = await requireCatalogActor();
    const { reference } = await params;
    const body = await request.json() as {
      action?: string;
      preparationInfo?: string;
      privateNotes?: string;
      instructions?: string;
      importantDate?: string;
    };
    if (body.action === "UPDATE_DRAFT") {
      return Response.json({ application: await updateApplicationDraft(actor, reference, body.preparationInfo ?? "", body.privateNotes ?? "") });
    }
    if (!body.action || !actions.has(body.action as ApplicationAction)) {
      return Response.json({ error: "Choose a valid application action." }, { status: 400 });
    }
    return Response.json({ application: await transitionApplication(
      actor,
      reference,
      body.action as ApplicationAction,
      body.instructions,
      body.importantDate,
    ) });
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ reference: string }> }) {
  try {
    const actor = await requireCatalogActor();
    const { reference } = await params;
    return Response.json(await deleteApplicationDraft(actor, reference));
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
