"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { api, useSession } from "@/lib/api";
import { explainStateStep, type StateSnapshot } from "@/lib/stateExplanation";
import type { Operation } from "@/lib/circuitPresets";

type Props = {
  qubits: number; operations: Operation[]; snapshot?: StateSnapshot;
  explanation: ReturnType<typeof explainStateStep> | null;
  step: number; lastStep: number; stale: boolean; busy: boolean; playing: boolean;
  onRun: () => void; onPlay: () => void; onNext: () => void;
};

export function LabCircuitTutor({ qubits, operations, snapshot, explanation, step, lastStep, stale, busy, playing, onRun, onPlay, onNext }: Props) {
  const { profile } = useSession();
  const [topic, setTopic] = useState("step");
  const [questionOpen, setQuestionOpen] = useState(false);
  const [question, setQuestion] = useState("");
  const [allowAI, setAllowAI] = useState(false);
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [asking, setAsking] = useState(false);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => {
    pending.current?.abort();
    setAnswer(""); setError(""); setAsking(false);
    return () => pending.current?.abort();
  }, [operations, qubits]);

  const hasResult = !!snapshot && !stale;
  const highest = snapshot?.probabilities.reduce((best, row) => row.probability > best.probability ? row : best);
  const title = stale ? "Your circuit changed" : hasResult ? explanation?.title ?? "Inspect this step" : "Build a sequence. See what each gate changes.";
  const guidance = topic === "probability"
    ? hasResult && highest ? `At this step, |${highest.basis}⟩ is a most likely outcome: ${(highest.probability * 100).toFixed(1)}%. Each probability is its amplitude magnitude squared. Phase can change without changing these bars; a later mixing gate can reveal interference.` : "Execute the circuit to calculate probabilities. Empty bars mean zero probability at the selected step, rather than missing data."
    : topic === "next"
      ? stale ? "Execute your updated circuit to refresh the walkthrough." : !hasResult ? "Choose a gate and add it to a qubit wire, then Execute & follow. Start with H on q0 to explore superposition." : step < lastStep ? "Advance one gate and compare the highlighted circuit column, Bloch sphere, and probability bars. Pause whenever you want to inspect the state." : "Replay the sequence, or edit a gate and execute again to compare the outcome."
      : stale ? "The displayed result belongs to the previous circuit. Execute again before interpreting its state." : hasResult && explanation ? `${explanation.action} ${explanation.observation}` : `${qubits} qubit${qubits === 1 ? "" : "s"}, ${operations.length} gate${operations.length === 1 ? "" : "s"}. Every qubit starts in |0⟩. Execute to follow each gate, with explanations beside the changing state.`;

  async function ask(event: FormEvent) {
    event.preventDefault();
    if (!profile?.authenticated || !question.trim() || asking) return;
    const controller = new AbortController();
    pending.current?.abort(); pending.current = controller;
    setAsking(true); setError(""); setAnswer("");
    try {
      const response = await api<{ answer: string; uses_external_ai: boolean }>("/api/tutor/explain", {
        method: "POST", signal: controller.signal,
        body: JSON.stringify({ question, circuit: { qubits, operations }, allow_external_ai: allowAI }),
      }, profile.csrf_token);
      if (!controller.signal.aborted) setAnswer(`${response.answer}\n\n${response.uses_external_ai ? "AI explanation — verify numerical claims in the simulator." : "Local circuit explanation."}`);
    } catch (cause) {
      if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "The tutor is unavailable. Try again.");
    } finally { if (!controller.signal.aborted) setAsking(false); }
  }

  return <section id="coach" className="lab-top-tutor" aria-labelledby="lab-tutor-title">
    <div className="lab-tutor-heading"><div><span className="panel-kicker">YOUR LAB COMPANION</span><h2 id="lab-tutor-title">Circuit tutor</h2></div><span className="lab-tutor-stage">{hasResult ? `Step ${step} / ${lastStep}${playing ? " · Playing" : ""}` : stale ? "Rerun needed" : "Ready to explore"}</span></div>
    <div className="lab-tutor-topics" role="group" aria-label="Tutor topics">{[["step", "This step"], ["probability", "Probabilities"], ["next", "What next?"]].map(([key, label]) => <button type="button" key={key} aria-pressed={topic === key} onClick={() => setTopic(key)}>{label}</button>)}<button type="button" aria-expanded={questionOpen} aria-controls="lab-tutor-question" onClick={() => setQuestionOpen(!questionOpen)}>Ask a question</button></div>
    <div className="lab-tutor-guidance"><div aria-live={playing ? "off" : "polite"}><strong>{title}</strong><p>{guidance}</p></div><div className="lab-tutor-actions">
      <button type="button" disabled={busy} onClick={!hasResult ? onRun : onPlay}>{!hasResult ? "Execute & follow" : playing ? "Pause walkthrough" : step === lastStep ? "Replay walkthrough" : "Play walkthrough"}</button>
      <button type="button" disabled={busy || !hasResult || step >= lastStep} onClick={onNext}>Next gate →</button>
    </div></div>
    {questionOpen && <div id="lab-tutor-question" className="lab-tutor-question">
      {profile?.authenticated ? <form onSubmit={(event) => void ask(event)}>
        <label htmlFor="lab-tutor-input">Ask about your circuit</label><div className="lab-tutor-input-row"><input id="lab-tutor-input" value={question} maxLength={500} onChange={(event) => setQuestion(event.target.value)} placeholder="Why did the phase change without changing probability?" /><button type="submit" disabled={asking || !question.trim()}>{asking ? "Explaining…" : "Ask tutor"}</button></div>
        <label className="lab-tutor-consent"><input type="checkbox" checked={allowAI} onChange={(event) => setAllowAI(event.target.checked)} />Use external AI: send this question and circuit structure to the provider.</label>
      </form> : <p>The interactive guidance above works without sign-in. <Link href="/login?return_to=%2Fworkspace%3Fmode%3Dcircuit">Sign in to ask a custom circuit question →</Link></p>}
      {answer && <p className="lab-tutor-answer" role="status">{answer}</p>}{error && <p className="lab-run-error" role="alert">{error}</p>}
    </div>}
  </section>;
}
