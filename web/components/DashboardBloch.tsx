"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { QuantumSphere } from "./QuantumSphere";

export function DashboardBloch({ paused }: { paused: boolean }) {
  const [phase, setPhase] = useState(0.65);
  const [theta, setTheta] = useState(Math.PI / 3);
  const [playing, setPlaying] = useState(true);
  const container = useRef<HTMLDivElement>(null);
  const phaseRef = useRef(0.65);
  useEffect(() => {
    const reduced = matchMedia("(prefers-reduced-motion: reduce)");
    let frame = 0, last = 0, visible = false;
    const enabled = () => playing && !paused && !reduced.matches && !document.hidden && visible;
    function tick(now: number) {
      frame = 0;
      if (!enabled()) return;
      if (now - last > 50) { phaseRef.current = (phaseRef.current + Math.min(now - last, 80) * 0.0005) % (2 * Math.PI); last = now; setPhase(phaseRef.current); }
      frame = requestAnimationFrame(tick);
    }
    function sync() { cancelAnimationFrame(frame); frame = 0; if (enabled()) { last = performance.now(); frame = requestAnimationFrame(tick); } }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); });
    if (container.current) observer.observe(container.current);
    reduced.addEventListener("change", sync); document.addEventListener("visibilitychange", sync);
    return () => { cancelAnimationFrame(frame); observer.disconnect(); reduced.removeEventListener("change", sync); document.removeEventListener("visibilitychange", sync); };
  }, [playing, paused]);
  const vector = useMemo(() => ({ x: Math.sin(theta) * Math.cos(phase), y: Math.sin(theta) * Math.sin(phase), z: Math.cos(theta) }), [theta, phase]);
  function preset(polar: number, azimuth: number) { setPlaying(false); setTheta(polar); phaseRef.current = azimuth; setPhase(azimuth); }
  return <div className="db-bloch-demo" ref={container}>
    <div className="db-scene-heading"><span className="db-eyebrow">INSIDE A QUBIT</span><span className="db-live-label">CONCEPT DEMO</span></div>
    <QuantumSphere vector={vector} motionPaused={paused} showTrajectory={playing} label={playing ? "Concept preview: a pure qubit undergoing Rz phase rotation" : "Concept preview: selected pure qubit state"} />
    <div className="db-state-presets" role="group" aria-label="Preview a quantum state"><span>TRY A STATE</span><button type="button" onClick={() => preset(0, 0)} aria-pressed={!playing && theta === 0}>|0⟩</button><button type="button" onClick={() => preset(Math.PI / 2, 0)} aria-pressed={!playing && theta === Math.PI / 2 && phase === 0}>|+⟩</button><button type="button" onClick={() => preset(Math.PI / 2, Math.PI / 2)} aria-pressed={!playing && phase === Math.PI / 2}>|+i⟩</button><button type="button" onClick={() => preset(Math.PI, 0)} aria-pressed={!playing && theta === Math.PI}>|1⟩</button></div>
    <div className="db-precession"><p><strong>{playing ? "Rz phase rotation" : "A state you can inspect"}</strong><span>{playing ? "The vector traces a circle. Measurement probabilities stay fixed." : `Ideal probability of 1: ${((1 - vector.z) * 50).toFixed(0)}%. Drag to change your view.`}</span></p><button type="button" disabled={paused} aria-pressed={playing} onClick={() => { if (!playing) setTheta(Math.PI / 3); setPlaying(!playing); }}>{playing ? "Pause demo" : "Play rotation"}</button></div>
  </div>;
}
