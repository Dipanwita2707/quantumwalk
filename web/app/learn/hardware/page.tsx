"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { CharacterizationToy } from "@/components/CharacterizationToy";
import { ArchitectureConnectivity } from "@/components/ArchitectureConnectivity";
import { PageHeading } from "@/components/ui/QuantumUI";

const architectures = [
  {
    name: "Superconducting",
    plain: "Microwave pulses on chip. Fast gates, cryogenic temperatures, planar connectivity.",
    gates: "CX, RZ, H",
    topology: "planar" as const,
  },
  {
    name: "Trapped ion",
    plain: "Ions held by fields. High fidelity, slower gates, all-to-all pairs often easier.",
    gates: "MS gates, rotations",
    topology: "all-to-all" as const,
  },
  {
    name: "Neutral atom",
    plain: "Atoms in arrays. Flexible layout, Rydberg interactions for entanglement.",
    gates: "Controlled-Z, single-qubit R",
    topology: "grid" as const,
  },
];

export default function LearnHardwarePage() {
  return (
    <>
      <SiteHeader />
      <main className="content-shell">
        <PageHeading title="What real machines look like" eyebrow="HARDWARE CONCEPTS" description="These architectures are conceptual. Explore how physical connectivity shapes a quantum circuit." />
        <div className="content-cards">
          {architectures.map((item) => (
            <article key={item.name} className="content-card">
              <span className="panel-kicker">ARCHITECTURE</span>
              <h2>{item.name}</h2>
              <p>{item.plain}</p>
              <p>
                <strong>Typical native gates:</strong> {item.gates}
              </p>
              <ArchitectureConnectivity topology={item.topology} label={`Typical ${item.name} qubit connectivity (conceptual)`} />
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
