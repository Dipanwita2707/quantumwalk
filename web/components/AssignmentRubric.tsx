"use client";
import { useEffect, useState } from "react";
import { api, useSession } from "@/lib/api";
import { useResource } from "@/components/useResource";
import { ResourceState } from "@/components/ProductPage";
type Criterion = { id: string; title: string; description: string; weight: number; maximum: number };
type Rubric = { definition: { criteria: Criterion[] } | null; revision: number; frozen: boolean };
const startingCriteria: Criterion[] = [{ id: "evidence", title: "Scientific evidence", description: "Uses a reproducible result and explains relevant measurements.", weight: 50, maximum: 4 }, { id: "interpretation", title: "Interpretation", description: "Explains the result and discusses the model assumptions.", weight: 50, maximum: 4 }];

export function AssignmentRubric({ assignmentId, instructor }: { assignmentId: string; instructor: boolean }) {
  const { profile } = useSession();
  const resource = useResource<Rubric>(`/api/v1/faculty/assignments/${assignmentId}/rubric`);
  const [criteria, setCriteria] = useState(startingCriteria), [error, setError] = useState(""), [notice, setNotice] = useState(""), [busy, setBusy] = useState(false);
  useEffect(() => { if (resource.data?.definition) setCriteria(resource.data.definition.criteria); }, [resource.data]);
  return <details><summary>Assessment rubric</summary><ResourceState {...resource} />{resource.data && <>
    {!resource.data.definition && <p>This assignment currently uses an ordinary score and written feedback.</p>}
    {resource.data.definition?.criteria.map(item => <article key={item.id}><h3>{item.title} / {item.weight}%</h3><p>{item.description}</p><p>Score range: 0 to {item.maximum}</p></article>)}
    {instructor && (resource.data.frozen ? <p>Rubric editing is locked because learner evidence has been submitted.</p> : <form onSubmit={async event => { event.preventDefault(); if (!profile?.authenticated) return; setBusy(true); setError(""); try { await api(`/api/v1/faculty/assignments/${assignmentId}/rubric`, { method: "PUT", body: JSON.stringify({ criteria }) }, profile.csrf_token); resource.reload(); setNotice("Weighted rubric saved."); } catch (cause) { setError(cause instanceof Error ? cause.message : "Rubric save failed"); } finally { setBusy(false); } }}>
      {criteria.map((item, index) => <fieldset key={item.id}><legend>Criterion {index + 1}</legend><label>Criterion title<input required minLength={3} maxLength={100} value={item.title} onChange={event => setCriteria(criteria.map((value, i) => i === index ? { ...value, title: event.target.value } : value))} /></label><label>Criterion description<textarea required minLength={10} maxLength={1500} value={item.description} onChange={event => setCriteria(criteria.map((value, i) => i === index ? { ...value, description: event.target.value } : value))} /></label><label>Weight (%)<input type="number" min={1} max={100} value={item.weight} onChange={event => setCriteria(criteria.map((value, i) => i === index ? { ...value, weight: Number(event.target.value) } : value))} /></label><label>Maximum points<input type="number" min={1} max={100} value={item.maximum} onChange={event => setCriteria(criteria.map((value, i) => i === index ? { ...value, maximum: Number(event.target.value) } : value))} /></label><button type="button" disabled={criteria.length === 1} onClick={() => setCriteria(criteria.filter((_, i) => i !== index))}>Remove criterion</button></fieldset>)}
      <p>Total weight: {criteria.reduce((sum, item) => sum + item.weight, 0)}%</p><button type="button" disabled={criteria.length >= 8} onClick={() => setCriteria([...criteria, { id: `criterion-${crypto.randomUUID().slice(0,8)}`, title: "New criterion", description: "Describe the evidence required for this criterion.", weight: 10, maximum: 4 }])}>Add criterion</button><button disabled={busy || criteria.reduce((sum, item) => sum + item.weight, 0) !== 100}>Save rubric</button>
    </form>)}
  </>}{notice && <p role="status">{notice}</p>}{error && <p role="alert">{error}</p>}</details>;
}

export function RubricGrading({ assignmentId, submissionId, onSaved }: { assignmentId: string; submissionId: string; onSaved: () => void }) {
  const { profile } = useSession();
  const resource = useResource<Rubric>(`/api/v1/faculty/assignments/${assignmentId}/rubric`);
  const [ratings, setRatings] = useState<Record<string, number>>({}), [score, setScore] = useState(0), [feedback, setFeedback] = useState(""), [error, setError] = useState(""), [busy, setBusy] = useState(false);
  const criteria = resource.data?.definition?.criteria;
  return <section className="content-card"><h3>Review submission</h3><ResourceState {...resource} />{resource.data && <form onSubmit={async event => { event.preventDefault(); if (!profile?.authenticated) return; setBusy(true); setError(""); try { await api(`/api/v1/faculty/submissions/${submissionId}${criteria ? "/rubric-grade" : ""}`, { method: "PUT", body: JSON.stringify(criteria ? { ratings, feedback } : { score, feedback }) }, profile.csrf_token); onSaved(); } catch (cause) { setError(cause instanceof Error ? cause.message : "Grading failed"); } finally { setBusy(false); } }}>
    {criteria ? criteria.map(item => <label key={item.id}>{item.title} ({item.weight}%; maximum {item.maximum})<small>{item.description}</small><input type="number" required min={0} max={item.maximum} step={.25} value={ratings[item.id] ?? ""} onChange={event => setRatings({ ...ratings, [item.id]: Number(event.target.value) })} /></label>) : <label>Score (0 to 100)<input type="number" min={0} max={100} required value={score} onChange={event => setScore(Number(event.target.value))} /></label>}
    <label>Private instructor feedback<textarea maxLength={5000} value={feedback} onChange={event => setFeedback(event.target.value)} /></label><button disabled={busy}>Save assessment</button></form>}{error && <p role="alert">{error}</p>}</section>;
}
