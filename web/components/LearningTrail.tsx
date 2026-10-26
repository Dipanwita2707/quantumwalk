"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { api, useSession } from "@/lib/api";
import { DiscoveryCoach } from "@/components/DiscoveryCoach";
import { CircuitViewer, type Operation } from "@/components/CircuitViewer";
import { labPresetHref } from "@/lib/lessonPresets";
import { LearnPathSidebar } from "@/components/LearnPathSidebar";
import { AcademyUnitOverview } from "@/components/AcademyUnitOverview";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { LearnLoadingSkeleton } from "@/components/LearnLoadingSkeleton";
import { LearnDiscoveryLanes } from "@/components/LearnDiscoveryLanes";
import { LearnModuleIndex } from "@/components/LearnModuleIndex";
import { loadGuestLessonProgress, recordGuestLessonAttempt } from "@/lib/guestLessonProgress";
import "@/app/learn/learn.css";

type Lesson = {
  slug: string;
  title: string;
  level: string;
  minutes: number;
  objective: string;
  prerequisites?: string;
  prerequisite_slugs?: string[];
  steps: string[];
  algorithm_slug: string;
  question: string;
  choices: string[];
};
type Answer = { correct: boolean; score: number; saved: boolean };
type Progress = { activity_slug: string; completed: boolean; score: number };

const LESSON_CIRCUITS: Record<string, { qubits: number; operations: Operation[] }> = {
  superposition: {
    qubits: 1,
    operations: [{ gate: "h", target: 0 }],
  },
  "bell-pair": {
    qubits: 2,
    operations: [
      { gate: "h", target: 0 },
      { gate: "cx", control: 0, target: 1 },
    ],
  },
  "teleportation-demo": {
    qubits: 3,
    operations: [
      { gate: "h", target: 0 },
      { gate: "h", target: 1 },
      { gate: "cx", control: 1, target: 2 },
      { gate: "cx", control: 0, target: 1 },
      { gate: "cz", control: 0, target: 2 },
    ],
  },
  "deutsch-jozsa-balanced": {
    qubits: 2,
    operations: [
      { gate: "x", target: 1 },
      { gate: "h", target: 0 },
      { gate: "h", target: 1 },
      { gate: "cx", control: 0, target: 1 },
      { gate: "h", target: 0 },
    ],
  },
  "grover-two": {
    qubits: 2,
    operations: [
      { gate: "h", target: 0 },
      { gate: "h", target: 1 },
      { gate: "cz", control: 0, target: 1 },
      { gate: "h", target: 0 },
      { gate: "h", target: 1 },
      { gate: "x", target: 0 },
      { gate: "x", target: 1 },
      { gate: "cz", control: 0, target: 1 },
      { gate: "x", target: 0 },
      { gate: "x", target: 1 },
      { gate: "h", target: 0 },
      { gate: "h", target: 1 },
    ],
  },
};

export function LearningTrail({ lessonSlug }: { lessonSlug?: string }) {
  const { profile, loading: accountLoading } = useSession();
  const [items, setItems] = useState<Lesson[] | null>(null);
  const [catalog, setCatalog] = useState<Lesson[]>([]);
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>(() => {
    const guest = loadGuestLessonProgress();
    return guest.completed;
  });
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const lessons = await api<Lesson[]>("/api/lessons");
      setCatalog(lessons);
      const progress =
        profile?.authenticated ? await api<Progress[]>("/api/progress") : ([] as Progress[]);
      const guest = loadGuestLessonProgress();
      const selected = lessonSlug ? lessons.filter((lesson) => lesson.slug === lessonSlug) : lessons;
      if (lessonSlug && selected.length === 0)
        throw new Error("Lesson not found. Choose a mission from the learning trail.");
      setItems(selected);
      const serverCompleted = Object.fromEntries(
        progress.filter((entry) => entry.completed).map((entry) => [entry.activity_slug, true]),
      );
      setCompleted(profile?.authenticated ? serverCompleted : { ...guest.completed, ...serverCompleted });
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load lessons.");
    }
  }

  useEffect(() => {
    void load();
  }, [lessonSlug, profile?.authenticated]);

  async function answer(slug: string, choice: number) {
    setBusy(slug);
    setError("");
    try {
      const result = await api<Answer>(
        `/api/lessons/${slug}/answer`,
        { method: "POST", body: JSON.stringify({ choice }) },
        profile?.authenticated ? profile.csrf_token : undefined
      );
      setAnswers((current) => ({ ...current, [slug]: result }));
      if (result.correct && result.saved) {
        setCompleted((current) => ({ ...current, [`lesson:${slug}`]: true }));
      } else if (result.correct && !result.saved) {
        const guest = recordGuestLessonAttempt(slug, true);
        setCompleted((current) => ({ ...current, ...guest.completed }));
      } else if (!result.saved) {
        recordGuestLessonAttempt(slug, false);
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not check answer.");
    } finally {
      setBusy("");
    }
  }

  const finished = items?.filter((item) => completed[`lesson:${item.slug}`]).length ?? 0;

  const lessonNav = (() => {
    if (!lessonSlug || catalog.length === 0) return null;
    const order = catalog.map((l) => l.slug);
    const index = order.indexOf(lessonSlug);
    if (index < 0) return null;
    return {
      prev: index > 0 ? order[index - 1] : null,
      next: index < order.length - 1 ? order[index + 1] : null,
    };
  })();

  return (
    <>
      <SiteHeader />
      <main className={`content-shell learn-trail-layout${lessonSlug ? "" : " learn-trail-index"}`}>
        <LearnPathSidebar activeSlug={lessonSlug} />
        <div className="learn-trail-main">
        <GuestExperienceBanner context="learn" />
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
          <Link className="card-action" style={{ margin: 0 }} href={lessonSlug ? "/learn" : "/coach"}>
            {lessonSlug ? "← Back to Learning Trail" : "Ask AI Coach →"}
          </Link>
          {lessonSlug && (
            <span style={{ fontSize: "12px", color: "var(--muted)", fontFamily: "monospace" }}>
              INTERACTIVE LESSON LAB
            </span>
          )}
        </div>

        <p className="eyebrow">QUANTUM ACADEMY</p>
        <h1>{lessonSlug ? items?.[0]?.title ?? "Learning Mission" : "Quantum Academy"}</h1>
        {lessonNav && (
          <nav className="learn-lesson-nav" aria-label="Lesson navigation">
            {lessonNav.prev ? (
              <Link className="card-action" href={`/learn/${lessonNav.prev}`}>
                ← Previous lesson
              </Link>
            ) : (
              <span />
            )}
            {lessonNav.next ? (
              <Link className="card-action" href={`/learn/${lessonNav.next}`}>
                Next lesson →
              </Link>
            ) : null}
          </nav>
        )}
        <p className="content-intro">
          Structured path: Foundations → algorithms → noise → hardware concepts. Each mission embeds the simulator;
          cheat sheets and lab anchors live in{" "}
          <Link href="/learn/reference">Reference</Link>.
        </p>

        {!lessonSlug && <AcademyUnitOverview />}
        {!lessonSlug && <LearnDiscoveryLanes />}
        {!lessonSlug && <LearnModuleIndex />}

        {items && items.length > 0 && !lessonSlug && (
          <section className="learning-scoreboard" aria-label="Saved learning progress">
            <div>
              <span className="panel-kicker">RECORDED MASTERY</span>
              <h2>
                {items.length > 0 && finished === items.length
                  ? "Foundations Trail Mastered ✦"
                  : finished
                  ? "Your Next Discovery Awaits"
                  : "Begin Your Quantum Journey"}
              </h2>
              <p>
                {finished} of {items.length} missions completed · {finished * 100} learning XP
              </p>
            </div>
            <progress value={finished} max={Math.max(1, items.length)} aria-label="Completed learning missions" />
            <span className="learning-badge">
              {items.length > 0 && finished === items.length ? "✦ Quantum Architect" : "◇ Quantum Explorer"}
            </span>
          </section>
        )}

        {error && (
          <div className="content-error" role="alert">
            {error} <button onClick={() => void load()}>Retry lessons</button>
          </div>
        )}

        {!items && !error && <LearnLoadingSkeleton />}

        {items && items.length === 0 && !error && (
          <section className="learn-empty-state content-card" aria-labelledby="learn-empty-title">
            <span className="panel-kicker">ACADEMY</span>
            <h2 id="learn-empty-title">Lessons are temporarily unavailable</h2>
            <p>
              The lesson catalog could not be loaded. You can still explore algorithms, run demo presets in the lab, or
              retry when the API is back.
            </p>
            <div className="learn-empty-actions">
              <Link className="card-action" href="/explorer">
                Open explorers →
              </Link>
              <Link className="card-action" href="/workspace?preset=bell">
                Demo lab preset →
              </Link>
              <button type="button" className="card-action" onClick={() => void load()}>
                Retry lessons
              </button>
            </div>
          </section>
        )}

        {items && items.length > 0 && (() => {
          const missionList = (
          <div className="learning-list">
            {items.map((item, index) => {
              const lessonCircuit =
                LESSON_CIRCUITS[item.algorithm_slug] || { qubits: 1, operations: [{ gate: "h", target: 0 }] };

              return (
                <article
                  className={`content-card lesson-card ${completed[`lesson:${item.slug}`] ? "mission-complete" : ""}`}
                  key={item.slug}
                >
                  <span className="panel-kicker">
                    MISSION {index + 1} · {item.minutes} MIN · {item.level.toUpperCase()}
                  </span>
                  {completed[`lesson:${item.slug}`] && (
                    <span className="mission-status" style={{ float: "right", color: "var(--cyan)", fontWeight: 700 }}>
                      ✓ Completed · 100 XP
                    </span>
                  )}

                  <h2>
                    {lessonSlug ? (
                      item.title
                    ) : (
                      <Link href={`/learn/${encodeURIComponent(item.slug)}`}>{item.title}</Link>
                    )}
                  </h2>

                  <p>{item.objective}</p>
                  {item.prerequisites && (
                    <p className="explorer-note" data-testid={`lesson-prereq-${item.slug}`}>
                      <strong>Prerequisites:</strong> {item.prerequisites}
                      {item.prerequisite_slugs && item.prerequisite_slugs.length > 0 && (
                        <>
                          {" "}
                          {item.prerequisite_slugs.map((pre, i) => (
                            <span key={pre}>
                              {i > 0 ? ", " : ""}
                              <Link href={`/learn/${pre}`} data-testid={`lesson-prereq-link-${item.slug}-${pre}`}>
                                {pre.replace(/-/g, " ")}
                              </Link>
                            </span>
                          ))}
                        </>
                      )}
                    </p>
                  )}

                  <ol>
                    {item.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>

                  {/* EMBEDDED CIRCUIT SIMULATOR FOR ACTIVE LESSON */}
                  {lessonSlug ? (
                    <div style={{ marginTop: "24px", marginBottom: "24px" }}>
                      <CircuitViewer
                        initialQubits={lessonCircuit.qubits}
                        initialOperations={lessonCircuit.operations}
                        readonly={true}
                        demoPreset={
                          item.algorithm_slug === "bell-pair"
                            ? "bell"
                            : item.algorithm_slug === "superposition"
                              ? "superposition"
                              : item.algorithm_slug === "grover-two"
                                ? "grover2"
                                : item.slug === "tsp-classical"
                                  ? "tsp3"
                                  : item.slug === "pedagogy-noise"
                                    ? "bell"
                                    : undefined
                        }
                        title={`Live Demonstration: ${item.title}`}
                        subtitle="Step through the circuit to see quantum amplitudes split or entangle in real time."
                        fullLabHref={labPresetHref(item.algorithm_slug)}
                      />
                    </div>
                  ) : (
                    <>
                      <Link className="card-action" href={`/learn/${encodeURIComponent(item.slug)}`}>
                        Explore this Lesson & Simulator →
                      </Link>
                      <Link className="card-action" href={labPresetHref(item.algorithm_slug)} style={{ marginLeft: "12px" }}>
                        Open preset in Lab →
                      </Link>
                    </>
                  )}

                  {/* INTERACTIVE COMPREHENSION QUIZ */}
                  {!profile?.authenticated && (
                    <p className="question-invitation" role="status">
                      Guest mode: quizzes work here; scores save on this device only. Sign in to sync XP across sessions.
                    </p>
                  )}
                  <fieldset
                    disabled={accountLoading || busy !== "" || completed[`lesson:${item.slug}`]}
                    style={{ marginTop: "20px" }}
                    data-testid={`lesson-quiz-${item.slug}`}
                  >
                    <legend style={{ color: "var(--cyan)", fontWeight: 700 }}>{item.question}</legend>
                    {item.choices.map((choice, choiceIndex) => (
                      <button
                        type="button"
                        key={choice}
                        aria-label={`Answer: ${choice}`}
                        onClick={() => void answer(item.slug, choiceIndex)}
                        style={{ margin: "6px 8px 6px 0" }}
                      >
                        {choice}
                      </button>
                    ))}
                  </fieldset>

                  {answers[item.slug] && (
                    <p
                      className={answers[item.slug].correct ? "success-note" : "question-invitation"}
                      role="status"
                      style={{ marginTop: "14px" }}
                    >
                      {answers[item.slug].correct
                        ? answers[item.slug].saved
                          ? "Mission accomplished! Your comprehension score and 100 XP are saved."
                          : "Correct! Progress stored on this device — sign in to sync XP."
                        : "Not quite. Check the live probabilities and state amplitudes in the simulator above, then try again."}
                    </p>
                  )}

                  <div style={{ marginTop: "20px" }}>
                    <DiscoveryCoach topic={item.algorithm_slug === "bell-pair" ? "bell" : "superposition"} level="beginner" />
                  </div>
                </article>
              );
            })}
          </div>
          );
          if (lessonSlug) return missionList;
          return (
            <details className="learn-mission-catalog">
              <summary>All missions — expanded cards &amp; quizzes</summary>
              {missionList}
            </details>
          );
        })()}
        </div>
      </main>
    </>
  );
}
