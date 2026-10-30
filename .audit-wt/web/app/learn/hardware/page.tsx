"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { CharacterizationToy } from "@/components/CharacterizationToy";

const architectures = [
  {
    name: "Superconducting",
    plain: "Microwave pulses on chip. Fast gates, cryogenic temperatures, planar connectivity.",
    gates: "CX, RZ, H",
  },
  {
    name: "Trapped ion",
    plain: "Ions held by fields. High fidelity, slower gates, all-to-all pairs often easier.",
    gates: "MS gates, rotations",
  },
  {
    name: "Neutral atom",
    plain: "Atoms in arrays. Flexible layout, Rydberg interactions for entanglement.",
    gates: "Controlled-Z, single-qubit R",
  },
];

export default function LearnHardwarePage() {
  return (
    <>
      <SiteHeader />
      <main className="content-shell">
        <p className="eyebrow">HONEST HARDWARE STORY</p>
        <h1>What real machines look like</h1>
        <p className="content-intro">
          These cards are conceptual. QuantumWalk does not connect to a live device unless a provider is configured and labeled.
        </p>
        <div className="content-cards">
          {architectures.map((item) => (
            <article key={item.name} className="content-card">
              <span className="panel-kicker">ARCHITECTURE</span>
              <h2>{item.name}</h2>
              <p>{item.plain}</p>
              <p>
                <strong>Typical native gates:</strong> {item.gates}
              </p>
            </article>
          ))}
        </div>
        <CharacterizationToy />
        <Link className="card-action" href="/workspace">
          Back to ideal simulator →
        </Link>
      </main>
    </>
  );
}
