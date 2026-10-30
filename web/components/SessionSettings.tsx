"use client";
import { useState } from "react";
import { api, useSession } from "@/lib/api";
import { useResource } from "@/components/useResource";
export function SessionSettings() {
  const { profile } = useSession(); const resource = useResource<{ id: string; expires_at: number; current: boolean }[]>("/api/v1/auth/sessions"); const [notice, setNotice] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  return <section className="content-card"><h2>Account sessions</h2>{resource.loading && <p role="status">Loading sessions…</p>}{resource.error && <p role="alert">{resource.error} <button onClick={resource.reload}>Retry</button></p>}<ul>{resource.data?.map(session => <li key={session.id}>{session.current ? "This session" : "Another active session"} · expires {new Date(session.expires_at * 1000).toLocaleString()}</li>)}</ul><button disabled={busy || !resource.data?.some(session => !session.current)} onClick={async () => { if (!profile?.authenticated) return; setBusy(true); setError(""); try { const response = await api<{ revoked: number }>("/api/v1/auth/sessions/revoke-others", { method: "POST" }, profile.csrf_token); setNotice(`${response.revoked} other sessions signed out.`); resource.reload(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not revoke sessions"); } finally { setBusy(false); } }}>Sign out other sessions</button>{notice && <p role="status">{notice}</p>}{error && <p role="alert">{error}</p>}</section>;
}
