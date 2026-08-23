"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { ApplicationAction, ApplicationStage } from "../../../../db/application-repository";

const queueActions: Partial<Record<ApplicationStage, { action: ApplicationAction; label: string }[]>> = {
  APPLIED: [{ action: "SHORTLIST", label: "Shortlist" }, { action: "REJECT", label: "Not selected" }],
  SHORTLISTED: [{ action: "SCHEDULE_INTERVIEW", label: "Schedule interview" }, { action: "START_ASSESSMENT", label: "Start assessment" }, { action: "OFFER", label: "Record offer" }, { action: "REJECT", label: "Not selected" }],
  INTERVIEW: [{ action: "START_ASSESSMENT", label: "Start assessment" }, { action: "OFFER", label: "Record offer" }, { action: "REJECT", label: "Not selected" }],
  ASSESSMENT: [{ action: "OFFER", label: "Record offer" }, { action: "REJECT", label: "Not selected" }],
};

export function ApplicationActions({ reference, stage, queueAccess, preparationInfo, privateNotes }: {
  reference: string;
  stage: ApplicationStage;
  queueAccess: boolean;
  preparationInfo: string;
  privateNotes: string;
}) {
  const router = useRouter();
  const [preparation, setPreparation] = useState(preparationInfo);
  const [notes, setNotes] = useState(privateNotes);
  const [instructions, setInstructions] = useState("");
  const [importantDate, setImportantDate] = useState("");
  const [busy, setBusy] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  const request = async (method: "PATCH" | "DELETE", body?: Record<string, string>) => {
    setBusy(body?.action ?? "DELETE"); setNotice(""); setError("");
    try {
      const response = await fetch(`/api/applications/${reference}`, {
        method,
        headers: body ? { "Content-Type": "application/json" } : undefined,
        body: body ? JSON.stringify(body) : undefined,
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "The application could not be updated.");
      if (method === "DELETE") { router.push("/workspace/applications"); return; }
      setNotice(body?.action === "UPDATE_DRAFT" ? "Preparation saved." : "Application stage updated.");
      setInstructions(""); setImportantDate(""); router.refresh();
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "The application could not be updated.");
    } finally { setBusy(""); }
  };

  const actions = queueAccess ? queueActions[stage] ?? [] : [];
  const canWithdraw = !queueAccess && ["PREPARING", "APPLIED", "SHORTLISTED", "INTERVIEW", "ASSESSMENT"].includes(stage);
  return <section className="application-actions-card">
    <h2>{queueAccess ? "Manage application" : stage === "PREPARING" ? "Prepare and submit" : "Application actions"}</h2>
    {notice && <div className="inline-success" role="status">✓ {notice}</div>}
    {error && <div className="inline-error" role="alert">! {error}</div>}
    {!queueAccess && stage === "PREPARING" && <>
      <label className="field-label"><span>Application summary</span><textarea rows={7} minLength={20} maxLength={2000} value={preparation} onChange={(event) => setPreparation(event.target.value)}/></label>
      <label className="field-label"><span>Private notes</span><textarea rows={4} maxLength={2000} value={notes} onChange={(event) => setNotes(event.target.value)}/></label>
      <button className="button button-secondary" disabled={Boolean(busy)} type="button" onClick={() => void request("PATCH", { action: "UPDATE_DRAFT", preparationInfo: preparation, privateNotes: notes })}>{busy === "UPDATE_DRAFT" ? "Saving…" : "Save changes"}</button>
      <button className="button" disabled={Boolean(busy)} type="button" onClick={() => void request("PATCH", { action: "APPLY" })}>{busy === "APPLY" ? "Submitting…" : "Submit application"}</button>
      <button className="application-delete" disabled={Boolean(busy)} type="button" onClick={() => void request("DELETE")}>{busy === "DELETE" ? "Removing…" : "Remove unsubmitted application"}</button>
    </>}
    {queueAccess && actions.length > 0 && <>
      <label className="field-label"><span>Instructions or decision note</span><textarea rows={4} maxLength={1000} value={instructions} onChange={(event) => setInstructions(event.target.value)} placeholder="Add clear information that the applicant can see."/></label>
      {stage === "SHORTLISTED" && <label className="field-label"><span>Interview date and time</span><input type="datetime-local" value={importantDate} onChange={(event) => setImportantDate(event.target.value)}/></label>}
      <div className="application-action-buttons">{actions.map((item) => <button className={item.action === "REJECT" ? "danger" : ""} disabled={Boolean(busy)} type="button" key={item.action} onClick={() => void request("PATCH", { action: item.action, instructions, importantDate })}>{busy === item.action ? "Updating…" : item.label}</button>)}</div>
    </>}
    {canWithdraw && stage !== "PREPARING" && <button className="application-delete" disabled={Boolean(busy)} type="button" onClick={() => void request("PATCH", { action: "WITHDRAW" })}>{busy === "WITHDRAW" ? "Withdrawing…" : "Withdraw application"}</button>}
    {actions.length === 0 && queueAccess && <p className="muted-copy">No organization action is available at this stage.</p>}
  </section>;
}
