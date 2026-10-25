"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { api, useSession } from "@/lib/api";
import { DiscoveryCoach } from "@/components/DiscoveryCoach";
import { CircuitViewer, type Operation } from "@/components/CircuitViewer";

type Lesson = {
  slug: string;
  title: string;
  level: string;
  minutes: number;
  objective: string;
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
  const [answers, setAnswers] = useState<Record<string, Answer>>({});
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      const [lessons, progress] = await Promise.all([
        api<Lesson[]>("/api/lessons"),
        api<Progress[]>("/api/progress"),
      ]);
      const selected = lessonSlug ? lessons.filter((lesson) => lesson.slug === lessonSlug) : lessons;
      if (lessonSlug && selected.length === 0)
        throw new Error("Lesson not found. Choose a mission from the learning trail.");
      setItems(selected);
      setCompleted(
        Object.fromEntries(progress.filter((entry) => entry.completed).map((entry) => [entry.activity_slug, true]))
      );
      setError("");
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load lessons.");
    }
  }

  useEffect(() => {
    void load();
  }, [lessonSlug]);

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
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not check answer.");
    } finally {
      setBusy("");
    }
  }

  const finished = items?.filter((item) => completed[`lesson:${item.slug}`]).length ?? 0;

  return (
    <>
      <SiteHeader />
      <main className="content-shell">
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

        <p className="eyebrow">FOUNDATIONS OF QUANTUM MECHANICS</p>
        <h1>{lessonSlug ? items?.[0]?.title ?? "Learning Mission" : "Quantum Learning Trail"}</h1>
        <p className="content-intro">
          Master quantum computing through guided micro-missions. Observe superposition, entanglement, and phase
          interference with live simulators embedded right inside each lesson.
        </p>

        {items && !lessonSlug && (
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

        {!items && !error && <p role="status">Loading interactive lessons…</p>}

        {items && (
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
                        title={`Live Demonstration: ${item.title}`}
                        subtitle="Step through the circuit to see quantum amplitudes split or entangle in real time."
                        fullLabHref={`/workspace?mode=circuit&algorithm=${encodeURIComponent(item.algorithm_slug)}`}
                      />
                    </div>
                  ) : (
                    <Link className="card-action" href={`/learn/${encodeURIComponent(item.slug)}`}>
                      Explore this Lesson & Simulator →
                    </Link>
                  )}

                  {/* INTERACTIVE COMPREHENSION QUIZ */}
                  <fieldset
                    disabled={accountLoading || busy !== "" || completed[`lesson:${item.slug}`]}
                    style={{ marginTop: "20px" }}
                  >
                    <legend style={{ color: "var(--cyan)", fontWeight: 700 }}>{item.question}</legend>
                    {item.choices.map((choice, choiceIndex) => (
                      <button
                        type="button"
                        key={choice}
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
                        ? "Mission accomplished! Your comprehension score and 100 XP are saved."
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
        )}
      </main>
    </>
  );
}
