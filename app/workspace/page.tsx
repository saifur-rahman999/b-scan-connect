import type { Metadata } from "next";
import { requireChatGPTUser } from "../chatgpt-auth";
import { requireCatalogActor } from "../../db/catalog-repository";
import { redirect } from "next/navigation";
import {getMemberDashboard} from "../../db/member-experience";
import {MemberDashboard} from "./member-dashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stakeholder Workspace",
  description: "Explore the B-SCAN Connect role-aware workspace.",
  openGraph: { images: [] },
  twitter: { images: [] },
};

export default async function WorkspacePage() {
  await requireChatGPTUser("/workspace");
  const actor = await requireCatalogActor();
  if(actor.role==="ADMIN")redirect("/workspace/admin");
  if(actor.role==="REFERRAL_OFFICER")redirect("/workspace/referrals/queue");
  if(actor.role==="ORG_REP")redirect("/workspace/applications/queue");
  return <MemberDashboard actor={actor} data={await getMemberDashboard(actor)}/>;
}
