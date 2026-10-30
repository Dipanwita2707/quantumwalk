"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { api, useSession } from "@/lib/api";
import { DiscoveryCoach } from "@/components/DiscoveryCoach";
import { CircuitViewer, type Operation } from "@/components/CircuitViewer";
import { FirstQubitExperiment } from "@/components/FirstQubitExperiment";
import { labPresetHref, LESSON_CIRCUITS } from "@/lib/lessonPresets";
import { LearnPathSidebar } from "@/components/LearnPathSidebar";
import { LessonHistory } from "@/components/LessonPublishing";
import { AcademyUnitOverview } from "@/components/AcademyUnitOverview";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { LearnLoadingSkeleton } from "@/components/LearnLoadingSkeleton";
import { LearnDiscoveryLanes } from "@/components/LearnDiscoveryLanes";
import { LearnModuleIndex } from "@/components/LearnModuleIndex";
import { loadGuestLessonProgress, recordGuestLessonAttempt } from "@/lib/guestLessonProgress";
import "@/app/learn/learn.css";

type Lesson = {
  content_version?: string;
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

const LESSON_EXPERIMENTS: Record<string, { title: string; description: string; href: string }> = {
  "tsp-classical": { title: "Compare tours in the TSP Explorer", description: "Edit actual route costs, then compare classical tour costs with the Grover sampler.", href: "/explorer/tsp" },
  "qft-intro": { title: "Explore the Quantum Fourier Transform", description: "Set complex input amplitudes, normalize, and compare the Fourier output with its inverse.", href: "/academy/labs/qft" },
  "shor-intro": { title: "Factor 15 in the Shor lab", description: "Inspect period finding, the gate circuit, and sampled results in the educational factoring experiment.", href: "/academy/labs/shor" },
  "qec-bit-flip": { title: "Detect and correct a bit flip", description: "Inject an error, read the syndrome, and apply the correction in the three-qubit experiment.", href: "/academy/labs/qec" },
  "quantum-reservoir": { title: "Run the reservoir experiment", description: "Compare the educational reservoir response across input sequences and reruns.", href: "/academy/labs/reservoir" },
  "pedagogy-noise": { title: "Compare ideal and noisy readout", description: "In the Bell Lab, open Engine, noise, and comparison, enable pedagogical noise, execute, then inspect Measurement sampling.", href: "/workspace?mode=circuit&preset=bell" },
  "vqe-intro": { title: "VQE concept and supporting circuit exercise", description: "This lesson introduces the hybrid optimization loop. A complete VQE optimizer is not implemented here; explore entanglement in the supporting Bell circuit.", href: "/workspace?mode=circuit&preset=bell" },
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
      const version = lessonSlug ? new URLSearchParams(window.location.search).get("version") : null;
      const selected = lessonSlug && version ? [await api<Lesson>(`/api/lessons/${encodeURIComponent(lessonSlug)}?version=${encodeURIComponent(version)}`)] : lessonSlug ? lessons.filter((lesson) => lesson.slug === lessonSlug) : lessons;
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
        { method: "POST", body: JSON.stringify({ choice, content_version: items?.find(item => item.slug === slug)?.content_version }) },
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
      <main className={`content-shell learn-trail-layout${lessonSlug ? " learn-lesson-page" : " learn-trail-index"}`}>
        {lessonSlug && <LearnPathSidebar activeSlug={lessonSlug} />}
        <div className="learn-trail-main">
        <GuestExperienceBanner context="learn" />
        {lessonSlug && (
          <div className="learn-trail-toolbar">
            <Link className="card-action" href="/learn">
              ← Back to trail
            </Link>
            {lessonNav && <nav className="learn-lesson-nav" aria-label="Lesson navigation">
              {lessonNav.prev && <Link className="card-action" href={`/learn/${lessonNav.prev}`}>← Previous lesson</Link>}
              {lessonNav.next && <Link className="card-action" href={`/learn/${lessonNav.next}`}>Next lesson →</Link>}
            </nav>}
          </div>
        )}

        {!lessonSlug && <p className="eyebrow">LEARN</p>}
        <h1>{lessonSlug ? items?.[0]?.title ?? "Learning Mission" : "Learning trail"}</h1>
        {lessonSlug && <LessonHistory key={lessonSlug} slug={lessonSlug} />}
        {lessonSlug && items?.[0] && <p className="learn-lesson-objective">{items[0].objective}</p>}
        {!lessonSlug && (
          <p className="content-intro learn-trail-lede">
            Missions with embedded simulators.{" "}
            <Link href="/learn/reference">Glossary</Link>
            {" · "}
            <Link href="/coach">Coach</Link>
          </p>
        )}

        {!lessonSlug && <AcademyUnitOverview completed={new Set(Object.keys(completed).filter(key => completed[key]))} progressReady={items !== null && !error} />}

        {!lessonSlug && items && items.length > 0 && (
          <p className="learn-progress-line" role="status">
            {finished} of {items.length} missions complete
            {finished > 0 ? ` · ${finished * 100} XP on this device` : ""}
          </p>
        )}

        {!lessonSlug && (
          <details className="learn-more-panel">
            <summary>More paths &amp; module index</summary>
            <LearnDiscoveryLanes />
            <LearnModuleIndex />
          </details>
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
              const lessonCircuit = LESSON_CIRCUITS[item.slug === "math-amplitudes" ? "phase-interference" : item.algorithm_slug];
              const experiment = LESSON_EXPERIMENTS[item.slug];
              return (
                <article
                  className={`content-card lesson-card ${lessonSlug ? "lesson-detail " : ""}${completed[`lesson:${item.slug}`] ? "mission-complete" : ""}`}
                  key={item.slug}
                >
                  <span className="panel-kicker">
                    {lessonSlug ? "GUIDED LESSON" : `MISSION ${index + 1}`} · {item.minutes} MIN · {item.level.toUpperCase()}
                  </span>
                  {completed[`lesson:${item.slug}`] && (
                    <span className="mission-status" style={{ float: "right", color: "var(--cyan)", fontWeight: 700 }}>
                      ✓ Completed · 100 XP
                    </span>
                  )}

                  {!lessonSlug && <><h2><Link href={`/learn/${encodeURIComponent(item.slug)}`}>{item.title}</Link></h2><p>{item.objective}</p></>}
                  {lessonSlug && <nav className="lesson-stage-nav" aria-label="Lesson stages"><a href="#lesson-explanation"><span>01</span> Understand</a><a href="#lesson-experiment"><span>02</span> Experiment</a><a href="#lesson-check"><span>03</span> Check understanding</a></nav>}
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

                  <div className={lessonSlug ? "lesson-workbench" : undefined}>
                  {lessonSlug && <section id="lesson-explanation" className="lesson-understand" aria-label="Understand the idea"><h2 className="lesson-section-heading"><span>01</span> Understand the idea</h2>
                  {lessonSlug === "first-qubit" ? <section className="first-qubit-brief" aria-label="Experimental method">
                    <p className="first-qubit-purpose">Your task: distinguish a predictable prepared state from a superposition, then verify that quantum gates can reverse the preparation.</p>
                    <ol><li><span>01</span><div><strong>Prepare the input</strong><p>Start each trial in |0⟩. This is the reference state, not an empty qubit.</p></div></li><li><span>02</span><div><strong>Apply a controlled change</strong><p>Compare no gate, H, and H followed by H. Change the sequence while keeping the readout basis fixed.</p></div></li><li><span>03</span><div><strong>Repeat and interpret</strong><p>A readout returns one bit. Many fresh preparations reveal the outcome distribution.</p></div></li></ol>
                  </section> : <ol className="lesson-explanation-steps">
                    {item.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>}
                  </section>}
                  {!lessonSlug && <ol className="lesson-explanation-steps">{item.steps.map(step => <li key={step}>{step}</li>)}</ol>}

                  <div className={lessonSlug ? "lesson-experiment-pane" : undefined}>
                  {/* EMBEDDED CIRCUIT SIMULATOR FOR ACTIVE LESSON */}
                  {lessonSlug && <h2 className="lesson-section-heading lesson-experiment-heading"><span>02</span> Try the experiment</h2>}
                  {lessonSlug === "first-qubit" ? <FirstQubitExperiment /> : lessonSlug && experiment ? (
                    <section id="lesson-experiment" className="lesson-dedicated-experiment"><span className="panel-kicker">02 / EXPERIMENT</span><h3>{experiment.title}</h3><p>{experiment.description}</p><Link className="card-action" href={experiment.href}>Open experiment →</Link></section>
                  ) : lessonSlug && lessonCircuit ? (
                    <div id="lesson-experiment" style={{ marginTop: "24px", marginBottom: "24px" }}>
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
                        title="Circuit experiment"
                        subtitle={item.slug === "quantum-teleportation" ? "Deferred-measurement demonstration: coherent corrections transfer the prepared |+⟩ state to q2. Step through each gate." : item.slug === "math-amplitudes" ? "H → Z → H: Z changes relative phase while probabilities stay 50/50. The final H reveals that phase through interference." : "Follow each gate, compare amplitudes and relative phase, then use the quiz to check what changed."}
                        fullLabHref={labPresetHref(item.algorithm_slug, item.slug)}
                      />
                    </div>
                  ) : (
                    <>
                      <Link className="card-action" href={`/learn/${encodeURIComponent(item.slug)}`}>
                        Explore this Lesson & Simulator →
                      </Link>
                      <Link className="card-action" href={labPresetHref(item.algorithm_slug, item.slug)} style={{ marginLeft: "12px" }}>
                        Open preset in Lab →
                      </Link>
                    </>
                  )}

                  </div>
                  </div>
                  {/* INTERACTIVE COMPREHENSION QUIZ */}
                  <section className={lessonSlug ? "lesson-check-block" : undefined} aria-label="Check understanding">
                  {lessonSlug && <h2 className="lesson-section-heading"><span>03</span> Check understanding</h2>}
                  {!profile?.authenticated && (
                    <p className="question-invitation" role="status">
                      Guest mode: quizzes work here; scores save on this device only. Sign in to sync XP across sessions.
                    </p>
                  )}
                  <fieldset
                    id={lessonSlug ? "lesson-check" : undefined}
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

                  </section>
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
              <summary>
                All missions — cards &amp; quizzes ({finished}/{items.length} done)
              </summary>
              {missionList}
            </details>
          );
        })()}
        </div>
      </main>
    </>
  );
}
