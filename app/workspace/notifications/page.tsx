import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { requireCatalogActor } from "../../../db/catalog-repository";
import { listNotifications, type NotificationFilter } from "../../../db/notification-repository";
import { MemberNav } from "../member-nav";
import { NotificationActions, NotificationToolbar } from "./notification-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Notifications", description: "Review application and referral updates." };
const filters = new Set<NotificationFilter>(["all", "unread", "archived"]);
const time = (value: string) => new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<{ filter?: string }> }) {
  await requireChatGPTUser("/workspace/notifications");
  const query = await searchParams;
  const filter = filters.has(query.filter as NotificationFilter) ? query.filter as NotificationFilter : "all";
  const { notifications, unreadCount } = await listNotifications(await requireCatalogActor(), filter);
  return <div className="member-page"><MemberNav active="notifications" /><main id="main-content" className="shell member-main">
    <div className="notification-title-row"><div className="member-title"><p className="workspace-kicker">Personal workspace</p><h1>Notifications</h1><p>Follow referral decisions, application progress and important next steps.</p></div><NotificationToolbar unreadCount={unreadCount} /></div>
    <div className="notification-tabs" role="navigation" aria-label="Notification filters"><Link className={filter === "all" ? "active" : ""} href="/workspace/notifications">Current</Link><Link className={filter === "unread" ? "active" : ""} href="/workspace/notifications?filter=unread">Unread <span>{unreadCount}</span></Link><Link className={filter === "archived" ? "active" : ""} href="/workspace/notifications?filter=archived">Archived</Link></div>
    {notifications.length ? <div className="notification-list">{notifications.map((notification) => <article className={!notification.readAt ? "unread" : ""} key={notification.id}><span className="notification-symbol" aria-hidden="true">{notification.type.includes("APPLICATION") ? "▤" : notification.type.includes("REFERRAL") ? "↗" : "◇"}</span><div className="notification-copy"><div><h2>{notification.href ? <Link href={notification.href}>{notification.title}</Link> : notification.title}</h2>{!notification.readAt && <em>New</em>}</div><p>{notification.body}</p><small>{time(notification.createdAt)}</small>{notification.href && <Link className="notification-open" href={notification.href}>Open related record →</Link>}</div><NotificationActions id={notification.id} unread={!notification.readAt} archived={Boolean(notification.archivedAt)} /></article>)}</div>
      : <div className="empty-state member-empty"><span aria-hidden="true">✓</span><h2>{filter === "unread" ? "You are all caught up" : filter === "archived" ? "No archived notifications" : "No notifications yet"}</h2><p>Updates from your referrals and applications will appear here.</p></div>}
  </main></div>;
}
