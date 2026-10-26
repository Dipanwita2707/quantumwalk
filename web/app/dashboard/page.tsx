"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { api, useSession } from "@/lib/api";
import { milestones } from "@/lib/milestones";
import { nextSkillNode } from "@/lib/skillTree";
import { SkillTreePanel } from "@/components/SkillTreePanel";
import { DashboardBloch } from "@/components/DashboardBloch";
import { CircuitAtmosphere } from "@/components/CircuitAtmosphere";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { guestIntroductionProgress } from "@/lib/guestDiscovery";
import { LEARN_UNITS, unitCompletion } from "@/lib/learnUnits";
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
  const [guestIntro, setGuestIntro] = useState<{ explored: number; score: number; done: boolean } | null>(null);

  const load = useCallback(async () => {
    if (profile?.authenticated) {
      const requests = [
        api<SavedCircuit[]>("/api/circuits").then((data) => setCircuits({ data, error: "" })).catch(() => setCircuits((old) => ({ ...old, error: "Saved circuits could not be loaded." }))),
        api<ProgressItem[]>("/api/progress").then((data) => setProgress({ data, error: "" })).catch(() => setProgress((old) => ({ ...old, error: "Progress could not be loaded." }))),
        api<Lesson[]>("/api/lessons").then((data) => setLessons({ data, error: "" })).catch(() => setLessons((old) => ({ ...old, error: "Lessons could not be loaded." }))),
        api<Challenge[]>("/api/challenges").then((data) => setChallenges({ data, error: "" })).catch(() => setChallenges((old) => ({ ...old, error: "Challenges could not be loaded." }))),
      ];
      await Promise.all(requests);
      return;
    }
    setCircuits({ data: [], error: "" });
    setProgress({ data: [], error: "" });
    await Promise.all([
      api<Lesson[]>("/api/lessons").then((data) => setLessons({ data, error: "" })).catch(() => setLessons((old) => ({ ...old, error: "Lessons could not be loaded." }))),
      api<Challenge[]>("/api/challenges").then((data) => setChallenges({ data, error: "" })).catch(() => setChallenges((old) => ({ ...old, error: "Challenges could not be loaded." }))),
    ]);
  }, [profile?.authenticated, profile?.authenticated ? profile.id : null]);

  useEffect(() => {
    setCircuits({ data: null, error: "" });
    setProgress({ data: null, error: "" });
    setLessons({ data: null, error: "" });
    setChallenges({ data: null, error: "" });
    void load();
  }, [load]);

  useEffect(() => {
    if (profile?.authenticated) return;
    setGuestIntro(guestIntroductionProgress());
    const onStorage = () => setGuestIntro(guestIntroductionProgress());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [profile?.authenticated]);

  const completed = useMemo(() => new Set(progress.data?.filter((item) => item.completed).map((item) => item.activity_slug) ?? []), [progress.data]);
  const lessonCount = lessons.data?.filter((item) => completed.has(`lesson:${item.slug}`)).length ?? 0;
  const totalLessons = lessons.data?.length ?? 0;
  const xp = progress.data
    ? progress.data.reduce((sum, item) => sum + (item.completed ? 100 : Math.min(100, item.score)), 0)
    : null;
  const level = xp === null ? null : Math.floor(xp / 500) + 1;
  const nextLesson = lessons.data?.find((item) => !completed.has(`lesson:${item.slug}`));
  const nextChallenge = challenges.data?.find((item) => !completed.has(`challenge:${item.slug}`));
  const recent = circuits.data?.slice().sort((a, b) => Date.parse(b.updated_at) - Date.parse(a.updated_at)).slice(0, 3);
  const earnedMilestones = milestones.filter((item) => completed.has(item.activity)).length;
  const nextMilestone = milestones.find((item) => !completed.has(item.activity));
  const skillNext = progress.data ? nextSkillNode(completed) : undefined;
  const introRow = progress.data?.find((item) => item.activity_slug === "discovery:introduction");
  const introScore = profile?.authenticated ? (introRow?.score ?? 0) : (guestIntro?.score ?? 0);
  const introDone = profile?.authenticated ? (introRow?.completed ?? false) : (guestIntro?.done ?? false);
  const introExplored = profile?.authenticated ? Math.min(4, Math.round(introScore / 25)) : (guestIntro?.explored ?? 0);
  const displayName = profile?.authenticated ? profile.display_name : "Explorer";
  const isGuest = !profile?.authenticated;
  const unitRails = useMemo(
    () => LEARN_UNITS.map((unit) => ({ unit, stats: unitCompletion(unit, completed) })),
    [completed]
  );

  function status(error: string, pending: boolean) {
    return error ? <p className="db-error" role="alert">{error} <button type="button" onClick={() => void load()}>Retry</button></p>
      : pending ? <p className="db-muted" role="status">Loading…</p> : null;
  }

  const continueHref = nextLesson
    ? `/learn/${encodeURIComponent(nextLesson.slug)}`
    : lessons.data && lessons.data.length > 0
      ? "/challenges"
      : "/learn";
  const continueTitle = nextLesson?.title ?? (lessons.data?.length ? "All lessons complete" : "Learning trail");
  const continueBlurb = nextLesson?.objective ?? "Pick up where you left off or start a new experiment in the Lab.";

  return (
    <div className={`app-shell db-shell db-shell-v2 ${motionPaused ? "db-motion-paused" : ""}`}>
      <CircuitAtmosphere paused={motionPaused} />
      <SiteHeader />
      <main className="db-home">
        <header className="db-home-header">
          <div>
            <span className="db-connection-dot" />
            <span>HOME</span>
          </div>
          <button type="button" className="db-motion-control" aria-pressed={motionPaused} onClick={() => setMotionPaused((v) => !v)}>
            {motionPaused ? "▷ Resume ambient motion" : "Ⅱ Pause ambient motion"}
          </button>
        </header>

        {isGuest && <GuestExperienceBanner context="dashboard" />}

        <section className="db-continue-primary" aria-labelledby="dashboard-title">
          <div className="db-continue-copy">
            <p className="db-greeting">
              Welcome back, <strong>{displayName}</strong>
            </p>
            <h1 id="dashboard-title">Your dashboard</h1>
            <h2 className="db-continue-lesson">{continueTitle}</h2>
            <p>{continueBlurb}</p>
            {status(lessons.error || progress.error, !lessons.data || (!isGuest && !progress.data))}
            <div className="db-hero-actions">
              <Link href={continueHref} className="db-action db-action-primary">
                Continue learning →
              </Link>
              <Link href="/workspace?mode=circuit" className="db-text-link">
                Open lab ↗
              </Link>
            </div>
          </div>
          <DashboardBloch paused={motionPaused} />
        </section>

        <section className="db-overview db-overview-compact" aria-label="Learning overview">
          <div>
            <span className="db-stat-icon" aria-hidden="true">✧</span>
            <div>
              <span>Learning XP</span>
              <strong>{isGuest ? "—" : xp === null ? "—" : xp}</strong>
              <small>{isGuest ? "Sign in to record XP" : xp === null || level === null ? "Progress unavailable" : `Level ${level}`}</small>
            </div>
          </div>
          <div>
            <span className="db-stat-icon" aria-hidden="true">◎</span>
            <div>
              <span>Lessons</span>
              <strong>{!lessons.data ? "—" : isGuest ? `${totalLessons}` : !progress.data ? "—" : `${lessonCount}/${totalLessons}`}</strong>
              <small>{isGuest ? "Preview · sign in to save" : "Completed"}</small>
            </div>
          </div>
          <div>
            <span className="db-stat-icon" aria-hidden="true">⌘</span>
            <div>
              <span>Circuits</span>
              <strong>{isGuest ? "0" : (circuits.data?.length ?? "—")}</strong>
              <small>{isGuest ? "Sign in to save" : "Saved"}</small>
            </div>
          </div>
        </section>

        <div className="db-home-grid db-home-grid-v2">
          <section className="db-card" aria-label="Recent experiments">
            <div className="db-card-heading">
              <div>
                <span className="db-eyebrow">RECENT</span>
                <h2>Recent experiments</h2>
              </div>
              {profile?.authenticated && (
                <Link href="/circuits" className="db-text-link">
                  View all →
                </Link>
              )}
            </div>
            {status(circuits.error, !circuits.data)}
            {isGuest && <p className="db-muted">Sign in to save circuits from the Lab.</p>}
            {recent?.length === 0 && profile?.authenticated && <p>No saved circuits yet.</p>}
            {recent?.map((item) => (
              <Link key={item.id} className="db-list-link" href={`/workspace?mode=circuit&circuit=${encodeURIComponent(item.id)}`}>
                <span>
                  <strong>{item.name}</strong>
                  <small>{item.qubits} qubits · {item.operations.length} gates</small>
                </span>
                <span>Open →</span>
              </Link>
            ))}
            <Link className="db-text-link" href="/explorer">
              Try an explorer demo →
            </Link>
          </section>

          <section className="db-card db-recommendations" aria-label="Recommendations">
            <span className="db-eyebrow">RECOMMENDED</span>
            <h2>Keep exploring</h2>
            {status(challenges.error || progress.error, !challenges.data || (!isGuest && !progress.data))}
            {challenges.data && nextChallenge && (
              <>
                <p className="db-muted">Challenge: {nextChallenge.title}</p>
                <Link className="db-action db-action-secondary" href={`/challenges/${encodeURIComponent(nextChallenge.slug)}`}>
                  Try challenge →
                </Link>
              </>
            )}
            <ul className="db-rec-list">
              <li><Link href="/learn">Learning trail →</Link></li>
              <li><Link href="/algorithms">Algorithm library →</Link></li>
              <li><Link href="/coach">Ask the Coach →</Link></li>
            </ul>
          </section>
        </div>

        {(profile?.authenticated ? progress.data : true) && (
          <section className="db-card db-intro-progress" aria-label="Discovery introduction">
            <span className="db-eyebrow">DISCOVERY INTRODUCTION</span>
            <h2>{introDone ? "Introduction complete" : "Finish your /start journey"}</h2>
            <p>
              {introDone
                ? profile?.authenticated
                  ? "Your /start exploration was saved to this account."
                  : "You finished /start on this device. Sign in to sync introduction XP."
                : `Complete the five-step intro on /start (${introExplored}/4 activities explored) for up to 100 XP.`}
            </p>
            <progress value={introScore} max={100} aria-label="Introduction progress score" />
            <small>{introScore}/100 XP from introduction{isGuest && !introDone ? " · stored locally until sign-in" : ""}</small>
            {!introDone && (
              <Link className="db-action db-action-secondary" href="/start">
                Continue introduction →
              </Link>
            )}
          </section>
        )}

        <details className="db-progress-details" open>
          <summary>Progress details & skill path</summary>
          {lessons.data && (
            <section className="db-card db-unit-rail" aria-label="Academy units">
              <span className="db-eyebrow">ACADEMY UNITS</span>
              <h2>Foundations · Algorithms · Noise · Hardware</h2>
              <p className="db-muted">Same unit rail as /learn — completion syncs when you sign in.</p>
              <ul className="db-unit-list">
                {unitRails.map(({ unit, stats }) => (
                  <li key={unit.id}>
                    <div className="db-unit-head">
                      <strong>{unit.title}</strong>
                      <span>{stats.total > 0 ? `${stats.pct}% · ${stats.done}/${stats.total}` : "Explore"}</span>
                    </div>
                    {stats.total > 0 && <progress value={stats.done} max={Math.max(1, stats.total)} aria-label={`${unit.title} completion`} />}
                  </li>
                ))}
              </ul>
              <Link className="db-text-link" href="/learn">
                Open learning trail →
              </Link>
            </section>
          )}

          <section className="db-card db-path">
            <span className="db-eyebrow">SKILL PATH</span>
            <h2>{skillNext ? skillNext.title : "Foundations"}</h2>
            {skillNext && <p>{skillNext.plain}</p>}
            {skillNext && (
              <Link className="db-action" href={skillNext.href}>
                Go →
              </Link>
            )}
            {progress.data && <SkillTreePanel completedActivities={completed} />}
            {lessons.data && progress.data && (
              <>
                <p>{lessonCount} of {totalLessons} lessons complete</p>
                <progress value={lessonCount} max={Math.max(1, totalLessons)} aria-label="Foundations lessons completed" />
                <ol>
                  {lessons.data.slice(0, 6).map((item) => (
                    <li key={item.slug}>
                      <span aria-hidden="true">{completed.has(`lesson:${item.slug}`) ? "✓" : "○"}</span>
                      <Link href={`/learn/${encodeURIComponent(item.slug)}`}>{item.title}</Link>
                    </li>
                  ))}
                </ol>
              </>
            )}
          </section>
        </details>

        {progress.data && (
          <section className="db-milestone" aria-label="Learning milestones">
            <span aria-hidden="true">✦</span>
            <div>
              <strong>{earnedMilestones} of {milestones.length} milestones earned</strong>
              <p>{nextMilestone ? `Next: ${nextMilestone.title} — ${nextMilestone.description}` : "Every available milestone is complete."}</p>
            </div>
            <Link href="/achievements">View achievements →</Link>
          </section>
        )}
      </main>
    </div>
  );
}
