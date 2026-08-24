"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

const REQUEST_TIMEOUT_MS = 15_000;

export function AuthForm({ mode }: { mode: "login" | "register" }) {
  const params = useSearchParams();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setBusy(true);
    setError("");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(Object.fromEntries(new FormData(event.currentTarget))),
        signal: controller.signal,
      });
      const result = await response.json().catch(() => ({})) as { error?: string };

      if (!response.ok) {
        setError(result.error ?? "Please check the information and try again.");
        return;
      }

      const requestedTarget = params.get("return_to");
      const target = requestedTarget?.startsWith("/") && !requestedTarget.startsWith("//")
        ? requestedTarget
        : "/workspace";

      // A full navigation guarantees the new HttpOnly session cookie is used
      // by the first protected-page request and avoids competing RSC refreshes.
      window.location.assign(target);
    } catch (cause) {
      const timedOut = cause instanceof DOMException && cause.name === "AbortError";
      setError(timedOut
        ? "The request took too long. Please try again."
        : "The service could not be reached. Check your connection and try again.");
    } finally {
      window.clearTimeout(timeout);
      setBusy(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={submit}>
      {mode === "register" && (
        <label>
          <span>Full name</span>
          <input name="displayName" autoComplete="name" required minLength={2} />
        </label>
      )}
      <label>
        <span>Email address</span>
        <input name="email" type="email" autoComplete="email" required />
      </label>
      <label>
        <span>Password</span>
        <input
          name="password"
          type="password"
          autoComplete={mode === "register" ? "new-password" : "current-password"}
          required
          minLength={8}
          maxLength={128}
        />
      </label>
      {mode === "register" && (
        <p className="auth-hint">
          Registration creates a member account. Staff and administrator accounts are assigned by an administrator.
        </p>
      )}
      {error && <p className="auth-error" role="alert">{error}</p>}
      <button className="button" disabled={busy}>
        {busy
          ? (mode === "login" ? "Signing in…" : "Creating account…")
          : (mode === "login" ? "Sign in" : "Create member account")}
      </button>
      <p className="auth-switch">
        {mode === "login"
          ? <>Need an account? <Link href="/register">Register</Link></>
          : <>Already registered? <Link href="/login">Sign in</Link></>}
      </p>
    </form>
  );
}