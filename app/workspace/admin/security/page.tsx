import type { Metadata } from "next";
import { requireChatGPTUser } from "../../../chatgpt-auth";
import { requireCatalogActor } from "../../../../db/catalog-repository";
import { getSecurityOverview } from "../../../../db/security-repository";
import { AdminNav } from "../admin-nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Security and audit", description: "Review service protection and administrative activity." };
const label=(value:string)=>value.toLowerCase().replaceAll("_"," ").replace(/^./,(c)=>c.toUpperCase());
const time=(value:string)=>new Intl.DateTimeFormat("en-BD",{day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(value));

export default async function SecurityPage() {
  await requireChatGPTUser("/workspace/admin/security");
  const data = await getSecurityOverview(await requireCatalogActor());
  return <div className="member-page"><AdminNav active="security"/><main id="main-content" className="shell member-main">
    <div className="member-title"><p className="workspace-kicker">Service protection</p><h1>Security and audit</h1><p>Review access controls, protected request activity and important administrative changes.</p></div>
    <section className="security-summary" aria-label="Security status">
      <article><span>Protection</span><strong>Active</strong><small>Origin checks, size limits and browser safeguards</small></article>
      <article><span>Blocked in 24 hours</span><strong>{data.blockedRequests24h}</strong><small>Requests stopped by rate controls</small></article>
      <article><span>Restricted accounts</span><strong>{data.suspendedUsers}</strong><small>Suspended or deactivated accounts</small></article>
      <article><span>Recent request windows</span><strong>{data.activeRateWindows}</strong><small>Hashed identities active in the last five minutes</small></article>
    </section>
    <section className="admin-panel security-controls"><div className="admin-panel-heading"><div><h2>Controls in effect</h2><p>Applied to protected pages and service requests.</p></div></div><div>
      <article><span aria-hidden="true">✓</span><div><b>Server-side authorization</b><p>Every protected read and mutation resolves the signed-in workspace role.</p></div></article>
      <article><span aria-hidden="true">✓</span><div><b>Distributed request limits</b><p>Repeated writes are limited across service instances without storing raw identity values.</p></div></article>
      <article><span aria-hidden="true">✓</span><div><b>Cross-site request checks</b><p>State-changing requests must originate from the service and use the expected format.</p></div></article>
      <article><span aria-hidden="true">✓</span><div><b>Protected responses</b><p>Private data is not cached and browser security headers are applied centrally.</p></div></article>
    </div></section>
    <section className="admin-panel security-audit"><div className="admin-panel-heading"><div><h2>Administrative audit trail</h2><p>Recent access and organization changes, newest first.</p></div></div>{data.events.length?<div>{data.events.map((event)=><article key={event.id}><span aria-hidden="true">◇</span><div><b>{label(event.action)}</b><p>{event.summary}</p><small>{event.actorName}{event.actorEmail?` · ${event.actorEmail}`:""}</small></div><time dateTime={event.createdAt}>{time(event.createdAt)}</time></article>)}</div>:<div className="admin-empty">Security-related activity will appear here.</div>}</section>
  </main></div>;
}
