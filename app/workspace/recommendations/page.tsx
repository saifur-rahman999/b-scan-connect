import type { Metadata } from "next";
import Link from "next/link";
import { requireChatGPTUser } from "../../chatgpt-auth";
import { requireCatalogActor } from "../../../db/catalog-repository";
import { buildRecommendations } from "../../../db/member-experience";
import { kindLabels } from "../../../data/catalog";
import { SaveListingButton } from "../../save-listing-button";
import { MemberNav } from "../member-nav";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Recommendations", description: "Explainable opportunity and service recommendations." };

export default async function RecommendationsPage() {
  await requireChatGPTUser("/workspace/recommendations");
  const { profile, recommendations } = await buildRecommendations(await requireCatalogActor());
  return <div className="member-page"><MemberNav active="recommendations" /><main id="main-content" className="shell member-main"><div className="member-title"><p className="workspace-kicker">Personal workspace</p><h1>Recommendations</h1><p>Listings ranked using the preferences you choose, with a clear explanation for every result.</p></div>
    {!profile.recommendationConsent ? <section className="consent-callout"><span aria-hidden="true">✦</span><div><h2>Turn on personalized recommendations</h2><p>Your profile is only used after you choose to enable ranking. No eligibility decision is made for you.</p><Link className="button" href="/workspace/profile">Review profile settings</Link></div></section>
      : <><div className="recommendation-summary"><div><strong>{recommendations.length}</strong><span>ranked listings</span></div><p>Based on profile version {profile.profileVersion}. Update your profile at any time to recalculate these results.</p><Link href="/workspace/profile">Update profile</Link></div><div className="recommendation-list">{recommendations.map((result) => <article className="recommendation-card" key={result.item.id}><div className="recommendation-score"><strong>{result.score}</strong><span>{result.matchLevel} match</span><small>{result.confidence} confidence</small></div><div className="recommendation-body"><div className="recommendation-top"><span className={`kind-badge ${result.item.kind}`}>{kindLabels[result.item.kind]}</span><SaveListingButton listingId={result.item.id} title={result.item.title} compact /></div><h2><Link href={`/discover/${result.item.slug}`}>{result.item.title}</Link></h2><p className="catalog-org">{result.item.organization} · {result.item.district} · {result.item.deliveryMode}</p><p>{result.item.summary}</p><details open><summary>Why this result?</summary><div className="explanation-columns"><div><h3>What aligns</h3><ul>{result.contributingFactors.map((factor) => <li key={factor}>✓ {factor}</li>)}</ul></div>{result.conflicts.length > 0 && <div><h3>Check before continuing</h3><ul>{result.conflicts.map((conflict) => <li key={conflict}>! {conflict}</li>)}</ul></div>}{result.missingInformation.length > 0 && <div><h3>Could improve this result</h3><ul>{result.missingInformation.map((missing) => <li key={missing}>○ {missing}</li>)}</ul></div>}</div></details><Link className="catalog-card-link" href={`/discover/${result.item.slug}`}>Review listing details →</Link></div></article>)}</div></>}
  </main></div>;
}
