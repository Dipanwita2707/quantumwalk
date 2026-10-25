"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import {
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
        <p className="content-intro">
          Toggle a bit-flip on one data qubit and read stabilizer parities (ZZZ, ZIZ). This is a classical simulation of
          syndrome extraction — not a live device.
        </p>
        <section className="content-card" aria-labelledby="qec-data-title">
          <h2 id="qec-data-title">Data qubits</h2>
          <div className="explorer-steps" role="group" aria-label="Apply bit flip">
            {([0, 1, 2] as const).map((q) => (
              <button key={q} type="button" onClick={() => setState(injectBitFlip(state, q))} data-testid={`qec-flip-${q}`}>
                Inject X on q{q}
              </button>
            ))}
            <button type="button" onClick={() => setState(resetBitFlipLab())}>
              Reset to |000⟩
            </button>
          </div>
          <p className="explorer-note" data-testid="qec-syndrome">
            Syndrome: s01 = {syndrome.s01}, s12 = {syndrome.s12} → inferred error qubit:{" "}
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
