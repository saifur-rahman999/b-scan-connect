"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { AccessibilityTools } from "../accessibility-tools";
import type { CatalogItem } from "../../data/catalog";

type Role = "user" | "officer" | "representative" | "admin";
type WorkspaceView = "dashboard" | "content";

const roleData: Record<Role, {
  label: string;
  person: string;
  initials: string;
  nav: string[];
  greeting: string;
  subtitle: string;
  stats: { label: string; value: string; detail: string; tone?: string }[];
}> = {
  user: {
    label: "PwD user", person: "Nadia Sultana", initials: "NS",
    nav: ["Dashboard", "My profile", "Recommendations", "Saved items", "My referrals", "My applications", "Notifications", "Feedback"],
    greeting: "Good morning, Nadia", subtitle: "Here is what needs your attention today.",
    stats: [
      { label: "Profile readiness", value: "78%", detail: "3 sections incomplete" },
      { label: "Potential matches", value: "12", detail: "4 new this week", tone: "lime" },
      { label: "Active referrals", value: "3", detail: "1 needs information", tone: "amber" },
      { label: "Applications", value: "4", detail: "1 interview scheduled", tone: "blue" },
    ],
  },
  officer: {
    label: "Referral officer", person: "Farhana Rahman", initials: "FR",
    nav: ["Dashboard", "New referrals", "Assigned referrals", "Waiting for information", "Referred cases", "Appointments", "Completed cases"],
    greeting: "Referral work queue", subtitle: "Review new cases and keep every referral moving.",
    stats: [
      { label: "New referrals", value: "8", detail: "3 high priority", tone: "amber" },
      { label: "Assigned to me", value: "14", detail: "4 due today" },
      { label: "Waiting for user", value: "5", detail: "2 replies received", tone: "blue" },
      { label: "Appointments", value: "6", detail: "Over the next 7 days", tone: "lime" },
    ],
  },
  representative: {
    label: "Organization representative", person: "Tanvir Ahmed", initials: "TA",
    nav: ["Dashboard", "Organization profile", "Services", "Jobs", "Programmes", "Referrals", "Applications", "Notifications"],
    greeting: "Shobuj Pathways Foundation", subtitle: "Manage services, referrals and applicant responses.",
    stats: [
      { label: "Referrals to review", value: "5", detail: "2 received today", tone: "amber" },
      { label: "Active services", value: "7", detail: "1 draft awaiting review" },
      { label: "Open positions", value: "3", detail: "18 total applicants", tone: "blue" },
      { label: "Upcoming appointments", value: "4", detail: "Next: tomorrow, 10:30", tone: "lime" },
    ],
  },
  admin: {
    label: "B-SCAN administrator", person: "Samira Hossain", initials: "SH",
    nav: ["Dashboard", "Users", "Organizations", "Services", "Jobs", "Opportunities", "Approval queue", "Referrals", "Applications", "Feedback", "Analytics"],
    greeting: "System overview", subtitle: "Monitor participation, workflows and catalogue quality.",
    stats: [
      { label: "Active users", value: "248", detail: "+18 this month", tone: "lime" },
      { label: "Pending approvals", value: "9", detail: "3 jobs · 4 services", tone: "amber" },
      { label: "Active referrals", value: "42", detail: "6 require attention" },
      { label: "Applications", value: "73", detail: "11 progressed this week", tone: "blue" },
    ],
  },
};

const activityByRole: Record<Role, { title: string; text: string; status: string; time: string }[]> = {
  user: [
    { title: "Appointment proposed", text: "Community Physiotherapy Programme", status: "Action needed", time: "12 minutes ago" },
    { title: "Interview scheduled", text: "Junior Customer Support Associate", status: "Scheduled", time: "Yesterday" },
    { title: "New training match", text: "Accessible Digital Skills Bootcamp", status: "92% match", time: "2 days ago" },
  ],
  officer: [
    { title: "Information received", text: "Referral BSC-R-1048 · Nadia Sultana", status: "Review reply", time: "8 minutes ago" },
    { title: "Organization accepted", text: "Referral BSC-R-1041 · Mobility support", status: "Accepted", time: "34 minutes ago" },
    { title: "New referral submitted", text: "Referral BSC-R-1052 · Career counselling", status: "Unassigned", time: "1 hour ago" },
  ],
  representative: [
    { title: "Referral awaiting decision", text: "Community Physiotherapy Programme", status: "Review", time: "20 minutes ago" },
    { title: "New job application", text: "Junior Programme Assistant", status: "New", time: "Today" },
    { title: "Changes requested", text: "Independent Living Workshop", status: "Update draft", time: "Yesterday" },
  ],
  admin: [
    { title: "Job submitted for approval", text: "Inclusive Operations Assistant", status: "Review", time: "14 minutes ago" },
    { title: "Referral overdue", text: "BSC-R-1039 · Waiting 4 days", status: "Intervene", time: "Today" },
    { title: "Accessibility report received", text: "Keyboard focus on application form", status: "Assign", time: "Yesterday" },
  ],
};

const nextActionsByRole: Record<Role, { title: string; detail: string; action: string }[]> = {
  user: [
    { title: "Complete work preferences", detail: "Add your preferred arrangement to improve job matches.", action: "Update profile" },
    { title: "Reply to referral officer", detail: "Share your preferred appointment time for physiotherapy.", action: "Open referral" },
    { title: "Prepare for interview", detail: "Review the scheduled interview details and instructions.", action: "View application" },
  ],
  officer: [
    { title: "Review Nadia’s reply", detail: "Preferred appointment information was received 8 minutes ago.", action: "Continue referral" },
    { title: "Assign three new cases", detail: "Three referrals are unassigned and marked high priority.", action: "Open queue" },
    { title: "Confirm upcoming appointment", detail: "The receiving organization proposed a new time.", action: "Review proposal" },
  ],
  representative: [
    { title: "Decide on new referral", detail: "Review the service request and confirm availability.", action: "Review referral" },
    { title: "Screen new applicant", detail: "A new application arrived for Junior Programme Assistant.", action: "View applicant" },
    { title: "Revise programme draft", detail: "An administrator requested two content changes.", action: "Edit programme" },
  ],
  admin: [
    { title: "Review content approvals", detail: "Nine organization submissions are waiting for review.", action: "Open approvals" },
    { title: "Check delayed referral", detail: "One case has exceeded the expected response window.", action: "Review case" },
    { title: "Assign accessibility report", detail: "A keyboard-focus problem needs an owner.", action: "Open feedback" },
  ],
};

function Sidebar({ role }: { role: Role }) {
  const data = roleData[role];
  const workspaceLinks: Partial<Record<Role, Record<string, string>>> = {
    user: { "My profile": "/workspace/profile", Recommendations: "/workspace/recommendations", "Saved items": "/workspace/saved", "My referrals": "/workspace/referrals" },
    officer: { "New referrals": "/workspace/referrals/queue", "Assigned referrals": "/workspace/referrals/queue" },
    representative: { Referrals: "/workspace/referrals/queue" }, admin: { Referrals: "/workspace/referrals/queue" },
  };
  return (
    <aside className="workspace-sidebar">
      <Link className="workspace-brand" href="/" aria-label="Return to B-SCAN Connect home"><span>B</span><b>B-SCAN <small>Connect</small></b></Link>
      <nav aria-label={`${data.label} navigation`}>
        {data.nav.map((item, index) => workspaceLinks[role]?.[item] ? <Link href={workspaceLinks[role]?.[item] ?? "/workspace"} key={item}><i aria-hidden="true">{["⌂","○","✦","♡","↗","▤","◇","!","◎","▦","≋"][index] ?? "·"}</i>{item}</Link> : <button className={index === 0 ? "active" : ""} key={item} type="button"><i aria-hidden="true">{["⌂","○","✦","♡","↗","▤","◇","!","◎","▦","≋"][index] ?? "·"}</i>{item}{item === "Notifications" && <em>4</em>}</button>)}
      </nav>
      <div className="sidebar-help"><span aria-hidden="true">?</span><b>Need assistance?</b><p>View accessible help and guidance.</p><button type="button">Open help</button></div>
      <div className="sidebar-user"><span>{data.initials}</span><div><b>{data.person}</b><small>{data.label}</small></div><i aria-hidden="true">⋮</i></div>
    </aside>
  );
}

async function fetchManagedListings(role: "representative" | "admin") {
  const response = await fetch(`/api/catalog/manage?scope=${role === "admin" ? "admin" : "organization"}`, { cache: "no-store" });
  const result = await response.json() as { listings?: CatalogItem[]; error?: string };
  if (!response.ok) throw new Error(result.error || "The catalogue could not be loaded.");
  return result.listings ?? [];
}

function ContentOperations({ role, onBack }: { role: "representative" | "admin"; onBack: () => void }) {
  const [submissions, setSubmissions] = useState<CatalogItem[]>([]);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [creating, setCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");

  const loadListings = async () => {
    setLoading(true);
    setError("");
    try {
      setSubmissions(await fetchManagedListings(role));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "The catalogue could not be loaded.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let active = true;
    fetchManagedListings(role)
      .then((listings) => {
        if (active) setSubmissions(listings);
      })
      .catch((loadError: unknown) => {
        if (active) setError(loadError instanceof Error ? loadError.message : "The catalogue could not be loaded.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [role]);

  const createDraft = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusyId("create");
    setError("");
    const form = new FormData(event.currentTarget);
    try {
      const response = await fetch("/api/catalog", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: form.get("kind"),
          title: form.get("title"),
          organization: form.get("organization"),
          district: form.get("district"),
          deliveryMode: form.get("deliveryMode"),
          summary: form.get("summary"),
          description: form.get("description"),
          category: form.get("category"),
          deadline: form.get("deadline"),
          accessibility: form.getAll("accessibility"),
          eligibility: String(form.get("eligibility") || "").split("\n").map((value) => value.trim()).filter(Boolean),
        }),
      });
      const result = await response.json() as { listing?: CatalogItem; error?: string };
      if (!response.ok) throw new Error(result.error || "The listing could not be saved.");
      setNotice("The listing was saved as a draft. Submit it when the content is ready for review.");
      setCreating(false);
      await loadListings();
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : "The listing could not be saved.");
    } finally {
      setBusyId("");
    }
  };

  const transition = async (item: CatalogItem, action: "SUBMIT" | "PUBLISH" | "REQUEST_CHANGES" | "CLOSE" | "ARCHIVE") => {
    if (!item.id) return;
    setBusyId(item.id);
    setError("");
    try {
      const response = await fetch(`/api/catalog/${item.id}/transition`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, comment: action === "REQUEST_CHANGES" ? "Please review the listing details and accessibility information." : undefined }),
      });
      const result = await response.json() as { listing?: CatalogItem; error?: string };
      if (!response.ok) throw new Error(result.error || "The listing could not be updated.");
      const messages = {
        SUBMIT: "The listing was submitted for administrator review.",
        PUBLISH: "The listing is now published in the public catalogue.",
        REQUEST_CHANGES: "The organization can now revise and resubmit the listing.",
        CLOSE: "The listing was closed and removed from public search.",
        ARCHIVE: "The listing was archived with its history preserved.",
      };
      setNotice(messages[action]);
      await loadListings();
    } catch (transitionError) {
      setError(transitionError instanceof Error ? transitionError.message : "The listing could not be updated.");
    } finally {
      setBusyId("");
    }
  };

  const formattedStatus = (status?: CatalogItem["status"]) => status ? status.toLowerCase().replaceAll("_", " ") : "Draft";
  const formatDate = (value?: string) => value ? new Intl.DateTimeFormat("en-BD", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)) : "Not submitted";

  return (
    <section className="operations-surface">
      <div className="operations-heading">
        <div><button className="back-link" type="button" onClick={onBack}>← Dashboard</button><p className="workspace-kicker">{role === "admin" ? "Catalogue governance" : "Organization publishing"}</p><h1>{role === "admin" ? "Approval queue" : "Manage listings"}</h1><p>{role === "admin" ? "Review submitted content before it appears in public search." : "Create, revise and submit services, jobs and programmes for review."}</p></div>
        {role === "representative" && <button className="button" type="button" onClick={() => setCreating((value) => !value)}>{creating ? "Close form" : "Create listing"} →</button>}
      </div>

      {notice && <div className="success-notice" role="status"><span>✓</span><div><b>Update complete</b><p>{notice}</p></div><button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}
      {error && <div className="error-notice" role="alert"><span>!</span><div><b>Action not completed</b><p>{error}</p></div><button type="button" onClick={() => setError("")} aria-label="Dismiss error">×</button></div>}

      {role === "representative" && creating && (
        <form className="listing-form" onSubmit={createDraft}>
          <div className="form-heading"><div><h2>New catalogue listing</h2><p>Required fields are marked with an asterisk.</p></div><span>Draft</span></div>
          <div className="form-grid">
            <label><span>Listing type *</span><select name="kind" required><option value="">Choose a type</option><option value="service">Support service</option><option value="job">Job</option><option value="training">Training</option><option value="education">Education</option></select></label>
            <label><span>Title *</span><input name="title" required placeholder="Enter a clear listing title" /></label>
            <label><span>Organization *</span><input name="organization" required defaultValue="Shobuj Pathways Foundation" /></label>
            <label><span>Category</span><input name="category" placeholder="For example, employment support" /></label>
            <label className="form-wide"><span>Summary *</span><textarea name="summary" required rows={3} placeholder="Briefly describe what is offered and who it is for" /></label>
            <label className="form-wide"><span>Full description</span><textarea name="description" rows={4} placeholder="Add the complete service or opportunity details" /></label>
            <label><span>District *</span><select name="district" required><option>Dhaka</option><option>Chattogram</option><option>Rajshahi</option><option>Khulna</option><option>Barishal</option><option>Sylhet</option><option>Rangpur</option><option>Mymensingh</option><option>Nationwide</option></select></label>
            <label><span>Delivery mode *</span><select name="deliveryMode" required><option>In person</option><option>Online</option><option>Hybrid</option></select></label>
            <label><span>Deadline</span><input name="deadline" placeholder="For example, 30 November 2026" /></label>
            <label><span>Eligibility</span><textarea name="eligibility" rows={3} placeholder="Enter one requirement per line" /></label>
            <fieldset className="form-wide"><legend>Accessibility features</legend><div className="checkbox-grid">{["Step-free access", "Accessible washroom", "Live captions", "Screen-reader compatible", "Flexible schedule", "Support person welcome"].map((item) => <label key={item}><input name="accessibility" value={item} type="checkbox" />{item}</label>)}</div></fieldset>
          </div>
          <div className="form-actions"><button type="button" className="button button-secondary" onClick={() => setCreating(false)}>Cancel</button><button type="submit" className="button" disabled={busyId === "create"}>{busyId === "create" ? "Saving…" : "Save draft"}</button></div>
        </form>
      )}

      <div className="queue-card">
        <div className="queue-toolbar"><div><h2>{role === "admin" ? "Catalogue records" : "Organization listings"}</h2><p>{submissions.length} active records</p></div><button type="button" className="refresh-button" onClick={() => void loadListings()}>Refresh</button></div>
        <div className="queue-table" role="table" aria-label={role === "admin" ? "Approval queue" : "Organization listings"}>
          <div className="queue-row queue-header" role="row"><span role="columnheader">Listing</span><span role="columnheader">Organization</span><span role="columnheader">Submitted</span><span role="columnheader">Status</span><span role="columnheader">Actions</span></div>
          {loading ? <div className="queue-feedback" role="status"><div className="state-spinner" aria-hidden="true" />Loading catalogue records…</div> : submissions.length === 0 ? <div className="queue-feedback"><b>No listings yet</b><span>Create a listing to begin the review process.</span></div> : submissions.map((item) => (
            <div className="queue-row" role="row" key={item.id ?? item.slug}>
              <span role="cell"><small>{item.kind} · {item.reference}</small><b>{item.title}</b></span>
              <span role="cell">{item.organization}</span><span role="cell">{formatDate(item.submittedAt ?? item.updatedAt)}</span>
              <span role="cell"><em className={(item.status ?? "DRAFT").toLowerCase().replaceAll("_", "-")}>{formattedStatus(item.status)}</em></span>
              <span role="cell" className="queue-actions">
                {role === "representative" && ["DRAFT", "CHANGES_REQUESTED"].includes(item.status ?? "DRAFT") && <button disabled={busyId === item.id} type="button" onClick={() => void transition(item, "SUBMIT")}>Submit</button>}
                {role === "admin" && item.status === "SUBMITTED" && <><button disabled={busyId === item.id} type="button" onClick={() => void transition(item, "PUBLISH")}>Publish</button><button disabled={busyId === item.id} type="button" onClick={() => void transition(item, "REQUEST_CHANGES")}>Request changes</button></>}
                {role === "admin" && item.status === "PUBLISHED" && <><button disabled={busyId === item.id} type="button" onClick={() => void transition(item, "CLOSE")}>Close</button><button disabled={busyId === item.id} type="button" onClick={() => void transition(item, "ARCHIVE")}>Archive</button></>}
                {role === "admin" && item.status === "CLOSED" && <button disabled={busyId === item.id} type="button" onClick={() => void transition(item, "ARCHIVE")}>Archive</button>}
                {!((role === "representative" && ["DRAFT", "CHANGES_REQUESTED"].includes(item.status ?? "DRAFT")) || (role === "admin" && ["SUBMITTED", "PUBLISHED", "CLOSED"].includes(item.status ?? ""))) && <span>No action needed</span>}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function StakeholderWorkspace({ accountName }: { accountName: string }) {
  const [role, setRole] = useState<Role>("user");
  const [view, setView] = useState<WorkspaceView>("dashboard");
  const data = roleData[role];
  const activities = activityByRole[role];
  const nextActions = nextActionsByRole[role];

  return (
    <div className="workspace-page">
      <Sidebar role={role} />
      <main id="main-content" className="workspace-main">
        <header className="workspace-topbar">
          <div><small>Viewing as</small><strong>{data.label}</strong></div>
          <div className="role-switcher" role="group" aria-label="Switch stakeholder role">
            {(Object.keys(roleData) as Role[]).map((key) => <button type="button" className={role === key ? "active" : ""} aria-pressed={role === key} onClick={() => { setRole(key); setView("dashboard"); }} key={key}>{roleData[key].label.replace("B-SCAN ", "")}</button>)}
          </div>
          <AccessibilityTools />
          <button className="top-icon" type="button" aria-label="Notifications">♢<em>4</em></button>
          <div className="top-avatar" title={accountName}>{data.initials}</div>
        </header>

        <div className="workspace-content">
          {view === "content" && (role === "representative" || role === "admin") ? <ContentOperations key={role} role={role} onBack={() => setView("dashboard")} /> : <>
          <div className="workspace-title-row"><div><p className="workspace-kicker">Dashboard overview</p><h1>{data.greeting}</h1><p>{data.subtitle}</p></div>{role === "user" ? <Link className="button" href="/workspace/profile">Complete my profile →</Link> : <button className="button" type="button" onClick={() => (role === "representative" || role === "admin") && setView("content")}>{role === "officer" ? "Review new referrals" : role === "representative" ? "Manage listings" : "Open approval queue"} →</button>}</div>
          <div className="workspace-stats">
            {data.stats.map((stat, index) => <article key={stat.label}><div className={`workspace-stat-symbol ${stat.tone ?? ""}`} aria-hidden="true">{["◔","✦","↗","▤"][index]}</div><span>{stat.label}</span><strong>{stat.value}</strong><small>{stat.detail}</small></article>)}
          </div>

          <div className="dashboard-grid">
            <section className="dashboard-card activity-card">
              <div className="card-heading"><div><h2>{role === "user" ? "Your latest updates" : "Work requiring attention"}</h2><p>Updates across the connected workflow</p></div><button type="button">View all</button></div>
              <div className="activity-list">
                {activities.map((activity, index) => <article key={activity.title}><span className={`activity-dot dot-${index + 1}`} aria-hidden="true">{index === 0 ? "!" : index === 1 ? "✓" : "✦"}</span><div><b>{activity.title}</b><p>{activity.text}</p><small>{activity.time}</small></div><em>{activity.status}</em><button type="button" aria-label={`Open ${activity.title}`}>→</button></article>)}
              </div>
            </section>

            <section className="dashboard-card progress-card">
              <div className="card-heading"><div><h2>{role === "user" ? "Profile readiness" : "Workflow health"}</h2><p>{role === "user" ? "A stronger profile improves matches" : "Current service level"}</p></div></div>
              <div className="progress-ring" style={{ "--progress": role === "user" ? "78" : role === "admin" ? "86" : "82" } as React.CSSProperties}><div><strong>{role === "user" ? "78%" : role === "admin" ? "86%" : "82%"}</strong><small>On track</small></div></div>
              <ul>
                <li><span>✓</span>{role === "user" ? "Basic information complete" : "New items triaged today"}</li>
                <li><span>✓</span>{role === "user" ? "Skills and interests added" : "No critical blockers"}</li>
                <li className="incomplete"><span>!</span>{role === "user" ? "Add work arrangement preference" : "3 actions approaching deadline"}</li>
              </ul>
              <button type="button">View details →</button>
            </section>

            <section className="dashboard-card next-actions-card">
              <div className="card-heading"><div><h2>Recommended next actions</h2><p>Useful tasks based on recent activity</p></div><span>Updated now</span></div>
              <div className="next-actions-grid">
                {nextActions.map((item, index) => <article key={item.title}><span aria-hidden="true">{index + 1}</span><div><b>{item.title}</b><p>{item.detail}</p></div><button type="button">{item.action} →</button></article>)}
              </div>
            </section>
          </div>
          </>}
        </div>
      </main>
    </div>
  );
}
