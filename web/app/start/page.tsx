"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DiscoveryVisual, type DiscoveryScene } from "@/components/DiscoveryVisual";
import { DiscoveryCoach } from "@/components/DiscoveryCoach";
import { StartExperienceMotion } from "@/components/start/StartExperienceMotion";
import { StartHeroStage } from "@/components/start/StartHeroStage";
import { PathPickerSection } from "@/components/start/PathPickerSection";
import { useSiteAtmosphere } from "@/lib/site-atmosphere";
import "./experience.css";
import { useSession } from "@/lib/api";
import { discoveryTracks, type Experience } from "@/lib/onboarding";

const slideNames = ["Your level", "First discovery", "Go a little deeper", "Try one question", "One more discovery"];
const scenes: Record<Experience, [DiscoveryScene, DiscoveryScene, DiscoveryScene, DiscoveryScene]> = {
  beginner: ["superposition", "measurement", "superposition", "measurement"],
  intermediate: ["interference", "bell", "bell", "mixed"],
  advanced: ["grover", "kickback", "grover", "kickback"],
};

export default function StartPage() {
  const router = useRouter();
  const { profile } = useSession();
  const [level, setLevel] = useState<Experience>("beginner");
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<[number | null, number | null]>([null, null]);
  const [explored, setExplored] = useState<[boolean, boolean]>([false, false]);
  const { paused: atmospherePaused, togglePaused: toggleAtmosphere, setIntensityBoost } = useSiteAtmosphere();
  const heading = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);
  const track = discoveryTracks[level];
  const article = step === 1 || step === 2 ? track.articles[step - 1] : null;
  const questionIndex = step - 3;
  const question = step >= 3 ? track.questions[questionIndex] : null;
  const answer = step >= 3 ? answers[questionIndex] : null;
  const scene = step > 0 ? scenes[level][step - 1] : "superposition";
  const discoveries = explored.filter(Boolean).length + answers.filter((value) => value !== null).length;
  const labels = ["Choose your path", "Another small discovery →", "Let’s try a question →", "One more question →", profile?.authenticated ? "Open my private lab →" : "Continue to Google sign-in →"];
  const starterDestination = `/workspace?mode=circuit&algorithm=${track.starter}&level=${level}`;
  const skipDestination = step === 0 ? (profile?.authenticated ? "/dashboard" : "/login") : profile?.authenticated ? starterDestination : `/login?level=${level}&return_to=${encodeURIComponent(starterDestination)}`;

  useEffect(() => {
    setIntensityBoost(step === 0 ? "hero" : "none");
    return () => setIntensityBoost("none");
  }, [step, setIntensityBoost]);

  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return; }
    if (step > 0) heading.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [step]);

  useEffect(() => {
    if (step === 1 || step === 2) setExplored((current) => step === 1 ? [true, current[1]] : [current[0], true]);
  }, [step]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      document.querySelectorAll(".discovery-main .start-reveal").forEach((node) => node.classList.add("start-is-visible"));
    });
    return () => cancelAnimationFrame(frame);
  }, [step, level]);

  function selectLevel(value: Experience) {
    setLevel(value);
    setAnswers([null, null]);
    setExplored([false, false]);
    setStep(1);
  }

  function next() {
    if (step < 4) { setStep(step + 1); return; }
    router.push(profile?.authenticated ? starterDestination : `/login?level=${level}&return_to=${encodeURIComponent(starterDestination)}`);
  }

  return <div className={`discovery-shell qw-page-shell ${atmospherePaused ? "atmosphere-paused" : ""}`}>
    <StartExperienceMotion />
    <header className="discovery-header"><Link className="brand" href="/"><span className="brand-mark">◇</span><span><strong>QuantumWalk</strong><small>See inside a quantum algorithm.</small></span></Link><span className="journey-header-label">THE DISCOVERY EXPERIENCE</span><div className="journey-header-actions"><button className="atmosphere-control" type="button" aria-pressed={atmospherePaused} onClick={toggleAtmosphere}>{atmospherePaused ? "Resume atmosphere" : "Pause atmosphere"}</button><Link href={skipDestination} className="discovery-signin"><span>{profile?.authenticated ? step > 0 ? "Skip to Lab →" : "Open dashboard →" : "Skip to sign in →"}</span></Link></div></header>
    <main className="discovery-main">
      <div className="discovery-progress start-progress-pulse" key={`progress-${step}`}><span>{String(step + 1).padStart(2, "0")} / 05</span><progress value={step + 1} max={5} aria-label="Introduction progress" /><span>{step === 0 ? "ABOUT 2 MINUTES" : `${track.label.toUpperCase()} PATH`}</span></div>
      <div className="discovery-steps start-reveal" aria-label="Introduction steps">{slideNames.map((name, index) => <span key={name} aria-current={index === step ? "step" : undefined} className={`${index < step ? "visited" : ""} ${index === step ? "step-current" : ""}`}>{index < step ? "✓ " : ""}{name}</span>)}</div>
      {step > 0 && <div className="discovery-mission start-reveal start-reveal-delay-1"><div><span className="panel-kicker">YOUR FIRST MISSION</span><strong>{level === "beginner" ? "Make a qubit unpredictable, then measure it." : level === "intermediate" ? "Connect phase, interference, and shared states." : "Trace how an algorithm changes amplitudes."}</strong></div><span className="discovery-xp" aria-label={`${discoveries} of 4 introduction activities explored`}>✦ {discoveries} / 4 explored</span><button type="button" onClick={() => setStep(0)}>Change level</button></div>}
      <section key={`${level}-${step}`} className={`discovery-slide ${step === 0 ? "discovery-choice" : ""}`} aria-labelledby={step === 0 ? "discovery-hero-title" : "discovery-step-heading"}>
        {step === 0 ? <><div className="journey-hero"><div className="journey-hero-copy start-reveal"><span className="landing-eyebrow qw-eyebrow"><span className="journey-beacon" /> CURIOSITY IS YOUR ONLY PREREQUISITE</span><h1 id="discovery-hero-title" className="qw-heading-gradient">A new dimension<br />of <span>possibility.</span></h1><p className="discovery-intro">Step into the quantum world. Change a state, make a prediction, and see an idea come alive.</p><div className="journey-promises"><span>↳ Hands-on from the first step</span><span>✦ Your AI guide, when you need it</span></div></div><div className="journey-portal-wrap start-reveal start-reveal-delay-2"><StartHeroStage /></div></div><PathPickerSection onSelect={selectLevel} paused={atmospherePaused} /></> : <div className="discovery-split"><div className="discovery-content start-reveal">
          <span className="landing-eyebrow">{article?.category || `A LITTLE CURIOSITY CHECK · QUESTION ${questionIndex + 1} OF 2`}</span>
          <h1 id="discovery-step-heading" ref={heading} tabIndex={-1} className="discovery-step-title">{article?.title || question?.prompt}</h1>
          <a className="experiment-jump" href="#discovery-experiment">Try the hands-on experiment ↓</a>
          {article ? <><div className="discovery-reading">{article.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div><div className="discovery-takeaway"><span>✦ KEEP THIS IDEA</span><p>{article.takeaway}</p></div></> : question && <><p className="question-invitation">Try the experiment beside this question first. Your prediction earns 10 exploration points, whether or not it is correct.</p><fieldset className="discovery-options"><legend className="sr-only">Choose an answer</legend>{question.options.map((option, index) => <button type="button" key={option} aria-pressed={answer === index} disabled={answer !== null} className={answer === index ? "selected-answer" : ""} onClick={() => setAnswers((current) => questionIndex === 0 ? [index, current[1]] : [current[0], index])}><span>{String.fromCharCode(65 + index)}</span>{option}{answer === index && <span aria-label="Selected">✓</span>}</button>)}</fieldset>{answer !== null && <div className="discovery-feedback" role="status"><strong>{answer === question.answer ? "You’ve got it. +10 exploration XP" : "Prediction made. +10 exploration XP"}</strong><p>{question.explanation}</p><span>{answer === question.answer ? "You can explain this idea now." : "Use the experiment to compare your guess with what happens. You can keep going."}</span></div>}</>}
          <details className="discovery-glossary"><summary>New words? Here’s the plain-language version.</summary><dl>{track.terms.map(([term, meaning]) => <div key={term}><dt>{term}</dt><dd>{meaning}</dd></div>)}</dl></details>
          {step === 4 && answer !== null && <div className="discovery-reward" role="status"><span aria-hidden="true">✦</span><div><strong>Introduction complete</strong><p>You explored two ideas and made two predictions. {profile?.authenticated ? "Next, open your private lab to run your own circuit." : "Next, sign in to run your own circuit and save your learning progress."}</p><small>This public introduction is a preview; saved learning progress begins after sign-in.</small></div></div>}
          <div className="discovery-navigation"><button className="discovery-back" onClick={() => setStep(step - 1)}>← Back</button><button className="primary-action" disabled={step >= 3 && answer === null} onClick={next}>{labels[step]}</button></div>
          <DiscoveryCoach key={`${level}-${step}-coach`} topic={scene} level={level} />
        </div><aside id="discovery-experiment" className="discovery-visual start-reveal start-reveal-delay-2" aria-label="Quantum concept illustration"><div className="experiment-window-bar"><span><i /> CONCEPT EXPLORER</span><span>0{step} / {track.label.toUpperCase()}</span></div><div className="experiment-stage-grid" aria-hidden="true" /><div className="experiment-stage-glow" aria-hidden="true" /><DiscoveryVisual key={`${level}-${step}`} scene={scene} /><div className="discovery-visual-caption"><span>{track.icon}</span><p>Press a button to change the experiment. Watch the result, then explain it in your own words.</p></div></aside></div>}
      </section>
    </main>
    <footer className="discovery-footer start-reveal"><span>Curiosity first. Your private workspace next.</span><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></div></footer>
  </div>;
}
