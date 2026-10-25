"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useSiteAtmosphere } from "@/lib/site-atmosphere";
import { QuantumField, type FieldMode } from "@/components/QuantumField";
import { PrivateLabVisual } from "@/components/PrivateLabVisual";
import { LandingScrollEngine } from "@/components/landing/LandingScrollEngine";
import { useSession } from "@/lib/api";
import "./landing.css";

const concepts: { id: FieldMode; number: string; name: string; formula: string; title: string; description: string }[] = [
  { id: "superposition", number: "01", name: "Superposition", formula: "|ψ⟩ = α|0⟩ + β|1⟩", title: "More than one possibility.", description: "A qubit can have amplitudes for both 0 and 1. An experiment turns those possibilities into one measured outcome." },
  { id: "entanglement", number: "02", name: "Entanglement", formula: "|Φ⁺⟩ = (|00⟩ + |11⟩) / √2", title: "Two qubits. One shared state.", description: "Entangled qubits have correlations that belong to the pair. Explore why looking at just one qubit cannot tell the whole story." },
  { id: "interference", number: "03", name: "Interference", formula: "H|+⟩ = |0⟩", title: "Let possibilities reinforce.", description: "Quantum amplitudes can add or cancel. Learn how a change in phase can change what an algorithm reveals." },
];

export default function LandingPage() {
  const { profile } = useSession();
  const [mode, setMode] = useState<FieldMode>("superposition");
  const { paused, togglePaused, setIntensityBoost } = useSiteAtmosphere();
  useEffect(() => {
    setIntensityBoost("hero");
    return () => setIntensityBoost("none");
  }, [setIntensityBoost]);
  const [angle, setAngle] = useState(0);
  const [measurement, setMeasurement] = useState<number | null>(null);
  const [samples, setSamples] = useState(0);
  const concept = concepts.find((item) => item.id === mode)!;
  const probability = Math.sin(angle / 2) ** 2;
  const destination = profile?.authenticated ? "/workspace" : "/start";
  function changeAngle(value: number) { setAngle(value); setMeasurement(null); setSamples(0); }

  return <div className={`quantum-landing qw-page-shell ${paused ? "ql-motion-paused" : ""}`}>
    <LandingScrollEngine />
    <header className="ql-header">
      <Link className="ql-brand" href="/" aria-label="QuantumWalk home"><span className="ql-logo" aria-hidden="true">◈</span>QuantumWalk<span className="ql-brand-period">.</span></Link>
      <nav className="ql-nav" aria-label="Landing navigation">
        <a href="#landing-title" data-ql-nav="top">Overview</a>
        <a href="#experience" data-ql-nav="experience">The experience</a>
        <a href="#first-discovery" data-ql-nav="first-discovery">Try an experiment</a>
        <a href="#private-lab" data-ql-nav="private-lab">Your space</a>
      </nav>
      <Link className="ql-login" href={profile?.authenticated ? "/dashboard" : "/login"}>{profile?.authenticated ? "Dashboard" : "Sign in"}<span aria-hidden="true">↗</span></Link>
    </header>

    <main>
      <section className="ql-hero" aria-labelledby="landing-title">
        <div className="ql-hero-grid" aria-hidden="true" />
        <div className="ql-hero-copy">
          <p className="ql-eyebrow ql-reveal"><span className="ql-status-dot" /> A PLAYGROUND FOR THE QUANTUM CURIOUS</p>
          <h1 id="landing-title" className="ql-reveal ql-reveal-delay-1 qw-heading-gradient">Small qubits.<br />Extraordinary<br /><span>possibilities.</span></h1>
          <p className="ql-hero-description ql-reveal ql-reveal-delay-2">Step inside the science that changes how we think about computing. Build it. See it. Make it click.</p>
          <div className="ql-actions ql-reveal ql-reveal-delay-3"><Link className="ql-primary" href={destination}>{profile?.authenticated ? "Enter your quantum lab" : "Begin your discovery"}<span aria-hidden="true">↗</span></Link><a className="ql-text-link" href="#first-discovery"><span className="ql-play" aria-hidden="true">▷</span> Try a little quantum</a></div>
          <div className="ql-welcome ql-reveal ql-reveal-delay-4"><span className="ql-welcome-icon" aria-hidden="true">✳</span><p>No physics degree required.<br /><strong>Just bring your curiosity.</strong></p></div>
        </div>

        <div className="ql-universe" data-mode={mode}>
          <div className="ql-aura ql-aura-one" aria-hidden="true" /><div className="ql-aura ql-aura-two" aria-hidden="true" />
          <QuantumField mode={mode} paused={paused} />
          <div className="ql-scene-top"><span>QUANTUM FIELD / {concept.number}</span><span className="ql-scene-mark" aria-hidden="true">⌖</span></div>
          <div className="ql-core-label" aria-hidden="true"><span>{mode === "entanglement" ? "Φ" : mode === "interference" ? "∿" : "ψ"}</span><small>{mode === "entanglement" ? "CONNECTED STATES" : mode === "interference" ? "AMPLITUDES IN MOTION" : "A WORLD OF POSSIBILITY"}</small></div>
          <div className="ql-formula" key={mode}><span>THE IDEA, EXPRESSED</span><strong>{concept.formula}</strong></div>
          <div className="ql-scene-bottom"><span>CONCEPTUAL VISUALIZATION</span><button type="button" onClick={togglePaused} aria-pressed={paused} aria-label={paused ? "Resume ambient animation" : "Pause ambient animation"}>{paused ? "▷ Motion paused" : "Ⅱ Pause motion"}</button></div>
        </div>

        <div className="ql-concept-strip ql-reveal">
          <div className="ql-concept-label"><span className="ql-small-label">THREE IDEAS. A NEW PERSPECTIVE.</span><span>Choose a possibility <span aria-hidden="true">↘</span></span></div>
          <div className="ql-concept-buttons" role="group" aria-label="Explore quantum concepts">{concepts.map((item) => <button type="button" key={item.id} aria-pressed={item.id === mode} onClick={() => setMode(item.id)}><span>{item.number}</span>{item.name}<i aria-hidden="true">↗</i></button>)}</div>
          <div className="ql-concept-caption" aria-live="polite"><strong>{concept.title}</strong><p>{concept.description}</p></div>
        </div>
      </section>

      <section className="ql-experience" id="experience" aria-labelledby="experience-title">
        <div className="ql-section-heading ql-reveal"><p className="ql-eyebrow">FROM “WHAT IF?” TO “I GET IT.”</p><h2 id="experience-title">Don’t just read about it.<br /><span>Get your hands on it.</span></h2><p>Make one change. Watch what happens.<br />Understanding starts with a little exploration.</p></div>
        <div className="ql-path">
          <article className="ql-reveal ql-reveal-delay-1"><div className="ql-path-visual ql-circuit-art" aria-hidden="true"><span>|0⟩</span><i /><b>H</b><i /><b>⊕</b><i /><span>?</span><em /></div><span className="ql-small-label">01 / CREATE</span><h3>A circuit you can play with.</h3><p>Add a gate. Make a connection. Build real quantum circuits with guidance at every step.</p></article>
          <article className="ql-reveal ql-reveal-delay-2"><div className="ql-path-visual ql-wave-art" aria-hidden="true"><svg viewBox="0 0 300 100"><path d="M0 50 C25 -10 50 -10 75 50 S125 110 150 50 S200 -10 225 50 S275 110 300 50" /><path d="M0 50 C25 110 50 110 75 50 S125 -10 150 50 S200 110 225 50 S275 -10 300 50" /><line x1="0" y1="50" x2="300" y2="50" /></svg></div><span className="ql-small-label">02 / DISCOVER</span><h3>See the change behind the gate.</h3><p>Step through your circuit. Connect each operation to its state, probabilities and 3D Bloch view.</p></article>
          <article className="ql-reveal ql-reveal-delay-3"><div className="ql-path-visual ql-coach-art" aria-hidden="true"><span>✧</span><div>“Why did that happen?”<small>Let’s explore it together.</small></div></div><span className="ql-small-label">03 / CONNECT</span><h3>Stay curious. Get unstuck.</h3><p>Find another explanation with your coach, follow bite-sized lessons, and put your ideas to the test.</p></article>
        </div>
      </section>

      <section className="ql-experiment" id="first-discovery" aria-labelledby="experiment-title">
        <div className="ql-experiment-copy ql-reveal"><p className="ql-eyebrow">YOUR FIRST “OH, THAT’S QUANTUM.”</p><h2 id="experiment-title">One qubit.<br /><span>Your move.</span></h2><p>A regular bit gives you 0 or 1. A qubit’s state determines the probability of each outcome. Change the state and watch those probabilities move.</p><div className="ql-experiment-instruction"><span>↳</span><p>Try <strong>Create superposition</strong>.<br />Then sample a freshly prepared qubit.</p></div><p className="ql-preview-note">An ideal one-qubit preview, calculated locally. Full circuit simulations are inside your private lab.</p></div>
        <div className="ql-experiment-board ql-reveal ql-reveal-delay-2"><div className="ql-board-heading"><span className="ql-status-dot" /><span>LIVE CONCEPT EXPERIMENT</span><span>01 QUBIT</span></div>
          <div className="ql-state-path" aria-hidden="true"><span>|0⟩</span><i /><b>{angle === 0 ? "I" : angle === Math.PI / 2 ? "H" : angle === Math.PI ? "X" : "Rᵧ"}</b><i /><span>|ψ⟩</span></div>
          <div className="ql-presets"><button type="button" aria-pressed={angle === 0} onClick={() => changeAngle(0)}>Start at 0</button><button type="button" aria-pressed={angle === Math.PI / 2} onClick={() => changeAngle(Math.PI / 2)}>Create superposition</button><button type="button" aria-pressed={angle === Math.PI} onClick={() => changeAngle(Math.PI)}>Flip to 1</button></div>
          <label className="ql-slider">Rotate the state <span>{Math.round(angle / Math.PI * 180)}°</span><input aria-label="Rotate the qubit state" type="range" min="0" max={Math.PI} step="0.01" value={angle} onChange={(event) => changeAngle(Number(event.target.value))} /></label>
          <div className="ql-probabilities">{[1 - probability, probability].map((value, index) => <div key={index}><span>Outcome |{index}⟩</span><strong>{(value * 100).toFixed(0)}%</strong><div className="ql-probability-track"><i style={{ width: `${value * 100}%` }} /></div></div>)}</div>
          <div className="ql-sample-row"><button type="button" onClick={() => { setMeasurement(Math.random() < probability ? 1 : 0); setSamples((count) => count + 1); }}>Sample an outcome <span aria-hidden="true">↗</span></button><p role="status">{measurement === null ? "A possibility becomes an outcome." : <>Sample {samples}: <strong>{measurement}</strong><small>Each sample uses a freshly prepared state.</small></>}</p></div>
        </div>
      </section>

      <section className="ql-private" id="private-lab"><PrivateLabVisual paused={paused} /><div className="ql-reveal ql-reveal-delay-1"><p className="ql-eyebrow">BUILT AROUND YOUR CURIOSITY</p><h2>A space to experiment.<br /><span>A reason to come back.</span></h2><p>Save your circuits, pick up your learning trail and earn mastery as you solve challenges. Your work stays private to your account.</p><div className="ql-private-tags"><span>Guided learning</span><span>Quantum challenges</span><span>Private circuits</span></div><Link className="ql-primary ql-primary-soft" href={destination}>{profile?.authenticated ? "Return to your lab" : "Find your starting point"}<span aria-hidden="true">↗</span></Link></div></section>
      <section className="ql-finale ql-reveal"><span className="ql-finale-symbol" aria-hidden="true">ψ</span><p className="ql-eyebrow">THE NEXT POSSIBILITY IS YOURS.</p><h2>Curiosity looks<br /><span>good on you.</span></h2><Link className="ql-primary" href={destination}>Let’s explore quantum<span aria-hidden="true">↗</span></Link><p>See inside a quantum algorithm.</p></section>
    </main>
    <footer className="ql-footer ql-reveal"><Link className="ql-brand" href="/">◈ QuantumWalk.</Link><span>Small experiments. New perspectives.</span><div><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><a href="#landing-title">Back to top ↑</a></div></footer>
  </div>;
}
