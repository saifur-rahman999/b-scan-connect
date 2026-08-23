"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { CatalogItem } from "../../../../data/catalog";
import type { ApplicationRecord } from "../../../../db/application-repository";

export function ApplicationForm({ listing }: { listing: CatalogItem }) {
  const router = useRouter();
  const [preparationInfo, setPreparationInfo] = useState("");
  const [privateNotes, setPrivateNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ listingId: listing.id, preparationInfo, privateNotes }),
      });
      const result = await response.json() as { application?: ApplicationRecord; error?: string };
      if (!response.ok || !result.application) throw new Error(result.error || "The application could not be started.");
      router.push(`/workspace/applications/${result.application.reference}?created=1`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "The application could not be started.");
      setBusy(false);
    }
  };

  return <form className="application-form" onSubmit={submit}>
    <section className="application-listing-card">
      <span className={`kind-badge ${listing.kind}`}>{listing.kind}</span>
      <h2>{listing.title}</h2><p className="catalog-org">{listing.organization}</p>
      <p>{listing.summary}</p><div className="catalog-meta"><span>⌖ {listing.district}</span><span>◫ {listing.deliveryMode}</span></div>
    </section>
    <section>
      <div className="member-section-heading"><span>1</span><div><h2>Application summary</h2><p>Record the experience, strengths or motivation you want to use for this opportunity.</p></div></div>
      <label className="field-label"><span>Preparation information</span><textarea required minLength={20} maxLength={2000} rows={8} value={preparationInfo} onChange={(event) => setPreparationInfo(event.target.value)} placeholder="Summarize why this opportunity fits your goals and the relevant skills or experience you want to highlight."/><small>{preparationInfo.length}/2000 characters</small></label>
      <label className="field-label"><span>Private notes</span><textarea maxLength={2000} rows={4} value={privateNotes} onChange={(event) => setPrivateNotes(event.target.value)} placeholder="Optional reminders visible only in your personal application view."/><small>{privateNotes.length}/2000 characters</small></label>
    </section>
    <section>
      <div className="member-section-heading"><span>2</span><div><h2>Save before submitting</h2><p>This creates a private preparation record. The organization will not review it until you select Submit application.</p></div></div>
      <label className="confirmation-check"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)}/><span><b>I have reviewed this information</b><small>I understand that saving creates an application record but does not submit it to the organization.</small></span></label>
    </section>
    {error && <div className="error-notice" role="alert"><span>!</span><div><b>Application not started</b><p>{error}</p></div></div>}
    <div className="member-form-actions"><Link className="button button-secondary" href={`/discover/${listing.slug}`}>Cancel</Link><button className="button" type="submit" disabled={!confirmed || busy}>{busy ? "Saving…" : "Save application"}</button></div>
  </form>;
}
