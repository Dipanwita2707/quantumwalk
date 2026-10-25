"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import {
  applyTeachingCorrection,
  inferErrorFromSyndrome,
  injectBitFlip,
  measureSyndrome,
  resetBitFlipLab,
} from "@/lib/bitFlipCodeLab";

export default function QecLabPage() {
  const [state, setState] = useState(resetBitFlipLab());
  const syndrome = useMemo(() => measureSyndrome(state), [state]);
  const inferred = inferErrorFromSyndrome(syndrome.s01, syndrome.s12);

  return (
    <>
      <SiteHeader />
      <main className="content-shell explorer-shell">
        <p className="eyebrow">ACADEMY LAB · SIMULATOR</p>
        <h1>Bit-flip error detection (3-qubit code)</h1>
        <GuestExperienceBanner context="learn" />
        <p className="content-intro" data-testid="qec-explanation">
          Toggle a bit-flip on one data qubit and read neighbor parities{" "}
          <strong>s01 = d0 ⊕ d1</strong> and <strong>s12 = d1 ⊕ d2</strong>. The pair (s01, s12) identifies which qubit
          flipped. This pedagogical toy is a classical simulation — not fault-tolerant hardware; only single X errors on
          |000⟩ are modeled.
        </p>
        <section className="content-card" aria-label="Syndrome lookup table">
          <h2>Syndrome table (this lab)</h2>
          <table>
            <thead>
              <tr>
                <th scope="col">s01</th>
                <th scope="col">s12</th>
                <th scope="col">Inferred X on</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>0</td>
                <td>0</td>
                <td>none</td>
              </tr>
              <tr>
                <td>1</td>
                <td>0</td>
                <td>q0</td>
              </tr>
              <tr>
                <td>1</td>
                <td>1</td>
                <td>q1</td>
              </tr>
              <tr>
                <td>0</td>
                <td>1</td>
                <td>q2</td>
              </tr>
            </tbody>
          </table>
        </section>
        <section className="content-card" aria-labelledby="qec-data-title">
          <h2 id="qec-data-title">Data qubits</h2>
          <div className="explorer-steps" role="group" aria-label="Apply bit flip">
            {([0, 1, 2] as const).map((q) => (
              <button
                key={q}
                type="button"
                aria-label={`Inject bit flip on qubit q${q}`}
                onClick={() => setState(injectBitFlip(state, q))}
                data-testid={`qec-flip-${q}`}
              >
                Inject X on q{q}
              </button>
            ))}
            <button type="button" aria-label="Reset to zero state" onClick={() => setState(resetBitFlipLab())}>
              Reset to |000⟩
            </button>
            <button
              type="button"
              aria-label="Apply X correction from syndrome"
              disabled={inferred === null}
              data-testid="qec-correct"
              onClick={() => setState(applyTeachingCorrection(state))}
            >
              Apply X correction (restore |000⟩)
            </button>
          </div>
          <p className="explorer-note" data-testid="qec-syndrome">
            Data: |{state.data.join("")}⟩ · Syndrome: s01 = {syndrome.s01}, s12 = {syndrome.s12} → inferred error qubit:{" "}
            {inferred === null ? "none" : `q${inferred}`}
          </p>
        </section>
        <div className="explorer-nav">
          <Link className="card-action" href="/learn/qec-bit-flip">
            QEC lesson →
          </Link>
          <Link className="card-action" href="/academy">
            Academy hub →
          </Link>
        </div>
      </main>
    </>
  );
}
