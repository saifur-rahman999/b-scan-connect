import Link from "next/link";
import { AccessibilityTools } from "../accessibility-tools";

export function MemberNav({ active }: { active: "workspace" | "profile" | "recommendations" | "saved" }) {
  return <header className="member-header"><div className="shell member-header-inner">
    <Link className="brand" href="/"><span className="brand-mark">B</span><span><strong>B-SCAN</strong><small>Connect</small></span></Link>
    <nav aria-label="Member workspace">
      <Link className={active === "workspace" ? "active" : ""} href="/workspace">Overview</Link>
      <Link className={active === "profile" ? "active" : ""} href="/workspace/profile">My profile</Link>
      <Link className={active === "recommendations" ? "active" : ""} href="/workspace/recommendations">Recommendations</Link>
      <Link className={active === "saved" ? "active" : ""} href="/workspace/saved">Saved items</Link>
    </nav>
    <div className="member-header-actions"><AccessibilityTools /><Link href="/discover">Discover</Link></div>
  </div></header>;
}
