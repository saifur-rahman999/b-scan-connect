import type {Metadata} from "next";
import Link from "next/link";
import {requireChatGPTUser} from "../../chatgpt-auth";
import {requireCatalogActor} from "../../../db/catalog-repository";
import {getAdminAnalytics} from "../../../db/admin-repository";
import {AdminNav} from "./admin-nav";

export const dynamic="force-dynamic";
export const metadata:Metadata={title:"Administration",description:"Monitor participation, services and case workflows."};
const label=(value:string)=>value.toLowerCase().replaceAll("_"," ").replace(/^./,(character)=>character.toUpperCase());
const time=(value:string)=>new Intl.DateTimeFormat("en-BD",{day:"numeric",month:"short",hour:"numeric",minute:"2-digit"}).format(new Date(value));

export default async function AdminPage(){
  await requireChatGPTUser("/workspace/admin");
  const data=await getAdminAnalytics(await requireCatalogActor());
  const cards=[
    ["All accounts",data.totals.accounts,"Every account recorded in the system","/workspace/admin/users"],
    ["Active accounts",data.totals.users,"Accounts currently allowed to sign in","/workspace/admin/users"],
    ["Pending approvals",data.totals.approvals,"Submitted listings awaiting review","/workspace/admin/approvals"],
    ["Published organizations",data.totals.organizations,"Organization records currently visible","/workspace/admin/organizations"],
    ["Published listings",data.totals.listings,"Catalogue records currently visible","/discover"],
    ["Open feedback",data.totals.feedback,"Member reports awaiting resolution","/workspace/admin/feedback"],
    ["Active referrals",data.totals.referrals,"Requests still in progress","/workspace/referrals/queue"],
    ["Active applications",data.totals.applications,"Applications still in progress","/workspace/applications/queue"],
  ] as const;
  return <div className="member-page"><AdminNav active="overview"/><main id="main-content" className="shell member-main"><div className="member-title admin-title"><p className="workspace-kicker">Administration centre</p><h1>System overview</h1><p>Every total below is calculated from current account and workflow records.</p></div><section className="admin-metric-grid" aria-label="Current system totals">{cards.map(([name,value,detail,href])=><Link href={href} key={name}><span>{name}</span><strong>{value}</strong><small>{detail} →</small></Link>)}</section><div className="admin-dashboard-grid"><section className="admin-panel"><div className="admin-panel-heading"><div><h2>Workflow distribution</h2><p>Current referral and application stages.</p></div></div><div className="analytics-columns"><div><h3>Referrals</h3>{data.referralStages.length?data.referralStages.map(item=><p key={item.label}><span>{label(item.label)}</span><strong>{item.value}</strong></p>):<small>No referral activity yet.</small>}</div><div><h3>Applications</h3>{data.applicationStages.length?data.applicationStages.map(item=><p key={item.label}><span>{label(item.label)}</span><strong>{item.value}</strong></p>):<small>No application activity yet.</small>}</div><div><h3>Active roles</h3>{data.roles.length?data.roles.map(item=><p key={item.label}><span>{label(item.label)}</span><strong>{item.value}</strong></p>):<small>No active accounts yet.</small>}</div></div></section><section className="admin-panel"><div className="admin-panel-heading"><div><h2>Recent activity</h2><p>Latest recorded administrative and workflow changes.</p></div></div><div className="admin-activity">{data.activity.length?data.activity.map((item,index)=><article key={`${item.created_at}-${index}`}><span aria-hidden="true">{index+1}</span><div><b>{label(item.action)}</b><p>{item.summary}</p><small>{time(item.created_at)} · {label(item.entity_type)}</small></div></article>):<div className="admin-empty">Activity will appear as work is completed.</div>}</div></section></div></main></div>;
}
