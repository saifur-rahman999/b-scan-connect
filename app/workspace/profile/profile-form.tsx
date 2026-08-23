"use client";

import { useState } from "react";
import type { MemberProfile } from "../../../db/member-experience";

const locations = ["Dhaka", "Chattogram", "Rajshahi", "Khulna", "Barishal", "Sylhet", "Rangpur", "Mymensingh", "Nationwide"];
const interests = ["service", "job", "training", "education"];
const accessOptions = ["Step-free access", "Accessible washroom", "Live captions", "Screen-reader compatible", "Flexible schedule", "Support person welcome"];

function lines(value: string) { return value.split(/\n|,/).map((item) => item.trim()).filter(Boolean); }

export function ProfileForm({ initialProfile }: { initialProfile: MemberProfile }) {
  const [profile, setProfile] = useState(initialProfile);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const toggle = (field: "preferredLocations" | "opportunityInterests" | "accessibilityPreferences", value: string) => {
    setProfile((current) => ({ ...current, [field]: current[field].includes(value) ? current[field].filter((item) => item !== value) : [...current[field], value] }));
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(""); setNotice("");
    try {
      const response = await fetch("/api/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
      const result = await response.json() as { profile?: MemberProfile; error?: string };
      if (!response.ok || !result.profile) throw new Error(result.error || "Your profile could not be saved.");
      setProfile(result.profile); setNotice("Your preferences are saved and available on every signed-in device.");
    } catch (saveError) { setError(saveError instanceof Error ? saveError.message : "Your profile could not be saved."); }
    finally { setSaving(false); }
  };

  return <form className="member-form" onSubmit={save}>
    <div className="profile-progress"><div><strong>{profile.completionPercent}%</strong><span>Profile complete</span></div><div><i style={{ width: `${profile.completionPercent}%` }} /></div></div>
    {notice && <div className="success-notice" role="status"><span>✓</span><div><b>Profile updated</b><p>{notice}</p></div></div>}
    {error && <div className="error-notice" role="alert"><span>!</span><div><b>Save unsuccessful</b><p>{error}</p></div></div>}
    <section><div className="member-section-heading"><span>1</span><div><h2>Location and delivery</h2><p>Choose every area and arrangement that works for you.</p></div></div>
      <fieldset><legend>Preferred locations</legend><div className="choice-grid">{locations.map((value) => <label key={value}><input type="checkbox" checked={profile.preferredLocations.includes(value)} onChange={() => toggle("preferredLocations", value)} />{value}</label>)}</div></fieldset>
      <label className="field-label"><span>Preferred work arrangement</span><select value={profile.workArrangement ?? ""} onChange={(event) => setProfile({ ...profile, workArrangement: (event.target.value || null) as MemberProfile["workArrangement"] })}><option value="">No preference selected</option><option value="REMOTE">Remote</option><option value="HYBRID">Hybrid</option><option value="ONSITE">On-site</option><option value="FLEXIBLE">Flexible</option></select></label>
    </section>
    <section><div className="member-section-heading"><span>2</span><div><h2>Interests and experience</h2><p>This information helps rank relevant listings.</p></div></div>
      <fieldset><legend>What are you looking for?</legend><div className="choice-grid">{interests.map((value) => <label key={value}><input type="checkbox" checked={profile.opportunityInterests.includes(value)} onChange={() => toggle("opportunityInterests", value)} />{value[0].toUpperCase() + value.slice(1)}</label>)}</div></fieldset>
      <div className="two-fields"><label className="field-label"><span>Skills</span><textarea rows={4} value={profile.skills.join("\n")} onChange={(event) => setProfile({ ...profile, skills: lines(event.target.value) })} placeholder="One skill per line" /></label><label className="field-label"><span>Education or training</span><textarea rows={4} value={profile.educationSummary} onChange={(event) => setProfile({ ...profile, educationSummary: event.target.value })} placeholder="Add relevant education or training" /></label></div>
      <label className="field-label"><span>Service interests</span><input value={profile.serviceInterests.join(", ")} onChange={(event) => setProfile({ ...profile, serviceInterests: lines(event.target.value) })} placeholder="For example: career support, mobility, digital skills" /></label>
    </section>
    <section><div className="member-section-heading"><span>3</span><div><h2>Accessibility preferences</h2><p>Choose features that help you participate comfortably.</p></div></div>
      <div className="choice-grid">{accessOptions.map((value) => <label key={value}><input type="checkbox" checked={profile.accessibilityPreferences.includes(value)} onChange={() => toggle("accessibilityPreferences", value)} />{value}</label>)}</div>
      <label className="field-label"><span>Other support needs</span><textarea rows={3} value={profile.supportNeeds.join("\n")} onChange={(event) => setProfile({ ...profile, supportNeeds: lines(event.target.value) })} placeholder="One preference per line" /></label>
    </section>
    <section className="consent-panel"><label><input type="checkbox" checked={profile.recommendationConsent} onChange={(event) => setProfile({ ...profile, recommendationConsent: event.target.checked })} /><span><b>Use my profile to rank listings</b><small>Recommendations explain the information used. They do not decide eligibility or share your profile with organizations.</small></span></label></section>
    <div className="member-form-actions"><button className="button" type="submit" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button></div>
  </form>;
}
