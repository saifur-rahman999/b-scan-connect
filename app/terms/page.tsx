import type { Metadata } from "next";
import Link from "next/link";
import { LegalNav } from "../legal-nav";

export const metadata: Metadata = { title: "Terms of use", description: "Terms for using B-SCAN Connect." };

export default function TermsPage() {
  return <div className="legal-page"><LegalNav /><main id="main-content" className="shell legal-main">
    <p className="workspace-kicker">Terms of use</p><h1>Using B-SCAN Connect</h1>
    <p className="legal-intro">These terms explain the responsibilities that support a safe, accurate and respectful service.</p>
    <section><h2>Service purpose</h2><p>B-SCAN Connect helps people find services and opportunities, understand possible matches, request referrals and follow applications. Listings and matches support informed decisions but do not promise an outcome.</p></section>
    <section><h2>Your responsibilities</h2><p>Provide information you are authorized to share, keep account details accurate, use respectful language and protect access to your signed-in account. Do not attempt to access another person’s records, disrupt the service or submit harmful content.</p></section>
    <section><h2>Organization responsibilities</h2><p>Participating organizations are responsible for accurate listings, timely responses, appropriate handling of member information and fair decisions. Administrators may request changes, close content or suspend access when information is unsafe, misleading or outdated.</p></section>
    <section><h2>Availability and changes</h2><p>Features may change as services, opportunities and operational requirements evolve. Records may be archived when they are no longer active. Planned or urgent maintenance may temporarily affect availability.</p></section>
    <section><h2>Concerns and review</h2><p>Report incorrect content, accessibility barriers or service concerns through the signed-in feedback centre. Administrators review reports and may preserve relevant activity history while a concern is resolved.</p></section>
    <div className="legal-callout"><b>Read alongside our privacy information</b><p>See how account and workflow information is handled in the <Link href="/privacy">privacy notice</Link>.</p></div>
    <p className="legal-updated">Last reviewed: 24 August 2026</p>
  </main></div>;
}
