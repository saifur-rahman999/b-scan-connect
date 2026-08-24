import type { Metadata } from "next";
import { requireChatGPTUser } from "../chatgpt-auth";
import { requireCatalogActor } from "../../db/catalog-repository";
import { StakeholderWorkspace } from "./role-workspace";

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
  return <StakeholderWorkspace accountName={actor.displayName} accountRole={actor.role} />;
}
