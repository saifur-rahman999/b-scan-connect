import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../../chatgpt-auth";
import { requireCatalogActor } from "../../../../db/catalog-repository";
import { getApplicationTimeline } from "../../../../db/application-repository";
import { MemberNav } from "../../member-nav";
import { OperationsNav } from "../../operations-nav";
import { ApplicationActions } from "./application-actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Application details", description: "Track an application in B-SCAN Connect." };
const stage = (value: string) => value.toLowerCase().replaceAll("_", " ");
const time = (value: string) => new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" }).format(new Date(value));

async function Content({ params, searchParams }: { params: Promise<{ reference: string }>; searchParams: Promise<{ queue?: string; created?: string }> }) {
  const { reference } = await params;
  const query = await searchParams;
  const queueAccess = query.queue === "1";
  await requireChatGPTUser(`/workspace/applications/${encodeURIComponent(reference)}${queueAccess ? "?queue=1" : ""}`);
  const actor = await requireCatalogActor();
  const { application, events } = await getApplicationTimeline(actor, reference, queueAccess);
  return <>
    {queueAccess ? <OperationsNav active="applications" role={actor.role as "ADMIN"|"REFERRAL_OFFICER"|"ORG_REP"} /> : <MemberNav active="applications" />}
    <main id="main-content" className="shell member-main">
      {query.created === "1" && <div className="success-notice" role="status"><span>✓</span><div><b>Application saved</b><p>Your reference is {application.reference}. Review the preparation information and submit when ready.</p></div></div>}
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href={queueAccess ? "/workspace/applications/queue" : "/workspace/applications"}>{queueAccess ? "Application queue" : "My applications"}</Link><span>/</span><span>{application.reference}</span></nav>
      <div className="application-detail-title"><div><span className={`application-stage ${application.stage.toLowerCase()}`}>{stage(application.stage)}</span><h1>{application.listingTitle}</h1><p>{application.organization} · {application.district}</p></div><div><small>Application reference</small><strong>{application.reference}</strong></div></div>
      <div className="application-detail-grid"><div className="application-detail-main">
        <section><h2>{queueAccess ? "Applicant summary" : "Your preparation"}</h2><p>{application.preparationInfo}</p><dl><div><dt>Applicant</dt><dd>{application.applicantName}</dd></div><div><dt>Started</dt><dd>{time(application.createdAt)}</dd></div><div><dt>Type</dt><dd>{application.applicationType.toLowerCase()}</dd></div><div><dt>Submitted</dt><dd>{application.submittedAt ? time(application.submittedAt) : "Not submitted"}</dd></div></dl></section>
        {!queueAccess && application.privateNotes && <section className="private-notes"><h2>Private notes</h2><p>{application.privateNotes}</p><small>Only you can see these notes.</small></section>}
        <section><h2>Application timeline</h2><div className="application-timeline">{events.map((event) => <article key={event.id}><span aria-hidden="true">✓</span><div><b>{stage(event.toStage)}</b>{event.instructions && <p>{event.instructions}</p>}<small>{event.actorName} · {time(event.createdAt)}{event.importantDate ? ` · Important date: ${time(event.importantDate)}` : ""}</small></div></article>)}</div></section>
      </div><ApplicationActions reference={application.reference} stage={application.stage} queueAccess={queueAccess} preparationInfo={application.preparationInfo} privateNotes={application.privateNotes} /></div>
    </main>
  </>;
}

export default function Page(props: { params: Promise<{ reference: string }>; searchParams: Promise<{ queue?: string; created?: string }> }) {
  return <div className="member-page"><Content {...props} /></div>;
}
