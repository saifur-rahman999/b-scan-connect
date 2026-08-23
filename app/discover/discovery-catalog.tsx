"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AccessibilityTools } from "../accessibility-tools";
import { SaveListingButton } from "../save-listing-button";
import { CatalogItem, CatalogKind, kindLabels } from "../../data/catalog";

type Sort = "recommended" | "deadline" | "title";

export function DiscoveryCatalog({ items }: { items: CatalogItem[] }) {
  const [query, setQuery] = useState("");
  const [kind, setKind] = useState<"all" | CatalogKind>("all");
  const [location, setLocation] = useState("all");
  const [delivery, setDelivery] = useState("all");
  const [sort, setSort] = useState<Sort>("recommended");

  const locations = useMemo(() => [...new Set(items.map((item) => item.district))].sort(), [items]);
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items
      .filter((item) => kind === "all" || item.kind === kind)
      .filter((item) => location === "all" || item.district === location)
      .filter((item) => delivery === "all" || item.deliveryMode === delivery)
      .filter((item) => !normalized || [item.title, item.organization, item.category, item.summary].join(" ").toLowerCase().includes(normalized))
      .sort((a, b) => {
        if (sort === "title") return a.title.localeCompare(b.title);
        if (sort === "deadline") return (a.deadline ?? "zzzz").localeCompare(b.deadline ?? "zzzz");
        return Number(Boolean(b.featured)) - Number(Boolean(a.featured));
      });
  }, [delivery, items, kind, location, query, sort]);

  const clearFilters = () => {
    setQuery("");
    setKind("all");
    setLocation("all");
    setDelivery("all");
    setSort("recommended");
  };

  return (
    <div className="catalog-page">
      <header className="catalog-header">
        <div className="shell catalog-header-inner">
          <Link className="brand" href="/" aria-label="B-SCAN Connect home"><span className="brand-mark">B</span><span><strong>B-SCAN</strong><small>Connect</small></span></Link>
          <nav aria-label="Catalogue navigation"><Link className="active" href="/discover">Discover</Link><Link href="/discover?kind=service">Services</Link><Link href="/discover?kind=job">Jobs</Link><Link href="/discover?kind=training">Learning</Link></nav>
          <div className="header-actions"><AccessibilityTools /><Link className="text-link" href="/workspace">My workspace</Link></div>
        </div>
      </header>

      <main id="main-content">
        <section className="catalog-intro">
          <div className="shell">
            <p className="eyebrow"><span /> Explore the catalogue</p>
            <h1>Find support and opportunities</h1>
            <p>Search verified listings and compare accessibility, eligibility, location and delivery options.</p>
            <label className="catalog-search"><span aria-hidden="true">⌕</span><span className="sr-only">Search listings</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search by keyword, organization or skill" /><button type="button" onClick={() => setQuery("")} aria-label="Clear search">Clear</button></label>
          </div>
        </section>

        <div className="shell catalog-layout">
          <aside className="catalog-filters" aria-label="Filter listings">
            <div className="filter-heading"><h2>Filters</h2><button type="button" onClick={clearFilters}>Clear all</button></div>
            <fieldset><legend>Listing type</legend>{(["all", "service", "job", "training", "education"] as const).map((value) => <label key={value}><input type="radio" name="kind" checked={kind === value} onChange={() => setKind(value)} /><span>{value === "all" ? "All listings" : kindLabels[value]}</span></label>)}</fieldset>
            <label className="filter-select"><span>Location</span><select value={location} onChange={(event) => setLocation(event.target.value)}><option value="all">All Bangladesh</option>{locations.map((value) => <option key={value}>{value}</option>)}</select></label>
            <label className="filter-select"><span>Delivery</span><select value={delivery} onChange={(event) => setDelivery(event.target.value)}><option value="all">Any delivery mode</option><option>In person</option><option>Online</option><option>Hybrid</option></select></label>
            <div className="catalog-assurance"><span aria-hidden="true">✓</span><div><b>Reviewed listings</b><p>Published listings pass an accessibility and quality review.</p></div></div>
          </aside>

          <section className="catalog-results" aria-live="polite">
            <div className="results-toolbar"><div><h2>{results.length} {results.length === 1 ? "listing" : "listings"}</h2><p>Available services and opportunities</p></div><label><span>Sort by</span><select value={sort} onChange={(event) => setSort(event.target.value as Sort)}><option value="recommended">Recommended</option><option value="deadline">Closing soon</option><option value="title">A–Z</option></select></label></div>
            {results.length ? (
              <div className="catalog-grid">
                {results.map((item) => (
                  <article className="catalog-card" key={item.slug}>
                    <div className="catalog-card-top"><span className={`kind-badge ${item.kind}`}>{kindLabels[item.kind]}</span><SaveListingButton listingId={item.id} title={item.title} compact /></div>
                    <h3><Link href={`/discover/${item.slug}`}>{item.title}</Link></h3>
                    <p className="catalog-org">{item.organization}</p>
                    <p className="catalog-summary">{item.summary}</p>
                    <div className="catalog-meta"><span>⌖ {item.district}</span><span>◫ {item.deliveryMode}</span></div>
                    <div className="accessibility-tags">{item.accessibility.slice(0, 2).map((feature) => <span key={feature}>✓ {feature}</span>)}</div>
                    {item.deadline && <p className="catalog-deadline"><b>Deadline</b> {item.deadline}</p>}
                    <Link className="catalog-card-link" href={`/discover/${item.slug}`}>View full details <span aria-hidden="true">→</span></Link>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state"><span aria-hidden="true">⌕</span><h3>No listings match those filters</h3><p>Try a different keyword, location or listing type.</p><button className="button" type="button" onClick={clearFilters}>Reset filters</button></div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
