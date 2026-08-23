import { catalogErrorResponse, requireCatalogActor } from "../../../db/catalog-repository";
import { listNotifications, markAllNotificationsRead, type NotificationFilter } from "../../../db/notification-repository";

const filters = new Set<NotificationFilter>(["all", "unread", "archived"]);

export async function GET(request: Request) {
  try {
    const actor = await requireCatalogActor();
    const value = new URL(request.url).searchParams.get("filter") ?? "all";
    const filter = filters.has(value as NotificationFilter) ? value as NotificationFilter : "all";
    return Response.json(await listNotifications(actor, filter));
  } catch (error) {
    return catalogErrorResponse(error);
  }
}

export async function PATCH() {
  try {
    return Response.json(await markAllNotificationsRead(await requireCatalogActor()));
  } catch (error) {
    return catalogErrorResponse(error);
  }
}
