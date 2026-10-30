"use client";
import { useState } from "react";
import { ProductPage, ResourceState } from "@/components/ProductPage";
import { useResource } from "@/components/useResource";
import { api, useSession } from "@/lib/api";
import { BossEditor } from "@/components/BossEditor";
import { LessonPublishing } from "@/components/LessonPublishing";
import { OperationsConsole } from "@/components/OperationsConsole";
import { PlanEditor } from "@/components/PlanEditor";
import { InstitutionAccess } from "@/components/InstitutionAccess";
import { ContentDraftEditor, type ContentDraft } from "@/components/ContentDraftEditor";
type Content = { slug: string; title: string; status: string; version: string; limitations: string; draft: ContentDraft };
export default function AdminPage() {
  const { profile } = useSession(); const [tab, setTab] = useState("content"), [notice, setNotice] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false), [userId, setUserId] = useState(""), [role, setRole] = useState("reviewer");
  const content = useResource<Content[]>("/api/v1/admin/content");
  const audit = useResource<{ id: string; action: string; target: string; created_at: string }[]>("/api/v1/admin/audit");
  const reports = useResource<{ id: string; title: string; post_id: string; reason: string }[]>("/api/v1/admin/community-reports");
  async function act(path: string, payload: object, method = "POST") { if (!profile?.authenticated) return; setBusy(true); setError(""); try { await api(path, { method, body: JSON.stringify(payload) }, profile.csrf_token); setNotice("Change recorded in the audit log."); content.reload(); audit.reload(); reports.reload(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Action failed"); } finally { setBusy(false); } }
  return <ProductPage title="Platform review console" eyebrow="AUTHORIZED OPERATIONS" description="Review scientific content, manage scoped roles and investigate community reports. Every privileged change is audited."><nav className="science-tabs" aria-label="Administration sections">{["content", "moderation", "roles", "plans", "lessons", "bosses", "operations", "audit"].map(value => <button key={value} aria-pressed={tab === value} onClick={() => setTab(value)}>{value}</button>)}</nav>{notice && <p role="status">{notice}</p>}{error && <p role="alert">{error}</p>}
    {tab === "content" && <><ResourceState {...content} />{content.data?.map(lab => <section className="content-card" key={lab.slug}><span className="panel-kicker">v{lab.version} · {lab.status}</span><h2>{lab.title}</h2><p>{lab.limitations}</p><ContentDraftEditor slug={lab.slug} draft={lab.draft} onSaved={content.reload} /><div className="card-actions">{["approved", "draft", "retired"].map(status => <button disabled={busy} key={status} onClick={() => { const rationale = prompt(`Record your scientific review rationale before setting ${status} (at least 20 characters).`); if (rationale && rationale.length >= 20) void act(`/api/v1/admin/content/${lab.slug}`, { status, rationale }, "PUT"); }}>Set {status}</button>)}</div></section>)}</>}
    {tab === "audit" && <><ResourceState {...audit} />{audit.data?.map(event => <article className="content-card" key={event.id}><strong>{event.action}</strong><p>{event.target} · {new Date(event.created_at).toLocaleString()}</p></article>)}</>}
    {tab === "moderation" && <><ResourceState {...reports} />{reports.data?.map(report => <section className="content-card" key={report.id}><h2>{report.title}</h2><p>{report.reason}</p><button disabled={busy} onClick={() => { const reason = prompt("Record the moderation reason (at least 10 characters)."); if (reason && reason.length >= 10) void act(`/api/v1/admin/community/${report.post_id}/hide`, { reason }); }}>Hide reported post</button></section>)}</>}
    {tab === "lessons" && <LessonPublishing />}
    {tab === "bosses" && <BossEditor />}
    {tab === "operations" && <OperationsConsole />}
    {tab === "plans" && <><PlanEditor /><InstitutionAccess /></>}
    {tab === "roles" && <section className="content-card"><h2>Scoped role assignment</h2><form onSubmit={event => { event.preventDefault(); void act("/api/v1/admin/roles", { user_id: userId, role, grant: true }); }}><label>User ID<input required maxLength={36} value={userId} onChange={event => setUserId(event.target.value)} /></label><label>Role<select value={role} onChange={event => setRole(event.target.value)}>{["reviewer", "faculty", "moderator"].map(value => <option key={value}>{value}</option>)}</select></label><button disabled={busy}>Grant role</button><button disabled={busy} type="button" onClick={() => void act("/api/v1/admin/roles", { user_id: userId, role, grant: false })}>Revoke role</button></form></section>}
  </ProductPage>;
}
