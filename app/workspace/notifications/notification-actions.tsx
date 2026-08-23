"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function NotificationToolbar({ unreadCount }: { unreadCount: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const markAll = async () => {
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/notifications", { method: "PATCH" });
      if (!response.ok) throw new Error("Notifications could not be updated.");
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Notifications could not be updated.");
    } finally { setBusy(false); }
  };
  return <div className="notification-toolbar"><button className="button button-secondary" type="button" disabled={busy || unreadCount === 0} onClick={() => void markAll()}>{busy ? "Updating…" : `Mark all read (${unreadCount})`}</button>{error && <small role="alert">{error}</small>}</div>;
}

export function NotificationActions({ id, unread, archived }: { id: string; unread: boolean; archived: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const update = async (action: "READ" | "UNREAD" | "ARCHIVE") => {
    setBusy(action); setError("");
    try {
      const response = await fetch(`/api/notifications/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "Notification could not be updated.");
      router.refresh();
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Notification could not be updated.");
    } finally { setBusy(""); }
  };
  return <div className="notification-actions">{!archived && <><button type="button" disabled={Boolean(busy)} onClick={() => void update(unread ? "READ" : "UNREAD")}>{busy ? "Updating…" : unread ? "Mark read" : "Mark unread"}</button><button type="button" disabled={Boolean(busy)} onClick={() => void update("ARCHIVE")}>Archive</button></>}{error && <small role="alert">{error}</small>}</div>;
}
