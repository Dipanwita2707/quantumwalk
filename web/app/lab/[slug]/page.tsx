"use client";

import Link from "next/link";
import { use, useEffect, useRef, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ScienceChart } from "@/components/ScienceChart";
import { DoubleSlitDisplay } from "@/components/DoubleSlitDisplay";
import { QueuedExperiment } from "@/components/QueuedExperiment";
import { ParameterSweep } from "@/components/ParameterSweep";
import { ActionButton, PageHeading } from "@/components/ui/QuantumUI";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { api, useSession } from "@/lib/api";
import { displayNumber, type ScienceLab, type ScienceResult } from "@/lib/science";
import "../science.css";

export default function ScienceWorkspace({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params), { profile } = useSession();
  const [lab, setLab] = useState<ScienceLab | null>(null), [values, setValues] = useState<Record<string, number>>({}), [prediction, setPrediction] = useState(""), [seed, setSeed] = useState(42), [result, setResult] = useState<ScienceResult | null>(null);
  const [tab, setTab] = useState("simulation"), [busy, setBusy] = useState(false), [error, setError] = useState(""), [stale, setStale] = useState(false), [attempt, setAttempt] = useState(0);
  const pending = useRef<AbortController | null>(null);
  useEffect(() => { const controller = new AbortController(); setLab(null); setError(""); setResult(null); setPrediction(""); api<ScienceLab>(`/api/science/labs/${encodeURIComponent(slug)}`, { signal: controller.signal }).then(data => { if (!controller.signal.aborted) { setLab(data); setValues(Object.fromEntries(data.parameters.map(p => [p.key, p.default]))); } }).catch(cause => { if (!controller.signal.aborted) setError(cause.message); }); return () => { controller.abort(); pending.current?.abort(); }; }, [slug, attempt]);
  useEffect(() => {
    if (!lab) return;
    const source = new URLSearchParams(location.search).get("from");
    if (!source) return;
    const controller = new AbortController();
    api<ScienceResult & { prediction: string }>(`/api/v1/runs/${encodeURIComponent(source)}`, { signal: controller.signal }).then(saved => {
      if (controller.signal.aborted) return;
      if (saved.lab !== slug || saved.model_version !== lab.version) { setError("The saved run belongs to a different model or version."); return; }
      setValues(saved.parameters); setSeed(saved.seed); setPrediction(saved.prediction);
    }).catch(cause => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [lab, slug]);
  function reset() { if (!lab) return; pending.current?.abort(); setBusy(false); setValues(Object.fromEntries(lab.parameters.map(p => [p.key, p.default]))); setSeed(42); setPrediction(""); setResult(null); setError(""); setStale(false); }
  async function run(event: React.FormEvent) {
    event.preventDefault(); if (!lab || busy || !prediction.trim()) return;
    const controller = new AbortController(); pending.current = controller; setBusy(true); setError("");
    try {
      const signedIn = profile?.authenticated;
      const output = await api<ScienceResult>(signedIn ? `/api/v1/labs/${slug}/runs` : `/api/science/labs/${slug}/run`, { method: "POST", signal: controller.signal, body: JSON.stringify({ parameters: values, seed, ...(signedIn ? { prediction } : {}) }) }, signedIn ? profile.csrf_token : undefined);
      if (!controller.signal.aborted) { setResult(output); setStale(false); }
    } catch (cause) { if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : "The experiment failed. Your inputs have been preserved."); }
    finally { if (!controller.signal.aborted) setBusy(false); }
  }
  return <><SiteHeader /><main className="content-shell science-shell"><Link className="science-back" href="/lab">← All experiments</Link>{!lab && !error && <p role="status">Preparing the experiment…</p>}{error && <p role="alert" className="content-error">{error} {!lab && <button onClick={() => setAttempt(value => value + 1)}>Retry</button>}</p>}{lab && <><PageHeading eyebrow={`${lab.domain} / ${lab.level}`} title={lab.title} description={lab.question} actions={<span>Classical model / v{lab.version}<br />{lab.minutes} min / review pending</span>} />
    <div className="science-tabs"><SegmentedControl label="Experiment sections" value={tab} onChange={setTab} items={[{ value: "simulation", label: "Simulation" }, { value: "explanation", label: "Explanation" }, { value: "connections", label: "Quantum connection" }]} /></div>
    {tab === "simulation" ? <div className="science-workbench"><form className="content-card science-controls" onSubmit={run}><h2>Experiment controls</h2>{lab.parameters.map(p => <label key={p.key}>{p.label}<span>{displayNumber(values[p.key] ?? p.default)} {p.unit}</span><input type="range" min={p.minimum} max={p.maximum} step={p.step} value={values[p.key] ?? p.default} disabled={busy} onChange={event => { setValues(old => ({ ...old, [p.key]: Number(event.target.value) })); setStale(!!result); }} /></label>)}<label className="science-prediction">Your prediction<small>{lab.prediction}</small><textarea required maxLength={2000} value={prediction} disabled={busy} onChange={event => setPrediction(event.target.value)} placeholder="I predict… because…" /></label><details><summary>Reproducibility</summary><label>Random seed<input type="number" min="0" max="4294967295" step="1" value={seed} disabled={busy} onChange={event => { setSeed(Number(event.target.value)); setStale(!!result); }} /></label></details><ActionButton className="science-primary" type="submit" disabled={busy || !prediction.trim()}>{busy ? "Running model…" : "Run experiment"}</ActionButton><ActionButton tone="secondary" onClick={reset}>Reset</ActionButton><p className="science-muted">{profile?.authenticated ? "Successful runs are saved privately to your notebook." : "Guest preview. Sign in to save runs and export reports."}</p>{profile?.authenticated && <QueuedExperiment key={slug} slug={slug} parameters={values} prediction={prediction} seed={seed} disabled={busy} />}</form>
    <section className="science-results" aria-label="Experiment results" aria-busy={busy}>{busy && <p role="status">Calculating the model…</p>}{stale && <p role="status" className="science-warning">Parameters changed. Run again to update the results.</p>}{result ? <><div className="content-card"><p className="science-run-state" role="status">Completed {result.id ? "· Saved privately" : "· Guest preview"} · seed {result.seed}</p>{lab.slug === "double-slit" && <DoubleSlitDisplay lab={lab} result={result} />}<ScienceChart result={result} /></div><dl className="science-metrics">{Object.entries(result.metrics).map(([key, value]) => <div className="content-card" key={key}><dt>{key}</dt><dd>{displayNumber(value)}</dd></div>)}</dl><div className="content-card"><h2>Interpret your result</h2><p>{result.interpretation ?? lab.objective}</p><p>Compare the measured or calculated curves with your prediction. Change one parameter and repeat using the same seed.</p>{result.id && <Link className="card-action" href={`/notebook?run=${encodeURIComponent(result.id)}`}>Open saved run & reports →</Link>}</div></> : <div className="content-card science-initial"><svg viewBox="0 0 400 180" fill="none" aria-hidden="true"><path d="M0 90C40 0 60 0 100 90S160 180 200 90S260 0 300 90S360 180 400 90" /><path d="M0 90H400" opacity=".2" /></svg><h2>What do you think will happen?</h2><p>Adjust the controls, record a prediction, then run the model to reveal the result.</p></div>}<ParameterSweep lab={lab} parameters={values} prediction={prediction} seed={seed} /><details className="content-card"><summary>Model assumptions & scientific limits</summary><p>{lab.assumptions}</p><p>{lab.limitations}</p><a href={lab.reference} target="_blank" rel="noreferrer">Model reference ↗</a></details></section></div> : <section className="content-card science-reading"><h2>{tab === "explanation" ? "The model behind the experiment" : "Connect the ideas"}</h2><p>{lab.objective}</p><p className="science-equation">{lab.model}</p><p>{lab.assumptions}</p><p>{lab.limitations}</p><a href={lab.reference} target="_blank" rel="noreferrer">Read the model reference ↗</a>{tab === "connections" && <p><Link className="card-action" href={lab.related}>Explore the related concept →</Link></p>}</section>}
  </>}</main></>;
}
