import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { requireCatalogActor } from "../../../db/catalog-repository";
import { listMyApplications } from "../../../db/application-repository";
import { MemberNav } from "../member-nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My applications", description: "Track job and learning applications." };
const stage = (value: string) => value.toLowerCase().replaceAll("_", " ");
const date = (value: string) => new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));

export default async function ApplicationsPage() {
  await requireChatGPTUser("/workspace/applications");
  const applications = await listMyApplications(await requireCatalogActor());
  const active = applications.filter((item) => !["REJECTED", "WITHDRAWN"].includes(item.stage)).length;
  return <div className="member-page"><MemberNav active="applications" /><main id="main-content" className="shell member-main">
    <div className="member-title-row"><div className="member-title"><p className="workspace-kicker">Application workspace</p><h1>My applications</h1><p>Prepare, submit and follow every job or learning opportunity from one timeline.</p></div><Link className="button" href="/discover?kind=job">Find opportunities →</Link></div>
    <div className="application-summary"><div><strong>{applications.length}</strong><span>Total applications</span></div><div><strong>{active}</strong><span>Active</span></div><div><strong>{applications.filter((item) => item.stage === "OFFERED").length}</strong><span>Offers</span></div></div>
    {applications.length ? <div className="application-list">{applications.map((item) => <article key={item.id}><div className="application-list-top"><span className={`application-stage ${item.stage.toLowerCase()}`}>{stage(item.stage)}</span><small>{item.reference}</small></div><h2><Link href={`/workspace/applications/${item.reference}`}>{item.listingTitle}</Link></h2><p className="catalog-org">{item.organization}</p><p>{item.preparationInfo}</p><div className="application-list-meta"><span>{item.applicationType.toLowerCase()}</span><span>Updated {date(item.updatedAt)}</span></div><Link className="catalog-card-link" href={`/workspace/applications/${item.reference}`}>Open application →</Link></article>)}</div>
      : <div className="empty-state member-empty"><span aria-hidden="true">▤</span><h2>No applications yet</h2><p>Choose a job, training or education listing and start preparing your application.</p><Link className="button" href="/discover">Explore opportunities</Link></div>}
  </main></div>;
}
