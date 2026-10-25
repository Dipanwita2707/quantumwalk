"use client";

import { useEffect, useRef, useState } from "react";
import { api } from "@/lib/api";
import type { Experience } from "@/lib/onboarding";
import type { DiscoveryScene } from "./DiscoveryVisual";

type Reply = { answer: string; source: string; uses_external_ai: boolean };

export function DiscoveryCoach({ topic, level }: { topic: DiscoveryScene; level: Experience }) {
  const [reply, setReply] = useState<Reply | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const request = useRef<AbortController | null>(null);
  useEffect(() => () => request.current?.abort(), []);
  async function explain() {
    setBusy(true); setError("");
    request.current = new AbortController();
    try {
      setReply(await api<Reply>("/api/discovery/explain", { method: "POST", signal: AbortSignal.any([request.current.signal, AbortSignal.timeout(16000)]), body: JSON.stringify({ topic, level, consent: true }) }));
    } catch (cause) {
      if (!request.current.signal.aborted) setError(cause instanceof Error ? cause.message : "AI help is unavailable. You can still use the lesson and experiment.");
    } finally { setBusy(false); }
  }
  return <section className="discovery-coach" aria-label="Learning guide">
    <div><span className="panel-kicker">YOUR LEARNING GUIDE</span><h2>Want another way to understand it?</h2><p>Ask for a simpler explanation matched to your level.</p></div>
    <button type="button" onClick={() => void explain()} disabled={busy || reply !== null}>{busy ? "Preparing your explanation…" : reply ? "Explanation ready" : "✦ Explain with AI"}</button>
    <small>Clicking sends only this public topic and your chosen level to the AI provider. Your answers, identity, and circuits are excluded.</small>
    {busy && <p role="status">Your guide is finding a clearer way to explain this idea.</p>}
    {error && <p role="alert" className="content-error">{error}</p>}
    {reply && <div className="discovery-coach-answer" role="status"><span>{reply.uses_external_ai ? "AI explanation · check it against the experiment" : "Lesson explanation · AI is unavailable"}</span><p>{reply.answer}</p></div>}
  </section>;
}
