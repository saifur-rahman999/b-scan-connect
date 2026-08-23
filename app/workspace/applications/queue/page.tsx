import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../../chatgpt-auth";
import { requireCatalogActor } from "../../../../db/catalog-repository";
import { listApplicationQueue } from "../../../../db/application-repository";
import { MemberNav } from "../../member-nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Application queue", description: "Review submitted applications." };
const stage = (value: string) => value.toLowerCase().replaceAll("_", " ");
const date = (value: string) => new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

export default async function ApplicationQueuePage() {
  await requireChatGPTUser("/workspace/applications/queue");
  const applications = await listApplicationQueue(await requireCatalogActor());
  return <div className="member-page"><MemberNav active="applications" /><main id="main-content" className="shell member-main">
    <div className="member-title"><p className="workspace-kicker">Stakeholder workspace</p><h1>Application queue</h1><p>Review submitted applications, record selection decisions and schedule the next step.</p></div>
    {applications.length ? <div className="application-queue" role="table" aria-label="Applications"><div className="application-queue-row application-queue-head" role="row"><span role="columnheader">Reference</span><span role="columnheader">Applicant and opportunity</span><span role="columnheader">Organization</span><span role="columnheader">Stage</span><span role="columnheader">Updated</span><span role="columnheader">Action</span></div>{applications.map((item) => <div className="application-queue-row" role="row" key={item.id}><span role="cell"><b>{item.reference}</b><small>{item.applicationType.toLowerCase()}</small></span><span role="cell"><b>{item.applicantName}</b><small>{item.listingTitle}</small></span><span role="cell">{item.organization}</span><span role="cell"><em className={`application-stage ${item.stage.toLowerCase()}`}>{stage(item.stage)}</em></span><span role="cell">{date(item.updatedAt)}</span><span role="cell"><Link href={`/workspace/applications/${item.reference}?queue=1`}>Review →</Link></span></div>)}</div>
      : <div className="empty-state member-empty"><span aria-hidden="true">✓</span><h2>The queue is clear</h2><p>Submitted applications will appear here for review.</p></div>}
  </main></div>;
}
