import type { Metadata } from "next";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { requireCatalogActor } from "../../../db/catalog-repository";
import { getMemberProfile } from "../../../db/member-experience";
import { MemberNav } from "../member-nav";
import { ProfileForm } from "./profile-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My profile", description: "Manage preferences used for B-SCAN Connect recommendations." };

export default async function ProfilePage() {
  await requireChatGPTUser("/workspace/profile");
  const profile = await getMemberProfile(await requireCatalogActor());
  return <div className="member-page"><MemberNav active="profile" /><main id="main-content" className="shell member-main"><div className="member-title"><p className="workspace-kicker">Personal workspace</p><h1>My profile</h1><p>Keep your preferences up to date to receive clearer, more relevant results.</p></div><ProfileForm initialProfile={profile} /></main></div>;
}
