import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { requireChatGPTUser } from "../../../chatgpt-auth";
import { getPublishedCatalogBySlug } from "../../../../db/catalog-repository";
import { MemberNav } from "../../member-nav";
import { ApplicationForm } from "./application-form";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Start application", description: "Prepare an application in B-SCAN Connect." };

async function Content({ searchParams }: { searchParams: Promise<{ listing?: string }> }) {
  const query = await searchParams;
  await requireChatGPTUser(`/workspace/applications/new${query.listing ? `?listing=${encodeURIComponent(query.listing)}` : ""}`);
  if (!query.listing) notFound();
  const listing = await getPublishedCatalogBySlug(query.listing);
  if (!listing || listing.kind === "service") notFound();
  return <>
    <MemberNav active="applications" />
    <main id="main-content" className="shell member-main">
      <nav className="breadcrumbs" aria-label="Breadcrumb"><Link href={`/discover/${listing.slug}`}>Listing details</Link><span>/</span><span>Start application</span></nav>
      <div className="member-title"><p className="workspace-kicker">Application workspace</p><h1>Prepare your application</h1><p>Save your preparation first, review it, then submit when you are ready.</p></div>
      <ApplicationForm listing={listing} />
    </main>
  </>;
}

export default function Page({ searchParams }: { searchParams: Promise<{ listing?: string }> }) {
  return <div className="member-page"><Content searchParams={searchParams} /></div>;
}
