"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, useSession } from "@/lib/api";
import { useResource } from "@/components/useResource";
import { ResourceState } from "@/components/ProductPage";

type Job = { id: string; lab: string; status: "queued" | "running" | "completed" | "failed" | "cancelled"; cancel_requested: boolean; error_code: string | null; run_id: string | null; created_at: string; attempts: number };
type Capabilities = { enabled: boolean; timeout_seconds: number; allowance_policy: string };

export function QueuedExperiment({ slug, parameters, prediction, seed, disabled }: { slug: string; parameters: Record<string, number>; prediction: string; seed: number; disabled: boolean }) {
  const { profile } = useSession();
  const capabilities = useResource<Capabilities>("/api/v1/simulation-jobs/capabilities");
  const history = useResource<Job[]>("/api/v1/simulation-jobs");
  const [job, setJob] = useState<Job | null>(null), [busy, setBusy] = useState(false), [error, setError] = useState("");
  const request = useRef<{ fingerprint: string; key: string } | null>(null);
  useEffect(() => {
    if (!job || !["queued", "running"].includes(job.status)) return;
    const controller = new AbortController();
    const timer = setTimeout(() => { api<Job>(`/api/v1/simulation-jobs/${job.id}`, { signal: controller.signal }).then(next => { if (!controller.signal.aborted) { setJob(next); setError(""); if (!["queued", "running"].includes(next.status)) history.reload(); } }).catch(cause => { if (!controller.signal.aborted) { setError(cause instanceof Error ? cause.message : "Job status unavailable"); setJob(old => old ? { ...old } : old); } }); }, 2000);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [job, history.reload]);
  return <details className="science-queued"><summary>Background execution</summary><ResourceState {...capabilities} /><p>Submit this configuration to a durable scientific worker. You can leave this screen and reopen a job from the list below.</p>{capabilities.data && <><p className="science-muted">{capabilities.data.allowance_policy} Worker deadline: {capabilities.data.timeout_seconds} seconds.</p>{!capabilities.data.enabled && <p role="note">Background execution is unavailable on this deployment. Use Run experiment above.</p>}</>}
    <button type="button" disabled={busy || disabled || prediction.trim().length < 3 || !capabilities.data?.enabled} onClick={async () => { if (!profile?.authenticated || busy) return; setBusy(true); setError(""); const payload = { parameters, prediction, seed }; const fingerprint = JSON.stringify({ slug, ...payload }); if (request.current?.fingerprint !== fingerprint) request.current = { fingerprint, key: crypto.randomUUID() }; try { const result = await api<Job>(`/api/v1/labs/${encodeURIComponent(slug)}/jobs`, { method: "POST", body: JSON.stringify({ ...payload, request_key: request.current.key }) }, profile.csrf_token); setJob(result); request.current = null; history.reload(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Job could not be submitted"); } finally { setBusy(false); } }}>{busy ? "Submitting…" : "Queue experiment"}</button>
    {job && <div aria-live="polite"><p>Job {job.id.slice(0, 8)}: {job.status}{job.cancel_requested && job.status === "running" ? " · cancellation requested" : ""}{job.error_code ? ` · ${job.error_code.replaceAll("_", " ")}` : ""}</p>{job.run_id && <Link className="card-action" href={`/notebook?run=${encodeURIComponent(job.run_id)}`}>Open completed result</Link>}{["queued", "running"].includes(job.status) && <button type="button" disabled={busy || job.cancel_requested} onClick={async () => { if (!profile?.authenticated) return; setBusy(true); setError(""); try { setJob(await api<Job>(`/api/v1/simulation-jobs/${job.id}/cancel`, { method: "POST" }, profile.csrf_token)); history.reload(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Cancellation could not be requested"); } finally { setBusy(false); } }}>Cancel background job</button>}</div>}{error && <p role="alert">{error}</p>}
    <ResourceState {...history} /><ul>{history.data?.filter(item => item.lab === slug).slice(0, 10).map(item => <li key={item.id}><button type="button" onClick={() => { setJob(item); setError(""); }}>{new Date(item.created_at).toLocaleString()} · {item.status}</button>{item.run_id && <> <Link href={`/notebook?run=${encodeURIComponent(item.run_id)}`}>Saved result</Link></>}</li>)}</ul>{history.data?.filter(item => item.lab === slug).length === 0 && <p>No background jobs for this experiment yet.</p>}
  </details>;
}
