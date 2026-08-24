import type {Metadata} from "next";
import Link from "next/link";
import {requireChatGPTUser} from "../../../chatgpt-auth";
import {requireCatalogActor} from "../../../../db/catalog-repository";
import {getReferralTimeline} from "../../../../db/referral-repository";
import {MemberNav} from "../../member-nav";
import {OperationsNav} from "../../operations-nav";
import {ReferralActions} from "./referral-actions";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Referral details",description:"Track a B-SCAN Connect referral."};
const status=(value:string)=>value.toLowerCase().replaceAll("_"," ");
const time=(value:string)=>new Intl.DateTimeFormat("en-BD",{day:"numeric",month:"short",year:"numeric",hour:"numeric",minute:"2-digit"}).format(new Date(value));

async function Content({params,searchParams}:{params:Promise<{reference:string}>;searchParams:Promise<{queue?:string;created?:string}>}){
  const {reference}=await params;const query=await searchParams;const queueAccess=query.queue==="1";
  await requireChatGPTUser(`/workspace/referrals/${encodeURIComponent(reference)}${queueAccess?"?queue=1":""}`);
  const actor=await requireCatalogActor();
  const {referral,events,messages}=await getReferralTimeline(actor,reference,queueAccess);
  return <>{queueAccess?<OperationsNav active="referrals" role={actor.role as "ADMIN"|"REFERRAL_OFFICER"|"ORG_REP"}/>:<MemberNav active="referrals"/>}<main id="main-content" className="shell member-main">
    {query.created==="1"&&<div className="success-notice" role="status"><span>✓</span><div><b>Referral submitted</b><p>Your reference is {referral.reference}. You can return here to follow every update.</p></div></div>}
    <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href={queueAccess?"/workspace/referrals/queue":"/workspace/referrals"}>{queueAccess?"Referral queue":"My referrals"}</Link><span>/</span><span>{referral.reference}</span></nav>
    <div className="referral-detail-title"><div><span className={`referral-status ${referral.status.toLowerCase()}`}>{status(referral.status)}</span><h1>{referral.listingTitle}</h1><p>{referral.organization} · {referral.district}</p></div><div><small>Referral reference</small><strong>{referral.reference}</strong></div></div>
    <div className="referral-detail-grid"><div className="referral-detail-main"><section><h2>{queueAccess?"Member request":"Your request"}</h2><p>{referral.requestSummary}</p><dl><div><dt>Submitted</dt><dd>{time(referral.createdAt)}</dd></div><div><dt>Assigned officer</dt><dd>{referral.assignedOfficerName??"Waiting for assignment"}</dd></div></dl></section><section><h2>Referral timeline</h2><div className="referral-timeline">{events.map(event=><article key={event.id}><span aria-hidden="true">✓</span><div><b>{event.summary}</b><p>{event.actorName} · {time(event.createdAt)}</p></div></article>)}</div></section><section><h2>Messages</h2>{messages.length?<div className="referral-messages">{messages.map(message=><article key={message.id}><div><b>{message.authorName}</b><small>{time(message.createdAt)}</small></div><p>{message.message}</p></article>)}</div>:<p className="muted-copy">No messages yet. Updates and questions will appear here.</p>}</section></div><ReferralActions reference={referral.reference} status={referral.status} queueAccess={queueAccess}/></div>
  </main></>;
}
export default function Page(props:{params:Promise<{reference:string}>;searchParams:Promise<{queue?:string;created?:string}>}){return <div className="member-page"><Content {...props}/></div>}
