import { catalogErrorResponse, requireCatalogActor } from "../../../../db/catalog-repository";
import { updateNotification } from "../../../../db/notification-repository";

const actions = new Set(["READ", "UNREAD", "ARCHIVE"] as const);
type NotificationAction = "READ" | "UNREAD" | "ARCHIVE";

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const actor = await requireCatalogActor();
    const body = await request.json() as { action?: string };
    if (!body.action || !actions.has(body.action as NotificationAction)) {
      return Response.json({ error: "Choose a valid notification action." }, { status: 400 });
    }
    const { id } = await params;
    return Response.json(await updateNotification(actor, id, body.action as NotificationAction));
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
