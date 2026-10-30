"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getApiBase, useSession } from "@/lib/api";
import { QuantumSphere } from "@/components/QuantumSphere";
import { IdentityLayout } from "@/components/ui/IdentityLayout";
import { ActionLink } from "@/components/ui/QuantumUI";
import { discoveryTracks, type Experience } from "@/lib/onboarding";

function safeReturnPath(path: string | null): string {
  if (!path || !path.startsWith("/") || path.startsWith("//") || path.includes("\\") || path.length > 300 || /[\x00-\x1f]/.test(path)) return "/dashboard";
  return path;
}

function destinationLabel(path: string): string {
  if (path.startsWith("/learn")) return "your lesson";
  if (path.startsWith("/workspace")) return "the Circuit Lab";
  if (path.startsWith("/challenges")) return "your challenge";
  if (path.startsWith("/algorithms")) return "the algorithm library";
  if (path.startsWith("/circuits")) return "your saved circuits";
  return "your dashboard";
}

export default function LoginPage() {
  const { profile, loading, error, refresh } = useSession();
  const [signInError, setSignInError] = useState("");
  const [returnTo, setReturnTo] = useState("/dashboard");
  const [level, setLevel] = useState<Experience | null>(null);

  useEffect(() => {
    if (window.location.hostname === "127.0.0.1") {
      const canonical = new URL(window.location.href);
      canonical.hostname = "localhost";
      window.location.replace(canonical.toString());
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const selected = params.get("level");
    if (selected === "beginner" || selected === "intermediate" || selected === "advanced") setLevel(selected);
    setReturnTo(safeReturnPath(params.get("return_to")));
    const failure = params.get("error");
    if (failure) setSignInError(failure === "account_unavailable"
      ? "Google sign-in finished, but your account is temporarily unavailable. Please try again."
      : failure === "session_expired"
        ? "Your sign-in session expired or changed browser address. Start again from this page."
        : "Google sign-in did not finish. You can try again.");
  }, []);

  return <IdentityLayout>
        <span className="q-ui-eyebrow">YOUR PRIVATE QUANTUM SPACE</span>
        <h1 id="login-title">Create your quantum identity</h1>
        <p>Sign in to continue your quantum journey. Your circuits and lesson progress stay with your account.</p>
        {returnTo !== "/dashboard" && <p className="login-destination">Continue to <strong>{destinationLabel(returnTo)}</strong> after sign-in.</p>}
        {level && <p className="login-path-ready">Your {discoveryTracks[level].label.toLowerCase()} starter is ready.</p>}
        {signInError && !profile?.authenticated && <p className="content-error" role="alert">{signInError}</p>}
        {error && <div className="content-error" role="alert">{error} <button type="button" onClick={() => void refresh()}>Try again</button></div>}
        {loading ? <p role="status">Checking your account…</p>
          : profile?.authenticated ? <Link className="primary-action" href={returnTo}>Continue to {destinationLabel(returnTo)} →</Link>
          : error ? null
          : profile && !profile.google_enabled ? <div className="content-error" role="status">Sign-in is temporarily unavailable on this server. You can still explore the public lessons and demo lab. <Link href="/learn">Explore lessons →</Link></div>
          : profile ? (
              <a
                className="google-action"
                href={`${getApiBase()}/auth/google/start?return_to=${encodeURIComponent(returnTo)}`}
              >
                <span aria-hidden="true">G</span> Continue with Google
              </a>
            )
          : null}
        <ActionLink tone="secondary" href="/account/access">Sign in or register with email →</ActionLink>
        <p className="legal-small">By continuing, review our <Link href="/privacy">privacy notice</Link> and <Link href="/terms">terms</Link>.</p>
        <details className="q-ui-identity-preview"><summary>Explore a qubit before signing in</summary><QuantumSphere autoRotate={false} vector={{ x: Math.SQRT1_2, y: 0, z: Math.SQRT1_2 }} /></details>
  </IdentityLayout>;
}
