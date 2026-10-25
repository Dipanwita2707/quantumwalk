"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE, useSession } from "@/lib/api";
import { QuantumSphere } from "@/components/QuantumSphere";
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
    const params = new URLSearchParams(window.location.search);
    const selected = params.get("level");
    if (selected === "beginner" || selected === "intermediate" || selected === "advanced") setLevel(selected);
    setReturnTo(safeReturnPath(params.get("return_to")));
    const failure = params.get("error");
    if (failure) setSignInError(failure === "account_unavailable"
      ? "Google sign-in finished, but your account is temporarily unavailable. Please try again."
      : "Google sign-in did not finish. You can try again.");
  }, []);

  return <>
    <header className="login-header">
      <Link className="brand" href="/"><span className="brand-mark">◇</span><span><strong>QuantumWalk</strong><small>See inside a quantum algorithm.</small></span></Link>
      <Link href="/" className="login-back">Back to home</Link>
    </header>
    <main className="auth-layout">
      <section className="auth-card" aria-labelledby="login-title">
        <span className="panel-kicker">YOUR PRIVATE QUANTUM SPACE</span>
        <h1 id="login-title">Welcome to QuantumWalk.</h1>
        <p>Sign in to continue your quantum journey. Your circuits and lesson progress stay with your account.</p>
        {returnTo !== "/dashboard" && <p className="login-destination">Continue to <strong>{destinationLabel(returnTo)}</strong> after sign-in.</p>}
        {level && <p className="login-path-ready">Your {discoveryTracks[level].label.toLowerCase()} starter is ready.</p>}
        {signInError && <p className="content-error" role="alert">{signInError}</p>}
        {error && <div className="content-error" role="alert">{error} <button type="button" onClick={() => void refresh()}>Try again</button></div>}
        {loading ? <p role="status">Checking your account…</p>
          : profile?.authenticated ? <Link className="primary-action" href={returnTo}>Continue to {destinationLabel(returnTo)} →</Link>
          : profile && !profile.google_enabled ? <div className="content-error" role="status">Google sign-in is temporarily unavailable. <button type="button" onClick={() => void refresh()}>Check again</button></div>
          : profile && <a className="google-action" href={`${API_BASE}/auth/google/start?return_to=${encodeURIComponent(returnTo)}`}><span aria-hidden="true">G</span> Continue with Google</a>}
        <p className="legal-small">By continuing, review our <Link href="/privacy">privacy notice</Link> and <Link href="/terms">terms</Link>.</p>
      </section>
      <aside className="login-art" aria-label="Explore a qubit on a Bloch sphere"><QuantumSphere vector={{ x: Math.SQRT1_2, y: 0, z: Math.SQRT1_2 }} /><h2>See inside a quantum algorithm.</h2><p>One experiment. A new way to see.</p></aside>
    </main>
  </>;
}
