"use client";

import Link from "next/link";
import { useState } from "react";
import { api, useSession } from "@/lib/api";
import { ResourceState } from "@/components/ProductPage";
import { useResource } from "@/components/useResource";
import { ActionButton } from "@/components/ui/QuantumUI";

export type Boss = { slug: string; version: number; title: string; objective: string; prerequisites: string[]; xp: number; locked: boolean; reward_recorded: boolean; steps: { lab_slug: string; instructions: string; model_version: string; question: string; choices: string[] }[] };
type Evidence = { run_id: string; choice: number; reflection: string };
type Attempt = { id: string; boss_slug: string; version: number; passed: boolean; created_at: string };

export function BossMissions() {
  const { profile } = useSession();
  const bosses = useResource<Boss[]>("/api/v1/boss-missions");
  const runs = useResource<{ items: { id: string; lab: string; model_version: string; status: string; created_at: string }[] }>("/api/v1/runs?limit=100");
  const attempts = useResource<Attempt[]>("/api/v1/boss-attempts");
  const [active, setActive] = useState<Boss | null>(null), [steps, setSteps] = useState<Evidence[]>([]), [reflection, setReflection] = useState("");
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [notice, setNotice] = useState("");
  function change(index: number, patch: Partial<Evidence>) { setSteps(old => old.map((step, i) => i === index ? { ...step, ...patch } : step)); }
  return <section aria-label="Boss missions"><ResourceState {...bosses} /><div className="science-catalog">{bosses.data?.map(boss => <article className="content-card" key={boss.slug}>
    <span className="panel-kicker">{boss.reward_recorded ? "MASTERY RECORDED" : boss.locked ? "PREREQUISITE REQUIRED" : "MULTI-CONCEPT CHALLENGE"}</span><h2>{boss.title}</h2><p>{boss.objective}</p><p>{boss.steps.length} checkpoints · {boss.xp} XP once · version {boss.version}</p>
    {boss.locked && <p>Master {boss.prerequisites.join(", ")} first.</p>}<ActionButton tone="secondary" disabled={boss.locked || busy} onClick={() => { setActive(boss); setSteps(boss.steps.map(() => ({ run_id: "", choice: -1, reflection: "" }))); setReflection(""); setNotice(""); setError(""); }}>{boss.reward_recorded ? "Review challenge" : "Open challenge"}</ActionButton>
  </article>)}</div>
  {active && <section className="content-card"><h2>{active.title}: evidence notebook</h2><p>Use completed runs from the model versions shown. Reflections are saved for review; checkpoint answers determine mastery.</p><ResourceState {...runs} /><form onSubmit={async event => { event.preventDefault(); if (!profile?.authenticated || busy) return; setBusy(true); setError(""); setNotice(""); try {
    const response = await api<{ passed: boolean; xp_awarded: number; feedback: string; steps: { lab_slug: string; passed: boolean; feedback: string }[] }>(`/api/v1/boss-missions/${active.slug}/attempts`, { method: "POST", body: JSON.stringify({ version: active.version, steps, reflection }) }, profile.csrf_token);
    setNotice(`${response.feedback} ${response.passed ? "All checkpoints passed." : "Review the checkpoints and try again."} ${response.xp_awarded} XP awarded. ${response.steps.filter(step => !step.passed).map(step => `${step.lab_slug}: ${step.feedback}`).join(" ")}`); bosses.reload(); attempts.reload();
  } catch (cause) { setError(cause instanceof Error ? cause.message : "Evidence could not be saved"); } finally { setBusy(false); } }}>
    {active.steps.map((step, index) => <fieldset key={step.lab_slug} disabled={busy}><legend>Checkpoint {index + 1}: {step.lab_slug}</legend><p>{step.instructions}</p><Link className="card-action" href={`/lab/${step.lab_slug}`}>Open experiment</Link><label>Saved {step.lab_slug} run · v{step.model_version}<select required value={steps[index].run_id} onChange={event => change(index, { run_id: event.target.value })}><option value="">Select completed evidence</option>{runs.data?.items.filter(run => run.lab === step.lab_slug && run.model_version === step.model_version && run.status === "completed").map(run => <option key={run.id} value={run.id}>{new Date(run.created_at).toLocaleString()} · {run.id.slice(0, 8)}</option>)}</select></label><p>{step.question}</p>{step.choices.map((choice, i) => <label className="science-radio" key={choice}><input required type="radio" name={`boss-choice-${index}`} checked={steps[index].choice === i} onChange={() => change(index, { choice: i })} />{choice}</label>)}<label>Checkpoint {index + 1} reflection<textarea required minLength={20} maxLength={2000} value={steps[index].reflection} onChange={event => change(index, { reflection: event.target.value })} /></label></fieldset>)}
    <label>Connect the two concepts<textarea required minLength={40} maxLength={4000} value={reflection} disabled={busy} onChange={event => setReflection(event.target.value)} /></label><ActionButton type="submit" disabled={busy || !profile?.authenticated}>{busy ? "Checking evidence…" : "Submit boss evidence"}</ActionButton>
  </form>{notice && <p role="status">{notice}</p>}{error && <p role="alert">{error}</p>}</section>}
  <details className="content-card"><summary>Your challenge history</summary><ResourceState {...attempts} />{attempts.data?.length === 0 && <p>No attempts yet. Your evidence will appear here after submission.</p>}<ul>{attempts.data?.map(attempt => <li key={attempt.id}>{attempt.boss_slug} · v{attempt.version} · {attempt.passed ? "Passed" : "Review needed"} · {new Date(attempt.created_at).toLocaleString()}</li>)}</ul></details>
  </section>;
}
