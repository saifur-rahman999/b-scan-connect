import Link from "next/link";
import { AccessibilityTools } from "./accessibility-tools";

export function LegalNav() {
  return <header className="catalog-header"><div className="shell catalog-header-inner">
    <Link className="brand" href="/"><span className="brand-mark">B</span><span><strong>B-SCAN</strong><small>Connect</small></span></Link>
    <nav aria-label="Public information"><Link href="/discover">Discover</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav>
    <AccessibilityTools />
  </div></header>;
}
