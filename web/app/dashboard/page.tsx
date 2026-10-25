"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { api, useSession } from "@/lib/api";
import { milestones } from "@/lib/milestones";
import { DashboardBloch } from "@/components/DashboardBloch";
import { CircuitAtmosphere } from "@/components/CircuitAtmosphere";
import "./dashboard.css";

type SavedCircuit = { id: string; name: string; qubits: number; operations: unknown[]; updated_at: string };
type ProgressItem = { activity_slug: string; completed: boolean; score: number };
type Lesson = { slug: string; title: string; objective: string; minutes: number; algorithm_slug: string };
type Challenge = { slug: string; title: string; summary: string };
type Loadable<T> = { data: T | null; error: string };

export default function DashboardPage() {
  const { profile } = useSession();
  const [motionPaused, setMotionPaused] = useState(false);
  const [circuits, setCircuits] = useState<Loadable<SavedCircuit[]>>({ data: null, error: "" });
  const [progress, setProgress] = useState<Loadable<ProgressItem[]>>({ data: null, error: "" });
  const [lessons, setLessons] = useState<Loadable<Lesson[]>>({ data: null, error: "" });
  const [challenges, setChallenges] = useState<Loadable<Challenge[]>>({ data: null, error: "" });

  const load = useCallback(async () => {
    if (!profile?.authenticated) return;
    const requests = [
      api<SavedCircuit[]>("/api/circuits").then((data) => setCircuits({ data, error: "" })).catch(() => setCircuits((old) => ({ ...old, error: "Saved circuits could not be loaded." }))),
      api<ProgressItem[]>("/api/progress").then((data) => setProgress({ data, error: "" })).catch(() => setProgress((old) => ({ ...old, error: "Progress could not be loaded." }))),
      api<Lesson[]>("/api/lessons").then((data) => setLessons({ data, error: "" })).catch(() => setLessons((old) => ({ ...old, error: "Lessons could not be loaded." }))),
      api<Challenge[]>("/api/challenges").then((data) => setChallenges({ data, error: "" })).catch(() => setChallenges((old) => ({ ...old, error: "Challenges could not be loaded." }))),
    ];
    await Promise.all(requests);
  }, [profile?.authenticated, profile?.authenticated ? profile.id : null]);

  useEffect(() => {
    setCircuits({ data: null, error: "" });
    setProgress({ data: null, error: "" });
    setLessons({ data: null, error: "" });
    setChallenges({ data: null, error: "" });
    void load();
  }, [load]);

  const completed = useMemo(() => new Set(progress.data?.filter((item) => item.completed).map((item) => item.activity_slug) ?? []), [progress.data]);
  const lessonCount = lessons.data?.filter((item) => completed.has(`lesson:${item.slug}`)).length ?? 0;
  const totalLessons = lessons.data?.length ?? 0;
  const xp = progress.data ? completed.size * 100 : null;
  const level = xp === null ? null : Math.floor(xp / 500) + 1;
  const nextLesson = lessons.data?.find((item) => !completed.has(`lesson:${item.slug}`));
  const nextChallenge = challenges.data?.find((item) => !completed.has(`challenge:${item.slug}`));
  const recent = circuits.data?.slice().sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)).slice(0, 3);
  const earnedMilestones = milestones.filter((item) => completed.has(item.activity)).length;
  const nextMilestone = milestones.find((item) => !completed.has(item.activity));
  const displayName = profile?.authenticated ? profile.display_name : "Explorer";

  function status(error: string, pending: boolean) {
    return error ? <p className="db-error" role="alert">{error} <button type="button" onClick={() => void load()}>Retry</button></p>
      : pending ? <p className="db-muted" role="status">Loading…</p> : null;
  }

  return <div className={`app-shell db-shell ${motionPaused ? "db-motion-paused" : ""}`}><CircuitAtmosphere paused={motionPaused} /><SiteHeader /><main className="db-home">
    <header className="db-home-header">
      <div><span className="db-connection-dot" /><span>PERSONAL QUANTUM LAB</span><span className="db-header-divider">/</span><span>Your dashboard</span></div>
      <button type="button" className="db-motion-control" aria-pressed={motionPaused} onClick={() => setMotionPaused((value) => !value)}>{motionPaused ? "▷ Resume ambient motion" : "Ⅱ Pause ambient motion"}</button>
    </header>

    <section className="db-hero" aria-labelledby="dashboard-title"><div className="db-hero-copy"><p className="db-greeting">Welcome back, <strong>{displayName}</strong><span aria-hidden="true">✦</span></p><h1 id="dashboard-title">Your next discovery<br /><span>starts here.</span></h1><p>A little curiosity. A new connection. Pick up your learning journey or turn a fresh idea into a quantum experiment.</p><div className="db-hero-actions"><Link href="/workspace?mode=circuit" className="db-action">Enter your Lab <span aria-hidden="true">↗</span></Link><Link href="/algorithms" className="db-text-link">Explore the possibilities ↗</Link></div><div className="db-hero-note"><span aria-hidden="true">◇</span><div>Your space to think differently.<small>Private circuits. Real simulations. Your pace.</small></div></div></div><DashboardBloch paused={motionPaused} /></section>

    <section className="db-overview" aria-label="Learning overview">
      <div><span className="db-stat-icon" aria-hidden="true">✧</span><div><span>Learning XP</span><strong>{xp === null ? "—" : xp}</strong><small>{xp === null || level === null ? "Progress unavailable" : `Level ${level} · ${xp % 500} of 500 XP to next level`}</small></div></div>
      <div><span className="db-stat-icon" aria-hidden="true">◎</span><div><span>Lessons complete</span><strong>{!lessons.data || !progress.data ? "—" : `${lessonCount}/${totalLessons}`}</strong><small>{!lessons.data || !progress.data ? "Track unavailable" : "Foundations track"}</small></div></div>
      <div><span className="db-stat-icon" aria-hidden="true">⌘</span><div><span>Saved circuits</span><strong>{circuits.data?.length ?? "—"}</strong><small>Private to your account</small></div></div>
    </section>

    <div className="db-section-intro"><div><span className="db-eyebrow">KEEP THE MOMENTUM</span><h2>One idea leads to another.</h2></div><Link href="/learn" className="db-text-link">Your learning trail ↗</Link></div>

    <div className="db-home-grid">
      <section className="db-card db-mission">
        <span className="db-eyebrow">YOUR NEXT MISSION</span>
        {status(lessons.error || progress.error, !lessons.data || !progress.data)}
        {lessons.data && progress.data && (lessons.data.length === 0 ? <><h2>Lessons are unavailable</h2><p>There are no learning missions to show right now. You can still experiment in the Lab.</p><Link className="db-action" href="/workspace?mode=circuit">Open Lab →</Link></> : nextLesson ? <>
          <h2>{nextLesson.title}</h2><p>{nextLesson.objective}</p>
          {nextLesson.algorithm_slug === "superposition" ? <div className="db-circuit-preview" aria-label="Example: a Hadamard gate creates equal ideal measurement probabilities"><span>|0⟩</span><i /><strong>H</strong><i /><span>50% |0⟩ · 50% |1⟩</span></div>
            : nextLesson.algorithm_slug === "bell-pair" ? <div className="db-circuit-preview" aria-label="Bell pair example: H on qubit zero, then controlled X, gives equal ideal 00 and 11 outcomes"><span>|00⟩</span><i /><strong>H₀</strong><i /><strong>CX₀₁</strong><i /><span>50% |00⟩ · 50% |11⟩</span></div>
              : <p className="db-muted">Step through the example circuit in this mission.</p>}
          <p className="db-muted">About {nextLesson.minutes} minutes · Experiment, predict, and explain.</p>
          <Link href={`/learn/${encodeURIComponent(nextLesson.slug)}`} className="db-action">Continue mission →</Link>
        </> : <><h2>Foundations complete</h2><p>You have completed every available lesson. Try a challenge or create your own circuit.</p><Link className="db-action" href="/challenges">Explore challenges →</Link></>)}
      </section>

      <section className="db-card db-path">
        <span className="db-eyebrow">YOUR LEARNING PATH</span><h2>Foundations</h2>
        {lessons.data && progress.data ? <><p>{lessonCount} of {totalLessons} lessons complete</p><progress value={lessonCount} max={Math.max(1, totalLessons)} aria-label="Foundations lessons completed" />
          <ol>{lessons.data.slice(0, 4).map((item) => <li key={item.slug}><span aria-hidden="true">{completed.has(`lesson:${item.slug}`) ? "✓" : "○"}</span><Link href={`/learn/${encodeURIComponent(item.slug)}`}>{item.title}</Link></li>)}</ol>
          <Link className="db-text-link" href="/learn">View full path →</Link></> : status(lessons.error || progress.error, true)}
      </section>

      <section className="db-card"><div className="db-card-heading"><div><span className="db-eyebrow">YOUR WORK</span><h2>Saved circuits</h2></div><Link href="/circuits" className="db-text-link">View all →</Link></div>
        {status(circuits.error, !circuits.data)}
        {recent?.length === 0 && <p>No circuits yet. Start in the Lab and save your first experiment.</p>}
        {recent?.map((item) => <Link key={item.id} className="db-list-link" href={`/workspace?mode=circuit&circuit=${encodeURIComponent(item.id)}`}><span><strong>{item.name}</strong><small>{item.qubits} qubits · {item.operations.length} gates</small></span><span>Open →</span></Link>)}
        <Link className="db-text-link" href="/workspace?mode=circuit">Create a circuit →</Link>
      </section>

      <section className="db-card"><span className="db-eyebrow">NEXT CHALLENGE</span>
        {status(challenges.error || progress.error, !challenges.data || !progress.data)}
        {challenges.data && progress.data && (challenges.data.length === 0 ? <><h2>No challenges available</h2><p>Explore an algorithm while new challenges are prepared.</p><Link className="db-text-link" href="/algorithms">Explore library →</Link></> : nextChallenge ? <><h2>{nextChallenge.title}</h2><p>{nextChallenge.summary}</p><Link className="db-action db-action-secondary" href={`/challenges/${encodeURIComponent(nextChallenge.slug)}`}>Try challenge →</Link></> : <><h2>All challenges complete</h2><p>Explore an algorithm or experiment freely in the Lab.</p><Link className="db-text-link" href="/algorithms">Explore library →</Link></>)}
      </section>
    </div>
    {progress.data && <section className="db-milestone" aria-label="Learning milestones"><span aria-hidden="true">✦</span><div><strong>{earnedMilestones} of {milestones.length} milestones earned</strong><p>{nextMilestone ? `Next: ${nextMilestone.title} — ${nextMilestone.description}` : "Every available milestone is complete."}</p></div><Link href="/achievements">View achievements →</Link></section>}
    <section className="db-footer-links" aria-label="More ways to explore"><Link href="/algorithms">Explore algorithms →</Link><Link href="/coach">Ask the Coach →</Link><Link href="/workspace?mode=whiteboard">Open Whiteboard →</Link></section>
  </main></div>;
}
