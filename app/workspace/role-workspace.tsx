"use client";

import Link from "next/link";
import { useState } from "react";
import { AccessibilityTools } from "../accessibility-tools";

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
  return (
    <aside className="workspace-sidebar">
      <Link className="workspace-brand" href="/" aria-label="Return to B-SCAN Connect home"><span>B</span><b>B-SCAN <small>Connect</small></b></Link>
      <nav aria-label={`${data.label} navigation`}>
        {data.nav.map((item, index) => <button className={index === 0 ? "active" : ""} key={item} type="button"><i aria-hidden="true">{["⌂","○","✦","♡","↗","▤","◇","!","◎","▦","≋"][index] ?? "·"}</i>{item}{item === "Notifications" && <em>4</em>}</button>)}
      </nav>
      <div className="sidebar-help"><span aria-hidden="true">?</span><b>Need assistance?</b><p>View accessible help and guidance.</p><button type="button">Open help</button></div>
      <div className="sidebar-user"><span>{data.initials}</span><div><b>{data.person}</b><small>{data.label}</small></div><i aria-hidden="true">⋮</i></div>
    </aside>
  );
}

const initialSubmissions = [
  { id: "BSC-C-2041", type: "Job", title: "Inclusive Operations Assistant", organization: "BrightDesk Bangladesh", submitted: "24 Aug 2026", status: "Submitted" },
  { id: "BSC-C-2038", type: "Service", title: "Independent Living Workshop", organization: "Shobuj Pathways Foundation", submitted: "23 Aug 2026", status: "Submitted" },
  { id: "BSC-C-2033", type: "Training", title: "Workplace Communication Series", organization: "Uddipan Learning Collective", submitted: "22 Aug 2026", status: "Changes requested" },
];

function ContentOperations({ role, onBack }: { role: "representative" | "admin"; onBack: () => void }) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [notice, setNotice] = useState("");
  const [creating, setCreating] = useState(false);

  const updateStatus = (id: string, status: string) => {
    setSubmissions((current) => current.map((item) => item.id === id ? { ...item, status } : item));
    setNotice(status === "Published" ? "The listing is now published in the public catalogue." : "The organization has been notified and can revise the submission.");
  };

  return (
    <section className="operations-surface">
      <div className="operations-heading">
        <div><button className="back-link" type="button" onClick={onBack}>← Dashboard</button><p className="workspace-kicker">{role === "admin" ? "Catalogue governance" : "Organization publishing"}</p><h1>{role === "admin" ? "Approval queue" : "Manage listings"}</h1><p>{role === "admin" ? "Review submitted content before it appears in public search." : "Create, revise and submit services, jobs and programmes for review."}</p></div>
        {role === "representative" && <button className="button" type="button" onClick={() => setCreating((value) => !value)}>{creating ? "Close form" : "Create listing"} →</button>}
      </div>

      {notice && <div className="success-notice" role="status"><span>✓</span><div><b>Update complete</b><p>{notice}</p></div><button type="button" onClick={() => setNotice("")} aria-label="Dismiss notification">×</button></div>}

      {role === "representative" && creating && (
        <form className="listing-form" onSubmit={(event) => { event.preventDefault(); setNotice("Your listing was saved as a draft. You can review it before submitting."); setCreating(false); }}>
          <div className="form-heading"><div><h2>New catalogue listing</h2><p>Required fields are marked with an asterisk.</p></div><span>Draft</span></div>
          <div className="form-grid">
            <label><span>Listing type *</span><select required><option value="">Choose a type</option><option>Support service</option><option>Job</option><option>Training</option><option>Education</option></select></label>
            <label><span>Title *</span><input required placeholder="Enter a clear listing title" /></label>
            <label className="form-wide"><span>Summary *</span><textarea required rows={3} placeholder="Briefly describe what is offered and who it is for" /></label>
            <label><span>District *</span><select required><option>Dhaka</option><option>Chattogram</option><option>Rajshahi</option><option>Khulna</option><option>Barishal</option><option>Sylhet</option><option>Rangpur</option><option>Mymensingh</option><option>Nationwide</option></select></label>
            <label><span>Delivery mode *</span><select required><option>In person</option><option>Online</option><option>Hybrid</option></select></label>
            <fieldset className="form-wide"><legend>Accessibility features</legend><div className="checkbox-grid">{["Step-free access", "Accessible washroom", "Live captions", "Screen-reader compatible", "Flexible schedule", "Support person welcome"].map((item) => <label key={item}><input type="checkbox" />{item}</label>)}</div></fieldset>
          </div>
          <div className="form-actions"><button type="button" className="button button-secondary" onClick={() => setCreating(false)}>Cancel</button><button type="submit" className="button">Save draft</button></div>
        </form>
      )}

      <div className="queue-card">
        <div className="queue-toolbar"><div><h2>{role === "admin" ? "Waiting for review" : "Organization listings"}</h2><p>{submissions.length} active records</p></div><label><span className="sr-only">Filter records</span><select><option>All statuses</option><option>Submitted</option><option>Changes requested</option><option>Published</option></select></label></div>
        <div className="queue-table" role="table" aria-label={role === "admin" ? "Approval queue" : "Organization listings"}>
          <div className="queue-row queue-header" role="row"><span role="columnheader">Listing</span><span role="columnheader">Organization</span><span role="columnheader">Submitted</span><span role="columnheader">Status</span><span role="columnheader">Actions</span></div>
          {submissions.map((item) => (
            <div className="queue-row" role="row" key={item.id}>
              <span role="cell"><small>{item.type} · {item.id}</small><b>{item.title}</b></span>
              <span role="cell">{item.organization}</span><span role="cell">{item.submitted}</span>
              <span role="cell"><em className={item.status.toLowerCase().replace(" ", "-")}>{item.status}</em></span>
              <span role="cell" className="queue-actions">{role === "admin" ? <><button type="button" onClick={() => updateStatus(item.id, "Published")}>Publish</button><button type="button" onClick={() => updateStatus(item.id, "Changes requested")}>Request changes</button></> : <><button type="button">Edit</button><button type="button">View</button></>}</span>
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
          {view === "content" && (role === "representative" || role === "admin") ? <ContentOperations role={role} onBack={() => setView("dashboard")} /> : <>
          <div className="workspace-title-row"><div><p className="workspace-kicker">Dashboard overview</p><h1>{data.greeting}</h1><p>{data.subtitle}</p></div><button className="button" type="button" onClick={() => (role === "representative" || role === "admin") && setView("content")}>{role === "user" ? "Complete my profile" : role === "officer" ? "Review new referrals" : role === "representative" ? "Manage listings" : "Open approval queue"} →</button></div>
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
