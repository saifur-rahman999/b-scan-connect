import { getRawDb } from ".";
import { requireAdmin } from "./admin-repository";
import type { Actor } from "./catalog-repository";

export type SecurityEvent = {
  id: string;
  action: string;
  entityType: string;
  summary: string;
  actorName: string;
  actorEmail: string;
  createdAt: string;
};

export async function getSecurityOverview(actor: Actor) {
  requireAdmin(actor);
  const d1 = getRawDb();
  const [events, suspended, blocked, activeWindows] = await Promise.all([
    d1.prepare(`SELECT l.id,l.action,l.entity_type,l.summary,l.created_at,
      COALESCE(u.display_name,'System') actor_name,COALESCE(u.email,'') actor_email
      FROM activity_logs l LEFT JOIN users u ON u.id=l.actor_id
      WHERE l.action IN ('ADMIN_BOOTSTRAPPED','ACCOUNT_REGISTERED','RATE_LIMITED','USER_CREATED','USER_UPDATED','ORGANIZATION_CREATED','ORGANIZATION_UPDATED','ORGANIZATION_REP_ASSIGN','ORGANIZATION_REP_REMOVE')
      ORDER BY l.created_at DESC LIMIT 60`).all<{
        id:string;action:string;entity_type:string;summary:string;created_at:string;actor_name:string;actor_email:string;
      }>(),
    d1.prepare("SELECT COUNT(*) total FROM users WHERE status IN ('SUSPENDED','DEACTIVATED')").first<{total:number}>(),
    d1.prepare("SELECT COUNT(*) total FROM activity_logs WHERE action='RATE_LIMITED' AND created_at >= datetime('now','-24 hours')").first<{total:number}>(),
    d1.prepare("SELECT COUNT(*) total FROM request_rate_limits WHERE window_started_at >= ?").bind(Math.floor(Date.now()/60000)-5).first<{total:number}>(),
  ]);
  return {
    suspendedUsers:Number(suspended?.total??0),
    blockedRequests24h:Number(blocked?.total??0),
    activeRateWindows:Number(activeWindows?.total??0),
    events:events.results.map((row)=>({id:row.id,action:row.action,entityType:row.entity_type,summary:row.summary,actorName:row.actor_name,actorEmail:row.actor_email,createdAt:row.created_at})) as SecurityEvent[],
  };
}
