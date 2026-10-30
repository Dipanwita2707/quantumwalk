"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ProductPage, ResourceState } from "@/components/ProductPage";
import { useResource } from "@/components/useResource";
import { SavedRunAnalysis } from "@/components/SavedRunAnalysis";
import { ScienceChart } from "@/components/ScienceChart";
import { api, getApiBase, useSession } from "@/lib/api";
import type { ScienceResult } from "@/lib/science";

type Run = ScienceResult & { id: string; title: string; created_at: string; prediction: string };
type Entry = { id: string; run_id: string; notes: string };

export default function NotebookPage() {
  const { profile } = useSession();
  const [query, setQuery] = useState(""), [offset, setOffset] = useState(0), [selected, setSelected] = useState<string[]>([]), [notebook, setNotebook] = useState(""), [title, setTitle] = useState(""), [notes, setNotes] = useState(""), [notice, setNotice] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const runs = useResource<{ items: Run[]; total: number }>(`/api/v1/runs?q=${encodeURIComponent(query)}&offset=${offset}`);
  const books = useResource<{ id: string; title: string }[]>("/api/v1/notebooks");
  const entries = useResource<Entry[]>(notebook ? `/api/v1/notebooks/${notebook}/entries` : "/api/v1/notebooks");
  const [current, setCurrent] = useState<Run | null>(null);
  useEffect(() => { const id = new URLSearchParams(window.location.search).get("run"); if (id) api<Run>(`/api/v1/runs/${encodeURIComponent(id)}`).then(setCurrent).catch(cause => setError(cause.message)); }, []);
  async function perform(action: () => Promise<void>) { setBusy(true); setError(""); setNotice(""); try { await action(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not complete the action"); } finally { setBusy(false); } }
  async function exportRun(run: Run, format: string) {
    if (!profile?.authenticated) return;
    await perform(async () => { const report = await api<{ download: string }>("/api/v1/reports", { method: "POST", body: JSON.stringify({ run_id: run.id, format }) }, profile.csrf_token); const link = document.createElement("a"); link.href = getApiBase() + report.download; link.click(); setNotice("Report ready. Download requested."); });
  }
  const comparison = (runs.data?.items ?? []).filter(run => selected.includes(run.id));
  return <ProductPage title="Your experiment notebook" eyebrow="PRIVATE RESEARCH" description="Revisit reproducible runs, record your interpretation, and export the evidence.">
    <ResourceState {...runs} /><ResourceState {...books} />{error && <p role="alert" className="content-error">{error}</p>}{notice && <p role="status">{notice}</p>}
    <div className="science-filters"><label>Search saved experiments<input type="search" value={query} onChange={event => { setQuery(event.target.value); setOffset(0); }} /></label><Link className="science-primary" href="/lab">New experiment →</Link></div>
    {current && <section className="content-card"><h2>{current.title}</h2><p>{current.prediction}</p><ScienceChart result={current} /><SavedRunAnalysis key={current.id} run={current} onSaved={runs.reload} /><div className="card-actions">{["pdf", "csv", "json"].map(format => <button key={format} disabled={busy} onClick={() => void exportRun(current, format)}>Export {format.toUpperCase()}</button>)}<Link className="card-action" href={`/lab/${current.lab}?from=${current.id}`}>Duplicate & change parameters</Link><button onClick={() => setCurrent(null)}>Close run</button></div></section>}
    {runs.data?.items.length === 0 && <section className="content-card"><h2>Your first discovery belongs here</h2><p>Run an experiment while signed in. Its inputs, prediction, seed and results will be saved privately.</p><Link className="card-action" href="/lab/double-slit">Try Double-Slit Mystery →</Link></section>}
    <div className="saved-work-list">{runs.data?.items.map(run => <article className="content-card" key={run.id}><span className="panel-kicker">{run.status} · v{run.model_version} · seed {run.seed}</span><h2>{run.title}</h2><p>{new Date(run.created_at).toLocaleString()}</p><div className="card-actions"><label><input type="checkbox" checked={selected.includes(run.id)} disabled={!selected.includes(run.id) && selected.length >= 2} onChange={event => setSelected(old => event.target.checked ? [...old, run.id] : old.filter(id => id !== run.id))} />Compare</label><button onClick={() => setCurrent(run)}>Open run</button></div></article>)}</div>
    {runs.data && <div className="card-actions"><button disabled={offset === 0} onClick={() => setOffset(value => Math.max(0, value - 20))}>Previous</button><span>{offset + 1}–{Math.min(offset + 20, runs.data.total)} of {runs.data.total}</span><button disabled={offset + 20 >= runs.data.total} onClick={() => setOffset(value => value + 20)}>Next</button></div>}
    {comparison.length === 2 && <section className="content-card"><h2>Compare runs</h2>{comparison[0].lab === comparison[1].lab && comparison[0].model_version === comparison[1].model_version ? <div className="science-compare">{comparison.map(run => <div key={run.id}><p>Seed {run.seed} · {JSON.stringify(run.parameters)}</p><ScienceChart result={run} /></div>)}</div> : <p role="status">Choose two runs of the same lab and model version for a meaningful comparison.</p>}</section>}
    <section className="content-card"><h2>Organize your research</h2><form className="science-filters" onSubmit={event => { event.preventDefault(); if (!profile?.authenticated) return; void perform(async () => { await api("/api/v1/notebooks", { method: "POST", body: JSON.stringify({ title }) }, profile.csrf_token); books.reload(); setTitle(""); setNotice("Notebook created."); }); }}><label>Notebook title<input required maxLength={120} value={title} onChange={event => setTitle(event.target.value)} /></label><button disabled={busy} className="science-primary">Create notebook</button></form>
      <label>Choose notebook<select value={notebook} onChange={event => setNotebook(event.target.value)}><option value="">Select a notebook</option>{books.data?.map(book => <option key={book.id} value={book.id}>{book.title}</option>)}</select></label>
      {notebook && <><ResourceState {...entries} /><form onSubmit={event => { event.preventDefault(); if (!profile?.authenticated || !current) return; void perform(async () => { await api(`/api/v1/notebooks/${notebook}/entries`, { method: "POST", body: JSON.stringify({ run_id: current.id, notes }) }, profile.csrf_token); entries.reload(); setNotes(""); setNotice("Entry saved."); }); }}><p>{current ? `Add the open run: ${current.title}` : "Open a saved run above to attach it."}</p><label>Interpretation and notes<textarea maxLength={10000} value={notes} onChange={event => setNotes(event.target.value)} /></label><button disabled={busy || !current}>Save entry</button></form>{entries.data?.filter(entry => "notes" in entry).map(entry => <article key={entry.id}><p>{entry.notes || "No notes yet."}</p><button onClick={() => void perform(async () => setCurrent(await api<Run>(`/api/v1/runs/${entry.run_id}`)))}>Open attached run</button></article>)}</>}
    </section>
  </ProductPage>;
}
