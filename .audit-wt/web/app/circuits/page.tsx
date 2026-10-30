"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { api, useSession } from "@/lib/api";

type SavedCircuit = { id: string; name: string; qubits: number; operations: unknown[]; updated_at: string };

export default function CircuitsPage() {
  const { profile, loading: accountLoading } = useSession();
  const [items, setItems] = useState<SavedCircuit[] | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try { setItems(await api<SavedCircuit[]>("/api/circuits")); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load circuits."); }
  }, []);
  useEffect(() => { if (profile?.authenticated) void load(); }, [profile?.authenticated, load]);
  async function remove(item: SavedCircuit) {
    if (!profile?.authenticated || !window.confirm(`Delete "${item.name}"? This cannot be undone.`)) return;
    try { await api<null>(`/api/circuits/${encodeURIComponent(item.id)}`, { method: "DELETE" }, profile.csrf_token); await load(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete circuit."); }
  }
  return <><SiteHeader /><main className="content-shell"><p className="eyebrow">YOUR PRIVATE WORK</p><h1>Saved circuits</h1><p className="content-intro">Only you can view and change these circuits.</p>
    {accountLoading && <p role="status">Checking account…</p>}
    {!accountLoading && !profile?.authenticated && <div className="content-card"><p>Sign in with Google to save and revisit circuits.</p><Link className="card-action" href="/login">Go to sign in →</Link></div>}
    {error && <div className="content-error" role="alert">{error} <button onClick={() => void load()}>Retry</button></div>}
    {profile?.authenticated && items === null && !error && <p role="status">Loading your saved circuits…</p>}
    {profile?.authenticated && items?.length === 0 && <div className="content-card"><p>No saved circuits yet. Build one in the lab, then choose Save.</p><Link className="card-action" href="/workspace">Open the lab →</Link></div>}
    {profile?.authenticated && items && items.length > 0 && <div className="content-cards">{items.map((item) => <article className="content-card" key={item.id}><span className="panel-kicker">{item.qubits} QUBITS · {item.operations.length} OPERATIONS</span><h2>{item.name}</h2><p>Updated {new Date(item.updated_at).toLocaleDateString()}</p><div className="card-actions"><Link className="card-action" href={`/workspace?mode=circuit&circuit=${encodeURIComponent(item.id)}`}>Open in Lab →</Link><button type="button" onClick={() => void remove(item)}>Delete</button></div></article>)}</div>}
  </main></>;
}
