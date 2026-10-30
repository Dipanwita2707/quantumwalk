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
import { ReferenceRail } from "@/components/ui/ReferenceRail";
import { ExplorerProfile } from "@/components/ui/ExplorerProfile";
import { ModuleLinks } from "@/components/ui/ModuleLinks";
import { ActionLink, MetricTile, ScienceIcon } from "@/components/ui/QuantumUI";
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
  const firstLesson = lessons.data?.[0];
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
    [completed],
  );

  function status(error: string, pending: boolean) {
    return error ? (
      <p className="db-error" role="alert">
        {error}{" "}
        <button type="button" onClick={() => void load()}>
          Retry
        </button>
      </p>
    ) : pending ? (
      <p className="db-muted" role="status">
        Loading…
      </p>
    ) : null;
  }

  const continueHref = nextLesson
    ? `/learn/${encodeURIComponent(nextLesson.slug)}`
    : lessons.data && lessons.data.length > 0 && lessonCount >= totalLessons && totalLessons > 0
      ? "/challenges"
      : firstLesson
        ? `/learn/${encodeURIComponent(firstLesson.slug)}`
        : "/learn";

  const continueTitle = nextLesson
    ? nextLesson.title
    : lessons.data && totalLessons > 0 && lessonCount >= totalLessons
      ? "All lessons complete"
      : firstLesson
        ? firstLesson.title
        : "Start the learning trail";

  const continueBlurb = nextLesson
    ? nextLesson.objective
    : lessons.data && totalLessons > 0 && lessonCount >= totalLessons
      ? "Try a challenge or revisit any mission in the lab."
      : firstLesson
        ? firstLesson.objective
        : "Open the trail when the lesson catalog is available.";

  const showRecent = Boolean(profile?.authenticated && recent && recent.length > 0);
  const showIntroPanel = !introDone || introScore > 0;
  const loadError = lessons.error || (!isGuest ? progress.error : "");
  const loadPending = !lessons.data || (!isGuest && !progress.data);

  const progressSummaryLine = isGuest
    ? lessons.data
      ? `${totalLessons} lessons available · progress saves when you sign in`
      : null
    : progress.data && lessons.data
      ? `${lessonCount}/${totalLessons} lessons · ${xp ?? 0} XP${level !== null ? ` · Level ${level}` : ""}`
      : null;

  return (
    <div className={`app-shell db-shell db-shell-v2 ${motionPaused ? "db-motion-paused" : ""}`}>
      <CircuitAtmosphere paused={motionPaused} />
      <SiteHeader />
      <div className="db-reference-frame">
      <ReferenceRail name={displayName} level={isGuest ? null : level} />
      <main className="db-home">


        {isGuest && <GuestExperienceBanner context="dashboard" />}

        <div className="db-dashboard-grid">
          <div className="db-main-column">
        <header className="db-reference-welcome"><h1>{isGuest ? "Welcome to your quantum journey" : `Welcome back, ${displayName}!`}</h1><p>Keep exploring. The quantum universe awaits.</p></header>
        <section className="db-reference-metrics" aria-label="Progress summary">
          <MetricTile label="Learning XP" value={isGuest ? "—" : xp ?? "—"} icon={<ScienceIcon name="trophy" />} />
          <MetricTile label="Lessons" value={!lessons.data || (!isGuest && !progress.data) ? "—" : isGuest ? totalLessons : `${lessonCount}/${totalLessons}`} icon={<ScienceIcon name="book" />} />
          <MetricTile label="Saved circuits" value={isGuest ? "—" : circuits.data?.length ?? "—"} icon={<ScienceIcon name="circuit" />} />
          <MetricTile label="Milestones" value={isGuest || !progress.data ? "—" : earnedMilestones} icon={<ScienceIcon name="spark" />} />
        </section>
        <section className="db-continue-primary" aria-labelledby="db-continue-heading">
          <div className="db-continue-copy">
            <p className="db-greeting">Continue learning</p>
            <h2 id="db-continue-heading">{continueTitle}</h2>
            <p className="db-continue-blurb">{continueBlurb}</p>
            {status(loadError, loadPending)}
            <div className="db-hero-actions">
              <ActionLink href={continueHref} className="db-action db-action-primary" data-testid="dashboard-continue">
                Continue learning →
              </ActionLink>
              <Link href="/workspace?mode=circuit" className="db-text-link">
                Open lab ↗
              </Link>
            </div>
          </div>
        </section>



        <ModuleLinks />

        {(!isGuest || nextChallenge || (isGuest && lessons.data)) && (
          <div className="db-home-grid db-home-grid-v2 db-secondary-row">
            {!isGuest && (
              <section className="db-card db-card-flat" aria-label="Recent experiments">
                <div className="db-card-heading">
                  <div>
                    <span className="db-eyebrow">RECENT</span>
                    <h2>Recent experiments</h2>
                  </div>
                  <Link href="/circuits" className="db-text-link">
                    View all →
                  </Link>
                </div>
                {status(circuits.error, !circuits.data)}
                {!circuits.error && circuits.data && !showRecent && (
                  <div className="db-saved-empty">
                    <p>Your next experiment starts with one gate.</p>
                    <p className="db-muted">Saved circuits will appear here so you can pick up where you left off.</p>
                    <Link className="db-text-link" href="/workspace?mode=circuit">Build your first circuit →</Link>
                  </div>
                )}
                {recent?.map((item) => (
                  <Link key={item.id} className="db-list-link" href={`/workspace?mode=circuit&circuit=${encodeURIComponent(item.id)}`}>
                    <span>
                      <strong>{item.name}</strong>
                      <small>
                        {item.qubits} qubits · {item.operations.length} gates
                      </small>
                    </span>
                    <span>Open →</span>
                  </Link>
                ))}
              </section>
            )}

            {nextChallenge && (
              <section className="db-card db-card-flat db-recommendations" aria-label="Recommended next step">
                <span className="db-eyebrow">NEXT UP</span>
                <h2>{nextChallenge.title}</h2>
                <p className="db-muted">{nextChallenge.summary}</p>
                {status(challenges.error || progress.error, !challenges.data || (!isGuest && !progress.data))}
                <Link className="db-action db-action-secondary" href={`/challenges/${encodeURIComponent(nextChallenge.slug)}`}>
                  Open challenge →
                </Link>
              </section>
            )}

            {!nextChallenge && isGuest && lessons.data && (
              <section className="db-card db-card-flat db-recommendations" aria-label="Recommended next step">
                <span className="db-eyebrow">TRY</span>
                <h2>Explorer demo</h2>
                <p className="db-muted">Compare classical and quantum stories in a bounded preset.</p>
                <Link className="db-action db-action-secondary" href="/explorer/tsp">
                  Three-city routes →
                </Link>
              </section>
            )}
          </div>
        )}

          </div>
          <div className="db-reference-aside"><ExplorerProfile level={level} xp={xp} guest={isGuest} /><div className="db-reference-utilities"><button type="button" className="db-motion-control" aria-pressed={motionPaused} onClick={() => setMotionPaused((v) => !v)}>
            {motionPaused ? "▷ Resume ambient motion" : "Ⅱ Pause ambient motion"}
          </button></div><details className="db-bloch-disclosure"><summary>Explore a qubit</summary><DashboardBloch paused={motionPaused} /></details></div>
        </div>

        {showIntroPanel && (
          <details className="db-discovery-details">
            <summary>Introduction progress</summary>
            <section className="db-card db-intro-progress db-card-flat" aria-label="Discovery introduction">
              <h2>{introDone ? "Introduction complete" : "Finish your /start journey"}</h2>
              <p className="db-muted">
                {introDone
                  ? profile?.authenticated
                    ? "Your /start exploration was saved to this account."
                    : "You finished /start on this device. Sign in to sync introduction XP."
                  : `Complete the five-step intro on /start (${introExplored}/4 activities explored) for up to 100 XP.`}
              </p>
              <progress value={introScore} max={100} aria-label="Introduction progress score" />
              <small>
                {introScore}/100 XP from introduction
                {isGuest && !introDone ? " · stored locally until sign-in" : ""}
              </small>
              {!introDone && (
                <Link className="db-action db-action-secondary" href="/start">
                  Continue introduction →
                </Link>
              )}
            </section>
          </details>
        )}

        <details className="db-progress-details">
          <summary>Units, skill tree &amp; milestones</summary>
          {progressSummaryLine && <p className="db-progress-line" role="status">{progressSummaryLine}</p>}
          {lessons.data && (
            <section className="db-card db-unit-rail db-card-flat" aria-label="Academy units">
              <span className="db-eyebrow">ACADEMY UNITS</span>
              <h2>Curriculum units</h2>
              <p className="db-muted">Same units as the learning trail — completion syncs when you sign in.</p>
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
                Full learning trail →
              </Link>
            </section>
          )}

          {progress.data && (
            <section className="db-card db-path db-card-flat">
              <span className="db-eyebrow">SKILL PATH</span>
              <h2>{skillNext ? skillNext.title : "Foundations"}</h2>
              {skillNext && <p className="db-muted">{skillNext.plain}</p>}
              {skillNext && (
                <Link className="db-action db-action-secondary" href={skillNext.href}>
                  Go to skill step →
                </Link>
              )}
              <SkillTreePanel completedActivities={completed} />
              {lessons.data && (
                <>
                  <p className="db-muted">
                    {lessonCount} of {totalLessons} lessons complete
                  </p>
                  <progress value={lessonCount} max={Math.max(1, totalLessons)} aria-label="Foundations lessons completed" />
                </>
              )}
            </section>
          )}

          {progress.data && (
            <section className="db-milestone db-milestone-inline" aria-label="Learning milestones">
              <span aria-hidden="true">
                ✦
              </span>
              <div>
                <strong>
                  {earnedMilestones} of {milestones.length} milestones earned
                </strong>
                <p className="db-muted">{nextMilestone ? `Next: ${nextMilestone.title}` : "Every available milestone is complete."}</p>
              </div>
              <Link href="/achievements">Achievements →</Link>
            </section>
          )}
        </details>
      </main>
      </div>
    </div>
  );
}
