"use client";
import { getApiBase } from "@/lib/api";
import { useResource } from "@/components/useResource";
import { ResourceState } from "@/components/ProductPage";
export function ClassAnalytics({ classId }: { classId: string }) {
  const resource = useResource<Record<string, number | null>>(`/api/v1/faculty/classes/${classId}/analytics`);
  return <section className="content-card"><h2>Class progress</h2><ResourceState {...resource} /><dl className="science-metrics">{resource.data && Object.entries(resource.data).map(([key, value]) => <div key={key}><dt>{key.replaceAll("_", " ")}</dt><dd>{value ?? "No grades yet"}</dd></div>)}</dl><a className="card-action" href={`${getApiBase()}/api/v1/faculty/classes/${classId}/analytics/export`}>Export aggregate CSV</a></section>;
}
