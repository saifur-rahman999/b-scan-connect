import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { requireCatalogActor } from "../../../db/catalog-repository";
import { listSavedCatalog } from "../../../db/member-experience";
import { kindLabels } from "../../../data/catalog";
import { SaveListingButton } from "../../save-listing-button";
import { MemberNav } from "../member-nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Saved items", description: "Review saved B-SCAN Connect listings." };

export default async function SavedPage() {
  await requireChatGPTUser("/workspace/saved");
  const listings = await listSavedCatalog(await requireCatalogActor());
  return <div className="member-page"><MemberNav active="saved" /><main id="main-content" className="shell member-main"><div className="member-title"><p className="workspace-kicker">Personal workspace</p><h1>Saved items</h1><p>Return to opportunities and services you want to review later.</p></div>
    {listings.length ? <div className="member-card-grid">{listings.map((item) => <article className="member-listing-card" key={item.id}><div><span className={`kind-badge ${item.kind}`}>{kindLabels[item.kind]}</span><SaveListingButton listingId={item.id} title={item.title} compact initialSaved /></div><h2><Link href={`/discover/${item.slug}`}>{item.title}</Link></h2><p className="catalog-org">{item.organization}</p><p>{item.summary}</p><div className="catalog-meta"><span>⌖ {item.district}</span><span>◫ {item.deliveryMode}</span></div><Link className="catalog-card-link" href={`/discover/${item.slug}`}>View full details →</Link></article>)}</div>
      : <div className="empty-state member-empty"><span aria-hidden="true">♡</span><h2>No saved items yet</h2><p>Save a listing from the catalogue and it will appear here on every signed-in device.</p><Link className="button" href="/discover">Explore listings</Link></div>}
  </main></div>;
}
