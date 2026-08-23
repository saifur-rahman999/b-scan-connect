import type { Metadata } from "next";
import { requireChatGPTUser } from "../chatgpt-auth";
import { StakeholderWorkspace } from "./role-workspace";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Stakeholder Workspace",
  description: "Explore the B-SCAN Connect role-aware workspace.",
  openGraph: { images: [] },
  twitter: { images: [] },
};

export default async function WorkspacePage() {
  const user = await requireChatGPTUser("/workspace");
  return <StakeholderWorkspace accountName={user.fullName ?? user.email} />;
}
