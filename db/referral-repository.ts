import { getRawDb } from ".";
import { CatalogError, type Actor } from "./catalog-repository";

export type ReferralStatus = "SUBMITTED" | "ASSIGNED" | "INFORMATION_REQUESTED" | "REFERRED" | "ACCEPTED" | "DECLINED" | "COMPLETED" | "CANCELLED";
export type ReferralAction = "ASSIGN" | "REQUEST_INFORMATION" | "REFER" | "ACCEPT" | "DECLINE" | "COMPLETE" | "CANCEL";
export type ReferralRecord = { id:string; reference:string; userId:string; listingId:string; listingSlug:string; listingTitle:string; organization:string; district:string; status:ReferralStatus; requestSummary:string; assignedOfficerId:string|null; assignedOfficerName:string|null; createdAt:string; updatedAt:string };
type ReferralRow = { id:string; reference:string; user_id:string; catalog_listing_id:string; status:ReferralStatus; request_summary:string; assigned_officer_id:string|null; created_at:string; updated_at:string; listing_slug:string; listing_title:string; organization_name:string; organization_id:string|null; district:string; officer_name:string|null };
const terminal = new Set<ReferralStatus>(["DECLINED","COMPLETED","CANCELLED"]);
const selectReferral = `SELECT r.id,r.reference,r.user_id,r.catalog_listing_id,r.status,r.request_summary,r.assigned_officer_id,r.created_at,r.updated_at,c.slug AS listing_slug,c.title AS listing_title,c.organization_name,c.organization_id,c.district,officer.display_name AS officer_name FROM referrals r JOIN catalog_listings c ON c.id=r.catalog_listing_id LEFT JOIN users officer ON officer.id=r.assigned_officer_id`;
const mapReferral = (row:ReferralRow):ReferralRecord => ({ id:row.id,reference:row.reference,userId:row.user_id,listingId:row.catalog_listing_id,listingSlug:row.listing_slug,listingTitle:row.listing_title,organization:row.organization_name,district:row.district,status:row.status,requestSummary:row.request_summary,assignedOfficerId:row.assigned_officer_id,assignedOfficerName:row.officer_name,createdAt:row.created_at,updatedAt:row.updated_at });

export async function createReferral(actor:Actor, listingId:string, summary:string) {
  const d1=getRawDb();
  const listing=await d1.prepare("SELECT id,title FROM catalog_listings WHERE id=? AND kind='service' AND status='PUBLISHED' LIMIT 1").bind(listingId).first<{id:string;title:string}>();
  if(!listing) throw new CatalogError("That service is not available for referrals.",404);
  const requestSummary=summary.trim().slice(0,1200);
  if(requestSummary.length<20) throw new CatalogError("Add a short description of the support you are requesting.",400);
  const existing=await d1.prepare("SELECT reference FROM referrals WHERE user_id=? AND catalog_listing_id=? AND status NOT IN ('DECLINED','COMPLETED','CANCELLED') LIMIT 1").bind(actor.id,listingId).first<{reference:string}>();
  if(existing) throw new CatalogError(`You already have an active referral for this service (${existing.reference}).`,409);
  const id=crypto.randomUUID(); const reference=`BSC-R-${Date.now().toString().slice(-8)}`;
  await d1.batch([
    d1.prepare("INSERT INTO referrals (id,reference,user_id,catalog_listing_id,status,request_summary) VALUES (?,?,?,?,'SUBMITTED',?)").bind(id,reference,actor.id,listingId,requestSummary),
    d1.prepare("INSERT INTO referral_events (id,referral_id,actor_id,event_type,from_status,to_status,summary) VALUES (?,?,?,'CREATED',NULL,'SUBMITTED','Referral submitted for review.')").bind(crypto.randomUUID(),id,actor.id),
    d1.prepare("INSERT INTO notifications (id,user_id,type,title,body,related_type,related_id) VALUES (?,?,'REFERRAL_CREATED','Referral submitted',?,'REFERRAL',?)").bind(crypto.randomUUID(),actor.id,`${reference} for ${listing.title} was submitted.`,id),
    d1.prepare("INSERT INTO activity_logs (id,actor_id,action,entity_type,entity_id,summary) VALUES (?,?,'REFERRAL_CREATED','REFERRAL',?,?)").bind(crypto.randomUUID(),actor.id,id,`${reference}: referral submitted`),
  ]);
  return getReferral(actor,reference,false);
}

export async function listMyReferrals(actor:Actor){ const rows=await getRawDb().prepare(`${selectReferral} WHERE r.user_id=? ORDER BY r.updated_at DESC`).bind(actor.id).all<ReferralRow>(); return rows.results.map(mapReferral); }

export async function listReferralQueue(actor:Actor){
  if(!["ADMIN","REFERRAL_OFFICER","ORG_REP"].includes(actor.role)) throw new CatalogError("Referral queue access is required.",403);
  const where=actor.role==="ORG_REP"?"WHERE r.status IN ('REFERRED','ACCEPTED') AND EXISTS (SELECT 1 FROM organization_memberships m WHERE m.user_id=? AND m.organization_id=c.organization_id)":"WHERE r.status NOT IN ('COMPLETED','CANCELLED')";
  const query=getRawDb().prepare(`${selectReferral} ${where} ORDER BY CASE r.status WHEN 'SUBMITTED' THEN 0 WHEN 'INFORMATION_REQUESTED' THEN 1 ELSE 2 END,r.updated_at DESC`);
  const rows=actor.role==="ORG_REP"?await query.bind(actor.id).all<ReferralRow>():await query.all<ReferralRow>(); return rows.results.map(mapReferral);
}

export async function getReferral(actor:Actor, reference:string, queueAccess=false){
  const row=await getRawDb().prepare(`${selectReferral} WHERE r.reference=? LIMIT 1`).bind(reference).first<ReferralRow>();
  if(!row) throw new CatalogError("Referral not found.",404);
  if(row.user_id!==actor.id){
    if(!queueAccess||!["ADMIN","REFERRAL_OFFICER","ORG_REP"].includes(actor.role)) throw new CatalogError("You do not have access to this referral.",403);
    if(actor.role==="ORG_REP"){
      const membership=await getRawDb().prepare("SELECT id FROM organization_memberships WHERE user_id=? AND organization_id=? LIMIT 1").bind(actor.id,row.organization_id).first<{id:string}>();
      if(!membership) throw new CatalogError("You do not have access to this organization’s referrals.",403);
    }
  }
  return mapReferral(row);
}

export async function getReferralTimeline(actor:Actor, reference:string, queueAccess=false){
  const referral=await getReferral(actor,reference,queueAccess); const d1=getRawDb();
  const events=await d1.prepare("SELECT e.id,e.event_type,e.from_status,e.to_status,e.summary,e.created_at,u.display_name AS actor_name FROM referral_events e JOIN users u ON u.id=e.actor_id WHERE e.referral_id=? ORDER BY e.created_at ASC").bind(referral.id).all<{id:string;event_type:string;from_status:string|null;to_status:string|null;summary:string;created_at:string;actor_name:string}>();
  const messages=await d1.prepare("SELECT m.id,m.message,m.created_at,u.display_name AS author_name FROM referral_messages m JOIN users u ON u.id=m.author_id WHERE m.referral_id=? AND m.visibility='USER_VISIBLE' ORDER BY m.created_at ASC").bind(referral.id).all<{id:string;message:string;created_at:string;author_name:string}>();
  return {referral,events:events.results.map(e=>({id:e.id,eventType:e.event_type,fromStatus:e.from_status,toStatus:e.to_status,summary:e.summary,createdAt:e.created_at,actorName:e.actor_name})),messages:messages.results.map(m=>({id:m.id,message:m.message,createdAt:m.created_at,authorName:m.author_name}))};
}

const transitions:Record<ReferralAction,{roles:Actor["role"][]|"OWNER";from:ReferralStatus[];to:ReferralStatus;summary:string}>={
  ASSIGN:{roles:["ADMIN","REFERRAL_OFFICER"],from:["SUBMITTED"],to:"ASSIGNED",summary:"Referral assigned for review."},
  REQUEST_INFORMATION:{roles:["ADMIN","REFERRAL_OFFICER"],from:["SUBMITTED","ASSIGNED"],to:"INFORMATION_REQUESTED",summary:"Additional information requested from the member."},
  REFER:{roles:["ADMIN","REFERRAL_OFFICER"],from:["SUBMITTED","ASSIGNED","INFORMATION_REQUESTED"],to:"REFERRED",summary:"Referral shared with the service organization."},
  ACCEPT:{roles:["ADMIN","ORG_REP"],from:["REFERRED"],to:"ACCEPTED",summary:"The service organization accepted the referral."},
  DECLINE:{roles:["ADMIN","ORG_REP"],from:["REFERRED"],to:"DECLINED",summary:"The service organization could not accept the referral."},
  COMPLETE:{roles:["ADMIN","REFERRAL_OFFICER"],from:["ACCEPTED"],to:"COMPLETED",summary:"Referral marked complete."},
  CANCEL:{roles:"OWNER",from:["SUBMITTED","ASSIGNED","INFORMATION_REQUESTED","REFERRED","ACCEPTED"],to:"CANCELLED",summary:"Referral cancelled by the member."},
};

export async function transitionReferral(actor:Actor,reference:string,action:ReferralAction,comment?:string){
  const referral=await getReferral(actor,reference,action!=="CANCEL"); const rule=transitions[action];
  if(!rule||!rule.from.includes(referral.status)) throw new CatalogError("That action is not available for the referral’s current status.",409);
  if(rule.roles==="OWNER"){if(referral.userId!==actor.id) throw new CatalogError("Only the member can cancel this referral.",403);} else if(!rule.roles.includes(actor.role)) throw new CatalogError("Your role cannot perform that referral action.",403);
  const d1=getRawDb(); const note=comment?.trim().slice(0,800)||rule.summary; const assigned=action==="ASSIGN"?actor.id:referral.assignedOfficerId; const cancelled=action==="CANCEL"?"CURRENT_TIMESTAMP":"cancelled_at";
  const results=await d1.batch([
    d1.prepare(`UPDATE referrals SET status=?,assigned_officer_id=?,cancelled_at=${cancelled},updated_at=CURRENT_TIMESTAMP WHERE id=? AND status=?`).bind(rule.to,assigned,referral.id,referral.status),
    d1.prepare("INSERT INTO referral_events (id,referral_id,actor_id,event_type,from_status,to_status,summary) SELECT ?,?,?,?,?,?,? WHERE changes()=1").bind(crypto.randomUUID(),referral.id,actor.id,action,referral.status,rule.to,note),
    d1.prepare("INSERT INTO notifications (id,user_id,type,title,body,related_type,related_id) SELECT ?,?,'REFERRAL_UPDATED','Referral updated',?,'REFERRAL',? WHERE changes()=1").bind(crypto.randomUUID(),referral.userId,`${referral.reference}: ${rule.to.toLowerCase().replaceAll("_"," ")}.`,referral.id),
  ]);
  if(Number(results[0].meta.changes??0)!==1) throw new CatalogError("The referral changed before this action completed. Refresh and try again.",409);
  return getReferral(actor,reference,action!=="CANCEL");
}

export async function addReferralMessage(actor:Actor,reference:string,message:string,queueAccess=false){
  const referral=await getReferral(actor,reference,queueAccess); if(terminal.has(referral.status)) throw new CatalogError("Messages are closed for this referral.",409);
  const text=message.trim().slice(0,1200); if(text.length<2) throw new CatalogError("Write a message before sending.",400); const d1=getRawDb();
  await d1.batch([d1.prepare("INSERT INTO referral_messages (id,referral_id,author_id,visibility,message) VALUES (?,?,?,'USER_VISIBLE',?)").bind(crypto.randomUUID(),referral.id,actor.id,text),d1.prepare("UPDATE referrals SET updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(referral.id),d1.prepare("INSERT INTO referral_events (id,referral_id,actor_id,event_type,from_status,to_status,summary) VALUES (?,?,?,'MESSAGE_ADDED',?,?,'New message added to the referral.')").bind(crypto.randomUUID(),referral.id,actor.id,referral.status,referral.status)]); return {sent:true};
}
