import { getRawDb } from ".";
import { CatalogError, type Actor } from "./catalog-repository";

export type NotificationFilter = "all" | "unread" | "archived";
export type NotificationRecord = {
  id: string;
  type: string;
  title: string;
  body: string;
  readAt: string | null;
  archivedAt: string | null;
  createdAt: string;
  href: string | null;
};

type NotificationRow = {
  id: string;
  type: string;
  title: string;
  body: string;
  read_at: string | null;
  archived_at: string | null;
  created_at: string;
  related_type: string | null;
  application_reference: string | null;
  referral_reference: string | null;
};

function notificationHref(row: NotificationRow) {
  if (row.related_type === "APPLICATION" && row.application_reference) {
    return `/workspace/applications/${encodeURIComponent(row.application_reference)}`;
  }
  if (row.related_type === "REFERRAL" && row.referral_reference) {
    return `/workspace/referrals/${encodeURIComponent(row.referral_reference)}`;
  }
  return null;
}

export async function listNotifications(actor: Actor, filter: NotificationFilter = "all") {
  const condition = filter === "unread"
    ? "AND n.read_at IS NULL AND n.archived_at IS NULL"
    : filter === "archived"
      ? "AND n.archived_at IS NOT NULL"
      : "AND n.archived_at IS NULL";
  const rows = await getRawDb().prepare(`SELECT n.id,n.type,n.title,n.body,n.read_at,
    n.archived_at,n.created_at,n.related_type,a.reference AS application_reference,
    r.reference AS referral_reference FROM notifications n
    LEFT JOIN applications a ON n.related_type='APPLICATION' AND a.id=n.related_id
    LEFT JOIN referrals r ON n.related_type='REFERRAL' AND r.id=n.related_id
    WHERE n.user_id=? ${condition} ORDER BY n.created_at DESC LIMIT 100`)
    .bind(actor.id).all<NotificationRow>();
  const unread = await getRawDb().prepare(`SELECT COUNT(*) AS total FROM notifications
    WHERE user_id=? AND read_at IS NULL AND archived_at IS NULL`)
    .bind(actor.id).first<{ total: number }>();
  return {
    unreadCount: Number(unread?.total ?? 0),
    notifications: rows.results.map((row): NotificationRecord => ({
      id: row.id,
      type: row.type,
      title: row.title,
      body: row.body,
      readAt: row.read_at,
      archivedAt: row.archived_at,
      createdAt: row.created_at,
      href: notificationHref(row),
    })),
  };
}

export async function updateNotification(actor: Actor, id: string, action: "READ" | "UNREAD" | "ARCHIVE") {
  const notification = await getRawDb().prepare("SELECT id FROM notifications WHERE id=? AND user_id=? LIMIT 1")
    .bind(id, actor.id).first<{ id: string }>();
  if (!notification) throw new CatalogError("Notification not found.", 404);
  const set = action === "READ"
    ? "read_at=CURRENT_TIMESTAMP"
    : action === "UNREAD"
      ? "read_at=NULL"
      : "archived_at=CURRENT_TIMESTAMP,read_at=COALESCE(read_at,CURRENT_TIMESTAMP)";
  await getRawDb().prepare(`UPDATE notifications SET ${set} WHERE id=? AND user_id=?`)
    .bind(id, actor.id).run();
  return { updated: true };
}

export async function markAllNotificationsRead(actor: Actor) {
  await getRawDb().prepare(`UPDATE notifications SET read_at=CURRENT_TIMESTAMP
    WHERE user_id=? AND read_at IS NULL AND archived_at IS NULL`).bind(actor.id).run();
  return { updated: true };
}
