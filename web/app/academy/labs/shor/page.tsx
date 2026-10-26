"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { ShorEducationalLab } from "@/components/ShorEducationalLab";
import "../../../explorer/explorer.css";

export default function ShorLabPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-shell explorer-shell">
        <p className="eyebrow">ACADEMY LAB · EDUCATIONAL SIMULATOR</p>
        <h1>Shor period finding and factoring</h1>
        <GuestExperienceBanner context="learn" />
        <p className="content-intro">
          QuantumWalk-original lab paired with{" "}
          <Link href="/learn/shor-intro">Shor&apos;s algorithm</Link>. Prerequisites:{" "}
          <Link href="/learn/qft-intro">QFT lesson</Link> and <Link href="/academy/labs/qft">QFT lab</Link>. This is not
          Sirraya&apos;s proprietary curriculum body and does not run on quantum hardware.
        </p>
        <ShorEducationalLab />
        <div className="explorer-nav">
          <Link className="card-action" href="/learn/shor-intro">
            Shor lesson →
          </Link>
          <Link className="card-action" href="/academy/labs/qft">
            QFT lab →
          </Link>
          <Link className="card-action" href="/learn">
            Academy hub →
          </Link>
        </div>
      </main>
    </>
  );
}
