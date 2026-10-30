"use client";
import { useState } from "react";
import { useResource } from "@/components/useResource";
import { ResourceState } from "@/components/ProductPage";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
type Operations = { runs: Record<string, number>; usage_today: Record<string, number>; subscriptions: Record<string, number>; verified_payment_events: number; providers: Record<string, boolean>; runtime: { mode: string; durable_queue: boolean }; incidents: { id: string; kind: string; model: string; code: string; status: number; created_at: string }[]; limitations: string };
export function OperationsConsole() {
  const [period, setPeriod] = useState("day");
  const resource = useResource<Operations>(`/api/v1/admin/operations?period=${period}`);
  return <section className="content-card"><h2>Operations</h2><SegmentedControl label="Operations period" value={period} onChange={setPeriod} items={[{ value: "day", label: "Last 24 hours" }, { value: "week", label: "Last 7 days" }]} /><ResourceState {...resource} />{resource.data && <>
    <p>Execution mode: {resource.data.runtime.mode}. Durable queue: {resource.data.runtime.durable_queue ? "enabled" : "not configured"}.</p>
    <div className="science-compare"><div><h3>Scientific executions</h3>{Object.entries(resource.data.runs).map(([status, count]) => <p key={status}>{status}: {count}</p>)}{!Object.keys(resource.data.runs).length && <p>No saved executions in this period.</p>}<h3>Usage today (UTC)</h3>{Object.entries(resource.data.usage_today).map(([feature, used]) => <p key={feature}>{feature}: {used}</p>)}</div><div><h3>Subscriptions</h3>{Object.entries(resource.data.subscriptions).map(([status, count]) => <p key={status}>{status}: {count}</p>)}<p>Verified provider events: {resource.data.verified_payment_events}</p><h3>Configuration presence</h3>{Object.entries(resource.data.providers).map(([name, ready]) => <p key={name}>{name.replaceAll("_", " ")}: {ready ? "present" : "absent"}</p>)}</div></div>
    <h3>Recorded incidents</h3>{resource.data.incidents.length === 0 && <p>No recorded incidents in this period.</p>}{resource.data.incidents.map(event => <article key={event.id}><strong>{event.kind} / {event.code}</strong><p>{event.model} / HTTP {event.status} / {new Date(event.created_at).toLocaleString()}</p></article>)}<p className="science-muted">{resource.data.limitations}</p>
  </>}</section>;
}
