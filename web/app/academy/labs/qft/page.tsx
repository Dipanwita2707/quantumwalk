"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { QftSimulatorLab } from "@/components/QftSimulatorLab";
import "../../../explorer/explorer.css";

export default function QftLabPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-shell explorer-shell">
        <p className="eyebrow">ACADEMY LAB · IDEAL SIMULATOR</p>
        <h1>Quantum Fourier Transform playground</h1>
        <GuestExperienceBanner context="learn" />
        <p className="content-intro">
          QuantumWalk-original interactive demo paired with the{" "}
          <Link href="/learn/qft-intro">QFT lesson</Link>. Sirraya lesson 14 title was captured in recon; this simulator
          is not Sirraya&apos;s proprietary lab and does not run on quantum hardware.
        </p>
        <QftSimulatorLab />
        <div className="explorer-nav">
          <Link className="card-action" href="/learn/qft-intro">
            QFT lesson →
          </Link>
          <Link className="card-action" href="/academy/labs/shor">
            Shor lab →
          </Link>
          <Link className="card-action" href="/learn/shor-intro">
            Shor lesson →
          </Link>
          <Link className="card-action" href="/learn">
            Academy hub →
          </Link>
        </div>
      </main>
    </>
  );
}
