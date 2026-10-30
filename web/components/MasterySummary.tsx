"use client";
import { useResource } from "@/components/useResource";
import { ScienceIcon } from "@/components/ui/QuantumUI";
export function MasterySummary({ compact = false }: { compact?: boolean }) {
  const resource = useResource<{ xp: number; level: number; streak_days: number; streak_basis: string }>("/api/v1/me/progress");
  if (!resource.data) return resource.error ? <p className="science-muted">Mastery summary unavailable. <button onClick={resource.reload}>Retry</button></p> : <p role="status">Loading confirmed mastery…</p>;
  if (compact) return <aside className="q-ui-mastery-badge" aria-label="Confirmed scientific progress"><ScienceIcon name="trophy" size={30} /><div><strong>Level {resource.data.level}</strong><span>{resource.data.xp} learning XP</span><small>{resource.data.streak_days} day mastery streak</small></div></aside>;
  return <aside className="mastery-summary" aria-label="Confirmed scientific progress"><div><span>Learning XP</span><strong>{resource.data.xp}</strong></div><div><span>Explorer level</span><strong>{resource.data.level}</strong></div><div title={resource.data.streak_basis}><span>Mastery streak · UTC days</span><strong>{resource.data.streak_days}</strong></div></aside>;
}
