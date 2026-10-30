"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { groverSuccessProbability, suggestedGroverIterations } from "@/lib/quantumMapper";

export default function GroverLabPage() {
  const [size, setSize] = useState(16);
  const [iterations, setIterations] = useState(3);
  const success = useMemo(() => groverSuccessProbability(size, iterations), [size, iterations]);
  const suggested = useMemo(() => suggestedGroverIterations(size), [size]);

  return (
    <>
      <SiteHeader />
      <main className="content-shell explorer-shell">
        <p className="eyebrow">ACADEMY LAB · QUERY MODEL</p>
        <h1>Grover amplification calculator</h1>
        <GuestExperienceBanner context="learn" />
        <p className="content-intro">
          Adjust search space N and iteration count k to see ideal success probability. Pair with the{" "}
          <Link href="/explorer/grover">Grover explorer</Link> and lab presets for circuits.
        </p>
        <section className="content-card">
          <label>
            N items
            <select value={size} data-testid="grover-lab-n" onChange={(e) => setSize(Number(e.target.value))}>
              {[8, 16, 64, 256].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
          <label>
            Iterations k = {iterations}
            <input
              type="range"
              min={0}
              max={Math.max(2, 2 * suggested + 2)}
              value={iterations}
              data-testid="grover-lab-iters"
              onChange={(e) => setIterations(Number(e.target.value))}
            />
          </label>
          <button type="button" onClick={() => setIterations(suggested)}>
            Suggested k ≈ {suggested}
          </button>
          <p data-testid="grover-lab-success">
            Ideal success: <strong>{(success * 100).toFixed(1)}%</strong>
          </p>
        </section>
        <div className="explorer-nav">
          <Link className="card-action" href="/learn/grover-boost">
            Grover lesson →
          </Link>
          <Link className="card-action" href="/explorer/mapper">
            Mapper encodings →
          </Link>
        </div>
      </main>
    </>
  );
}
