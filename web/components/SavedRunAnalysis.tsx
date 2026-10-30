"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, useSession } from "@/lib/api";
import { ScienceChart } from "@/components/ScienceChart";
import { ActionButton } from "@/components/ui/QuantumUI";
import { displayNumber, type ScienceLab, type ScienceResult } from "@/lib/science";

type Review = { prediction: string; checks: { name: string; state: string; detail: string }[]; assumptions: string; limitations: string; configuration_checksum: string; assessment: string; next_steps: string[] };
type Variant = { variant: ScienceResult & { id: string }; metrics: { metric: string; baseline: number; variant: number; difference: number }[]; interpretation: string; same_grid: boolean };
export function SavedRunAnalysis({ run, onSaved }: { run: ScienceResult & { id: string }; onSaved?: () => void }) {
  const { profile } = useSession();
  const [open, setOpen] = useState(false), [review, setReview] = useState<Review | null>(null), [lab, setLab] = useState<ScienceLab | null>(null);
  const [parameter, setParameter] = useState(""), [value, setValue] = useState(0), [prediction, setPrediction] = useState(""), [variant, setVariant] = useState<Variant | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  useEffect(() => {
    if (!open) return;
    const controller = new AbortController(); setError(""); setReview(null); setLab(null); setVariant(null);
    Promise.all([api<Review>(`/api/v1/runs/${run.id}/autopsy`, { signal: controller.signal }), api<ScienceLab>(`/api/science/labs/${run.lab}`, { signal: controller.signal })]).then(([analysis, model]) => {
      if (controller.signal.aborted) return;
      setReview(analysis); setLab(model); setParameter(model.parameters[0].key); setValue(run.parameters[model.parameters[0].key]);
    }).catch(cause => { if (!controller.signal.aborted) setError(cause.message); });
    return () => controller.abort();
  }, [open, run.id, run.lab, run.parameters]);
  const control = lab?.parameters.find(item => item.key === parameter);
  return <details className="content-card saved-run-analysis" onToggle={event => setOpen(event.currentTarget.open)}><summary>What-If &amp; Experiment Autopsy</summary>{open && <>
    {error && <p role="alert" className="content-error">{error}</p>}{!review && !error && <p role="status">Reviewing the saved evidence...</p>}
    {review && <><h3>Experiment Autopsy</h3><p><strong>Your prediction:</strong> {review.prediction}</p><dl>{review.checks.map(check => <div key={check.name}><dt>{check.name} / {check.state}</dt><dd>{check.detail}</dd></div>)}</dl><details><summary>Model assumptions and limitations</summary><p>{review.assumptions}</p><p>{review.limitations}</p><p className="science-muted">Configuration checksum: <code style={{ overflowWrap: "anywhere" }}>{review.configuration_checksum}</code></p></details><p className="science-muted">{review.assessment}</p>
    <h3>What if one parameter changed?</h3><p>Run a private variant using the same seed and model version. The baseline stays unchanged; the normal experiment allowance applies.</p>
    {lab && lab.version !== run.model_version ? <p role="status">This run uses an older model version. Reopen the model to start a compatible comparison.</p> : control && <form onSubmit={async event => { event.preventDefault(); if (!profile?.authenticated) return; setBusy(true); setError(""); try { const output = await api<Variant>(`/api/v1/runs/${run.id}/what-if`, { method: "POST", body: JSON.stringify({ parameters: { [parameter]: value }, prediction }) }, profile.csrf_token); setVariant(output); onSaved?.(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Variant execution failed"); } finally { setBusy(false); } }}>
      <label>Parameter to change<select disabled={busy} value={parameter} onChange={event => { setParameter(event.target.value); setValue(run.parameters[event.target.value]); }}>{lab?.parameters.map(item => <option key={item.key} value={item.key}>{item.label}</option>)}</select></label>
      <label>Variant value ({control.unit || "dimensionless"})<input type="number" min={control.minimum} max={control.maximum} step={control.step} value={value} disabled={busy} required onChange={event => setValue(Number(event.target.value))} /></label><p className="science-muted">Baseline: {displayNumber(run.parameters[parameter])}; seed {run.seed}</p>
      <label>Prediction for this variation<textarea required minLength={3} maxLength={2000} disabled={busy} value={prediction} onChange={event => setPrediction(event.target.value)} /></label><ActionButton type="submit" disabled={busy || !prediction.trim() || value === run.parameters[parameter]}>{busy ? "Running variation..." : "Run controlled variation"}</ActionButton>
    </form>}</>}
    {variant && <section aria-label="Controlled comparison"><p role="status">Variation completed and saved privately.</p><div className="science-compare"><div><h4>Baseline</h4><ScienceChart result={run} /></div><div><h4>Variation</h4><ScienceChart result={variant.variant} /></div></div><div className="science-table-scroll"><table><caption>Computed metric differences</caption><thead><tr><th>Metric</th><th>Baseline</th><th>Variation</th><th>Difference</th></tr></thead><tbody>{variant.metrics.map(item => <tr key={item.metric}><th>{item.metric}</th><td>{displayNumber(item.baseline)}</td><td>{displayNumber(item.variant)}</td><td>{displayNumber(item.difference)}</td></tr>)}</tbody></table></div><p>{variant.interpretation}</p>{!variant.same_grid && <p className="science-warning">The axis grids differ. Compare each plot using its own axis.</p>}<Link className="card-action" href={`/notebook?run=${variant.variant.id}`}>Open saved variation</Link></section>}
  </>}</details>;
}
