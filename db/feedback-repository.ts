import { getRawDb } from ".";
import { CatalogError, type Actor } from "./catalog-repository";
import { requireAdmin } from "./admin-repository";

export type FeedbackStatus="DRAFT"|"SUBMITTED"|"IN_REVIEW"|"RESOLVED"|"ARCHIVED";
export type FeedbackRecord={id:string;reference:string;userId:string;reporter:string;category:string;title:string;description:string;status:FeedbackStatus;assignedToId:string|null;assignee:string|null;response:string;resolvedAt:string|null;createdAt:string;updatedAt:string};
type Row={id:string;reference:string;user_id:string;reporter:string;category:string;title:string;description:string;status:FeedbackStatus;assigned_to_id:string|null;assignee:string|null;response:string|null;resolved_at:string|null;created_at:string;updated_at:string};
const select=`SELECT f.*,reporter.display_name reporter,assignee.display_name assignee FROM feedback_reports f JOIN users reporter ON reporter.id=f.user_id LEFT JOIN users assignee ON assignee.id=f.assigned_to_id`;
const map=(row:Row):FeedbackRecord=>({id:row.id,reference:row.reference,userId:row.user_id,reporter:row.reporter,category:row.category,title:row.title,description:row.description,status:row.status,assignedToId:row.assigned_to_id,assignee:row.assignee,response:row.response??"",resolvedAt:row.resolved_at,createdAt:row.created_at,updatedAt:row.updated_at});
const clean=(value:unknown,limit=2000)=>String(value??"").trim().slice(0,limit);

export async function listMyFeedback(actor:Actor){const rows=await getRawDb().prepare(`${select} WHERE f.user_id=? ORDER BY f.updated_at DESC`).bind(actor.id).all<Row>();return rows.results.map(map);}
export async function listFeedbackQueue(actor:Actor){requireAdmin(actor);const rows=await getRawDb().prepare(`${select} ORDER BY CASE f.status WHEN 'SUBMITTED' THEN 0 WHEN 'IN_REVIEW' THEN 1 WHEN 'RESOLVED' THEN 2 ELSE 3 END,f.updated_at DESC`).all<Row>();return rows.results.map(map);}
export async function createFeedback(actor:Actor,input:Record<string,unknown>){
  const title=clean(input.title,160),description=clean(input.description),category=clean(input.category,60),submit=Boolean(input.submit);
  if(title.length<5||description.length<20||!["ACCESSIBILITY","SERVICE","CONTENT","ACCOUNT","OTHER"].includes(category)) throw new CatalogError("Enter a clear title, category and description.",400);
  const id=crypto.randomUUID(),reference=`BSC-F-${Date.now().toString().slice(-8)}`,status:FeedbackStatus=submit?"SUBMITTED":"DRAFT";
  await getRawDb().batch([
    getRawDb().prepare("INSERT INTO feedback_reports (id,reference,user_id,category,title,description,status) VALUES (?,?,?,?,?,?,?)").bind(id,reference,actor.id,category,title,description,status),
    getRawDb().prepare("INSERT INTO activity_logs (id,actor_id,action,entity_type,entity_id,summary) VALUES (?,?,?,?,?,?)").bind(crypto.randomUUID(),actor.id,`FEEDBACK_${status}`,"FEEDBACK",id,`${reference}: ${title}`),
  ]);return {id,reference,status};
}
export async function updateMyFeedback(actor:Actor,reference:string,input:Record<string,unknown>){
  const current=await getRawDb().prepare("SELECT id,status FROM feedback_reports WHERE reference=? AND user_id=?").bind(reference,actor.id).first<{id:string;status:FeedbackStatus}>();
  if(!current) throw new CatalogError("Feedback report not found.",404); if(current.status!=="DRAFT") throw new CatalogError("Only draft feedback can be edited.",409);
  const title=clean(input.title,160),description=clean(input.description),category=clean(input.category,60),submit=Boolean(input.submit); if(title.length<5||description.length<20) throw new CatalogError("Enter a clear title and description.",400);
  const status:FeedbackStatus=submit?"SUBMITTED":"DRAFT"; await getRawDb().batch([
    getRawDb().prepare("UPDATE feedback_reports SET category=?,title=?,description=?,status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status='DRAFT'").bind(category,title,description,status,current.id),
    getRawDb().prepare("INSERT INTO activity_logs (id,actor_id,action,entity_type,entity_id,summary) VALUES (?,?,?,?,?,?)").bind(crypto.randomUUID(),actor.id,`FEEDBACK_${status}`,"FEEDBACK",current.id,`${reference}: ${title}`),
  ]);return {reference,status};
}
export async function deleteMyFeedback(actor:Actor,reference:string){const result=await getRawDb().prepare("DELETE FROM feedback_reports WHERE reference=? AND user_id=? AND status='DRAFT'").bind(reference,actor.id).run();if(Number(result.meta.changes??0)!==1)throw new CatalogError("Only your draft feedback can be deleted.",409);return {reference};}
export async function transitionFeedback(actor:Actor,reference:string,input:{action?:unknown;response?:unknown}){
  requireAdmin(actor);const action=clean(input.action) as "ASSIGN"|"RESOLVE"|"ARCHIVE"|"REOPEN",response=clean(input.response);const current=await getRawDb().prepare("SELECT id,user_id,title,status FROM feedback_reports WHERE reference=?").bind(reference).first() as {id:string;user_id:string;title:string;status:FeedbackStatus}|null;if(!current)throw new CatalogError("Feedback report not found.",404);
  const transitions:Record<string,Partial<Record<FeedbackStatus,FeedbackStatus>>>={ASSIGN:{SUBMITTED:"IN_REVIEW"},RESOLVE:{SUBMITTED:"RESOLVED",IN_REVIEW:"RESOLVED"},ARCHIVE:{RESOLVED:"ARCHIVED"},REOPEN:{RESOLVED:"IN_REVIEW",ARCHIVED:"IN_REVIEW"}};const next=transitions[action]?.[current.status];if(!next)throw new CatalogError("That feedback action is not available.",409);if(action==="RESOLVE"&&response.length<10)throw new CatalogError("Add a helpful response before resolving the report.",400);
  await getRawDb().batch([
    getRawDb().prepare("UPDATE feedback_reports SET status=?,assigned_to_id=?,response=CASE WHEN ?='' THEN response ELSE ? END,resolved_at=CASE WHEN ?='RESOLVED' THEN CURRENT_TIMESTAMP ELSE NULL END,updated_at=CURRENT_TIMESTAMP WHERE id=? AND status=?").bind(next,actor.id,response,response,next,current.id,current.status),
    getRawDb().prepare("INSERT INTO notifications (id,user_id,type,title,body,related_type,related_id) VALUES (?,?,'FEEDBACK_UPDATED','Feedback update',?,'FEEDBACK',?)").bind(crypto.randomUUID(),current.user_id,`${reference} is now ${next.toLowerCase().replaceAll("_"," ")}.`,current.id),
    getRawDb().prepare("INSERT INTO activity_logs (id,actor_id,action,entity_type,entity_id,summary) VALUES (?,?,?,?,?,?)").bind(crypto.randomUUID(),actor.id,`FEEDBACK_${action}`,"FEEDBACK",current.id,`${reference}: ${current.status} → ${next}`),
  ]);return {reference,status:next};
}
