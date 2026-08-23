"use client";

export default function DiscoveryError({ reset }: { reset: () => void }) {
  return (
    <main id="main-content" className="catalog-state-page">
      <div className="shell">
        <span aria-hidden="true">!</span>
        <h1>Listings are temporarily unavailable</h1>
        <p>Please try again. Your filters and account information have not been changed.</p>
        <button className="button" type="button" onClick={reset}>Try again</button>
      </div>
    </main>
  );
}
