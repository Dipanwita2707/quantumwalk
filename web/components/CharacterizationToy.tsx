"use client";

import { useState } from "react";
import { QuantumSphere } from "@/components/QuantumSphere";

export function CharacterizationToy() {
  const [t1, setT1] = useState(0.2);
  const decay = 1 - t1 * 0.85;
  const vector = { qubit: 0, x: decay * 0.9, y: 0, z: decay, purity: (1 + decay * decay + decay * decay) / 2 };

  return (
    <section className="content-card" aria-labelledby="char-title">
      <span className="panel-kicker">PEDAGOGICAL TOY · NOT LIVE HARDWARE</span>
      <h2 id="char-title">Relaxation on the sphere</h2>
      <p>Slide toward decay to see how a qubit might lose its direction over time (T1-style story).</p>
      <label>
        Decay amount
        <input type="range" min={0} max={1} step={0.01} value={t1} onChange={(e) => setT1(Number(e.target.value))} />
      </label>
      <QuantumSphere vector={vector} motionPaused label="Relaxation preview" />
    </section>
  );
}
