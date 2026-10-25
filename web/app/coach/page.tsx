"use client";
import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { api, useSession } from "@/lib/api";

export default function CoachPage() {
  const { profile, loading } = useSession();
  const [question, setQuestion] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reply, setReply] = useState<{ answer: string; uses_external_ai: boolean } | null>(null);
  const [error, setError] = useState("");
  async function ask(event: React.FormEvent) {
    event.preventDefault();
    if (busy || !question.trim() || !profile?.authenticated) return;
    setBusy(true); setError(""); setReply(null);
    try { setReply(await api<{ answer: string; uses_external_ai: boolean }>("/api/tutor/explain", { method: "POST", signal: AbortSignal.timeout(16000), body: JSON.stringify({ question: question.trim(), circuit: { qubits: 1, operations: [] }, allow_external_ai: consent }) }, profile.csrf_token)); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not get an explanation. Please retry."); }
    finally { setBusy(false); }
  }
  return <><SiteHeader /><main className="content-shell"><p className="eyebrow">A LITTLE HELP. A NEW DISCOVERY.</p><h1>Your quantum coach</h1><p className="content-intro">Ask a concept question here. For help with a circuit you are building, use the circuit coach inside your lab.</p><div className="activity-grid"><section className="content-card"><h2>Start with what feels unfamiliar.</h2><div className="coach-prompts">{["What does a Hadamard gate do?", "Why do Bell pairs have matching outcomes?", "How are probabilities different from sampled counts?"].map((prompt) => <button key={prompt} type="button" disabled={busy} onClick={() => setQuestion(prompt)}>{prompt}</button>)}</div><form className="coach-form" onSubmit={(event) => void ask(event)}><label htmlFor="concept-question">Your question</label><textarea id="concept-question" maxLength={500} rows={4} value={question} required onChange={(event) => setQuestion(event.target.value)} /><label className="ai-consent"><input type="checkbox" checked={consent} onChange={(event) => setConsent(event.target.checked)} /> Use AI: send my question to the configured provider</label><small>Local explanations are the default. AI receives your question and an empty one-qubit example. Your saved circuits and identity are excluded.</small><button disabled={loading || busy || !question.trim()} type="submit">{busy ? "Preparing an explanation…" : "Ask the coach"}</button></form>{busy && <p role="status">Working on your explanation…</p>}{error && <p className="content-error" role="alert">{error}</p>}{reply && <div className="coach-answer" role="status"><span className="panel-kicker">{reply.uses_external_ai ? "AI EXPLANATION" : "LOCAL EXPLANATION"}</span><p>{reply.answer}</p></div>}</section><aside className="content-card"><h2>Make the idea concrete.</h2><p>Try a lesson, examine an algorithm, or put your understanding to the test.</p><p><Link className="card-action" href="/learn/first-qubit">Meet your first qubit →</Link></p><p><Link className="card-action" href="/algorithms/bell-pair">Explore a Bell pair →</Link></p><p><Link className="card-action" href="/challenges/make-superposition">Try a challenge →</Link></p><p><Link className="card-action" href="/workspace#coach">Ask about your current lab circuit →</Link></p></aside></div></main></>;
}
