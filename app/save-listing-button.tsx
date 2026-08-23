"use client";

import { useEffect, useState } from "react";

export function SaveListingButton({ listingId, title, compact = false, initialSaved = false }: { listingId?: string; title: string; compact?: boolean; initialSaved?: boolean }) {
  const [saved, setSaved] = useState(initialSaved);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!listingId || initialSaved) return;
    let active = true;
    fetch("/api/saved", { cache: "no-store" }).then(async (response) => {
      if (!response.ok) return;
      const result = await response.json() as { listings?: { id?: string }[] };
      if (active) setSaved(Boolean(result.listings?.some((item) => item.id === listingId)));
    }).catch(() => undefined);
    return () => { active = false; };
  }, [initialSaved, listingId]);

  const update = async () => {
    if (!listingId) { setError("This listing cannot be saved right now."); return; }
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/saved", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ listingId, saved: !saved }) });
      const result = await response.json() as { saved?: boolean; error?: string };
      if (!response.ok) throw new Error(result.error || "The saved item could not be updated.");
      setSaved(Boolean(result.saved));
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "The saved item could not be updated."); }
    finally { setBusy(false); }
  };

  return <span className="save-control"><button type="button" className={`${compact ? "" : "save-detail"} ${saved ? "saved" : ""}`} disabled={busy} onClick={() => void update()} aria-label={saved ? `Remove ${title} from saved items` : `Save ${title}`} aria-pressed={saved}>{busy ? "Saving…" : saved ? "♥ Saved" : compact ? "♡ Save" : "♡ Save this listing"}</button>{error && <small role="alert">{error}</small>}</span>;
}
