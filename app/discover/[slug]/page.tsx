import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { catalogItems, getCatalogItem, kindLabels } from "../../../data/catalog";

export function generateStaticParams() {
  return catalogItems.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const item = getCatalogItem(slug);
  if (!item) return { title: "Listing not found" };
  return {
    title: item.title,
    description: item.summary,
    openGraph: { title: item.title, description: item.summary, images: [] },
    twitter: { title: item.title, description: item.summary, images: [] },
  };
}

export default async function ListingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = getCatalogItem(slug);
  if (!item) notFound();

  return (
    <div className="listing-page">
      <header className="catalog-header"><div className="shell catalog-header-inner"><Link className="brand" href="/"><span className="brand-mark">B</span><span><strong>B-SCAN</strong><small>Connect</small></span></Link><nav aria-label="Listing navigation"><Link href="/discover">Discover</Link><Link href="/workspace">My workspace</Link></nav></div></header>
      <main id="main-content">
        <div className="listing-title-band"><div className="shell"><nav className="breadcrumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><Link href="/discover">Discover</Link><span>/</span><span aria-current="page">{kindLabels[item.kind]}</span></nav><span className={`kind-badge ${item.kind}`}>{kindLabels[item.kind]}</span><h1>{item.title}</h1><p className="listing-org">{item.organization}</p><div className="listing-key-meta"><span>⌖ {item.district}, {item.division}</span><span>◫ {item.deliveryMode}</span><span>▦ {item.category}</span></div></div></div>
        <div className="shell listing-layout">
          <article className="listing-content">
            <section><h2>About this listing</h2><p>{item.description}</p></section>
            <section><h2>Who it is for</h2><ul>{item.eligibility.map((value) => <li key={value}><span>✓</span>{value}</li>)}</ul></section>
            <section><h2>Accessibility and adjustments</h2><div className="detail-accessibility">{item.accessibility.map((value) => <div key={value}><span>✓</span>{value}</div>)}</div></section>
            <section><h2>How to take the next step</h2><p>{item.contact}. You can review what information will be shared before confirming.</p></section>
          </article>
          <aside className="listing-action-card">
            <h2>Listing summary</h2>
            {item.salary && <div><small>Salary</small><strong>{item.salary}</strong></div>}
            {item.deadline && <div><small>Deadline</small><strong>{item.deadline}</strong></div>}
            <div><small>Delivery</small><strong>{item.deliveryMode}</strong></div>
            <div><small>Location</small><strong>{item.district}</strong></div>
            <Link className="button" href="/workspace">{item.kind === "service" ? "Request support" : "Continue in workspace"} →</Link>
            <button type="button" className="save-detail">♡ Save this listing</button>
            <p>Your information is not shared until you review and confirm the next step.</p>
          </aside>
        </div>
      </main>
    </div>
  );
}
