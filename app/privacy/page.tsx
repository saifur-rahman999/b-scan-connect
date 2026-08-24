import type { Metadata } from "next";
import Link from "next/link";
import { LegalNav } from "../legal-nav";

export const metadata: Metadata = { title: "Privacy", description: "How B-SCAN Connect handles account and service information." };

export default function PrivacyPage() {
  return <div className="legal-page"><LegalNav /><main id="main-content" className="shell legal-main">
    <p className="workspace-kicker">Privacy information</p><h1>Your information and choices</h1>
    <p className="legal-intro">B-SCAN Connect uses the information you provide to operate your account, improve recommendations, coordinate referrals and track applications. Disability disclosure is voluntary.</p>
    <section><h2>Information we use</h2><p>Account identity, profile preferences, saved listings, referrals, applications, messages and feedback are stored when you use those features. Administrators also retain activity records needed to protect the service and understand important changes.</p></section>
    <section><h2>How information is used</h2><p>Information supports matching, service coordination, application tracking, account administration, safety and accessibility improvements. A match is guidance, not a guarantee of eligibility, admission, employment or service availability.</p></section>
    <section><h2>Who can see information</h2><p>Members see their own records. Referral officers and organization representatives receive only the information needed for their assigned work. Internal notes are restricted to authorized staff. Administrators can access records required to operate and protect the service.</p></section>
    <section><h2>Retention and account requests</h2><p>Workflow records may be retained to preserve decision history, accountability and service continuity. Drafts can be removed where the workflow allows it; established records are closed, cancelled or archived. Contact the service administrator to request access, correction or an account-status change.</p></section>
    <section><h2>Security</h2><p>Protected pages require sign-in and server-side role checks. The service records important administrative actions, limits repeated requests and applies browser security controls. Never include passwords, financial information or unnecessary medical records in messages or feedback.</p></section>
    <div className="legal-callout"><b>Need help?</b><p>Use the <Link href="/workspace/feedback">feedback centre</Link> after signing in, or contact the organization supporting your referral.</p></div>
    <p className="legal-updated">Last reviewed: 24 August 2026</p>
  </main></div>;
}
