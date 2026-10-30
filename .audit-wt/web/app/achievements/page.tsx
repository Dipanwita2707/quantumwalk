"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { api, useSession } from "@/lib/api";
import { milestones } from "@/lib/milestones";

type Progress = { activity_slug: string; completed: boolean };

export default function AchievementsPage() {
  const { profile } = useSession();
  const [progress, setProgress] = useState<Progress[] | null>(null);
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    if (!profile?.authenticated) return;
    try { setProgress(await api<Progress[]>("/api/progress")); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not load your milestones."); }
  }, [profile?.authenticated, profile?.authenticated ? profile.id : null]);
  useEffect(() => { setProgress(null); setError(""); void load(); }, [load]);
  const completed = new Set(progress?.filter((item) => item.completed).map((item) => item.activity_slug) ?? []);
  const earned = milestones.filter((item) => completed.has(item.activity)).length;

  return <><SiteHeader /><main className="content-shell">
    <p className="eyebrow">YOUR LEARNING MILESTONES</p><h1>Achievements</h1>
    <p className="content-intro">Each milestone comes from a lesson or challenge you completed. Keep exploring at your own pace.</p>
    {error && <div className="content-error" role="alert">{error} <button type="button" onClick={() => void load()}>Retry</button></div>}
    {!progress && !error && <p role="status">Loading milestones…</p>}
    {progress && <><p role="status">{earned} of {milestones.length} milestones earned</p><div className="content-cards">
      {milestones.map((item) => <article key={item.id} className={`content-card ${completed.has(item.activity) ? "achievement-earned" : ""}`}>
        <span className="panel-kicker">{completed.has(item.activity) ? "✦ EARNED" : "UP NEXT"}</span>
        <h2>{item.title}</h2><p>{item.description}</p>
        {!completed.has(item.activity) && <Link className="card-action" href={item.href}>Start activity →</Link>}
      </article>)}
    </div></>}
  </main></>;
}
