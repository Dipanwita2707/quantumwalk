"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { api, useSession } from "@/lib/api";

type Export = { profile: object; circuits: object[]; progress: object[] };

export default function ProfilePage() {
  const router = useRouter();
  const { profile, loading, refresh } = useSession();
  const [name, setName] = useState("");
  const [analytics, setAnalytics] = useState(false);
  const [deletionText, setDeletionText] = useState("");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<"" | "save" | "export" | "logout" | "delete">("");
  useEffect(() => { if (profile?.authenticated) { setName(profile.display_name); setAnalytics(profile.analytics_opt_in); } }, [profile]);
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!profile?.authenticated || busy) return;
    setBusy("save"); setError(""); setNotice("");
    try { await api("/api/profile", { method: "PUT", body: JSON.stringify({ display_name: name, analytics_opt_in: analytics }) }, profile.csrf_token); setNotice("Profile saved."); await refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save profile."); }
    finally { setBusy(""); }
  }
  async function exportData() {
    if (busy) return;
    setBusy("export"); setError(""); setNotice("");
    try {
      const data = await api<Export>("/api/account/export");
      const url = URL.createObjectURL(new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
      const link = document.createElement("a"); link.href = url; link.download = "quantumwalk-data.json"; link.click(); URL.revokeObjectURL(url);
      setNotice("Data export started.");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not export data."); }
    finally { setBusy(""); }
  }
  async function logout() {
    if (!profile?.authenticated || busy) return;
    setBusy("logout"); setError(""); setNotice("");
    try { await api<null>("/api/logout", { method: "POST" }, profile.csrf_token); try { localStorage.removeItem(`qw_circuit_draft_${profile.id}`); localStorage.removeItem("qw_circuit_draft"); } catch { /* Storage may be unavailable. */ } await refresh(); router.push("/"); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not sign out."); }
    finally { setBusy(""); }
  }
  async function deleteAccount() {
    if (!profile?.authenticated || deletionText !== "DELETE" || busy) return;
    setBusy("delete"); setError(""); setNotice("");
    try { await api<null>("/api/account", { method: "DELETE" }, profile.csrf_token); try { localStorage.removeItem(`qw_circuit_draft_${profile.id}`); localStorage.removeItem("qw_circuit_draft"); } catch { /* Storage may be unavailable. */ } await refresh(); router.push("/"); router.refresh(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not delete account."); }
    finally { setBusy(""); }
  }
  return <><SiteHeader /><main className="content-shell narrow"><p className="eyebrow">ACCOUNT & PRIVACY</p><h1>Your profile</h1>
    {loading && <p role="status">Loading account…</p>}
    {!loading && !profile?.authenticated && <p className="content-card">Sign in to manage your account. <Link className="card-action" href="/login">Sign in →</Link></p>}
    {error && <p className="content-error" role="alert">{error}</p>}{notice && <p className="success-note" role="status">{notice}</p>}{busy && <p role="status">{busy === "save" ? "Saving profile…" : busy === "export" ? "Preparing data export…" : busy === "logout" ? "Signing out…" : "Deleting account…"}</p>}
    {profile?.authenticated && <><form className="content-card profile-form" onSubmit={(event) => void save(event)}><label>Display name<input value={name} maxLength={120} required onChange={(event) => setName(event.target.value)} /></label><p>Signed in with Google as <strong>{profile.email}</strong>.</p><label className="checkbox-line"><input type="checkbox" checked={analytics} onChange={(event) => setAnalytics(event.target.checked)} /> Allow optional product analytics</label><button className="primary-action" type="submit" disabled={busy !== ""}>Save profile</button></form>
      <section className="content-card"><h2>Your data</h2><p>Circuits are private by default. Export a copy or delete your account and saved work.</p><div className="card-actions"><button disabled={busy !== ""} onClick={() => void exportData()}>Export my data</button><button disabled={busy !== ""} onClick={() => void logout()}>Sign out</button></div><hr /><label>Type DELETE to confirm permanent account deletion<input value={deletionText} onChange={(event) => setDeletionText(event.target.value)} /></label><button className="danger-action" disabled={deletionText !== "DELETE" || busy !== ""} onClick={() => void deleteAccount()}>Delete account and data</button></section></>}
    <p className="legal-small"><Link href="/privacy">Privacy notice</Link> · <Link href="/terms">Terms</Link></p>
  </main></>;
}
