"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { ReservoirComputingLab } from "@/components/ReservoirComputingLab";

export default function ReservoirLabPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-shell explorer-shell">
        <p className="eyebrow">ACADEMY LAB · EDUCATIONAL SIMULATION</p>
        <h1>Reservoir computing readout</h1>
        <GuestExperienceBanner context="learn" />
        <p className="content-intro">
          Sirraya&apos;s Academy lists &quot;Quantum Reservoir Computing &amp; QML&quot; (lesson 17). QuantumWalk runs a
          classical echo-state toy so you can see feature extraction and readout without implying live quantum hardware.
        </p>
        <ReservoirComputingLab />
        <div className="explorer-nav">
          <Link className="card-action" href="/academy/reservoir">
            Concept overview →
          </Link>
          <Link className="card-action" href="/learn/quantum-reservoir">
            Reservoir lesson →
          </Link>
          <Link className="card-action" href="/learn">
            Academy hub →
          </Link>
        </div>
      </main>
    </>
  );
}
