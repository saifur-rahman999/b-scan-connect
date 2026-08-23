export default function DiscoveryLoading() {
  return (
    <main id="main-content" className="catalog-state-page" aria-busy="true">
      <div className="shell">
        <div className="state-spinner" aria-hidden="true" />
        <h1>Loading listings</h1>
        <p>Preparing the latest published services and opportunities.</p>
      </div>
    </main>
  );
}
