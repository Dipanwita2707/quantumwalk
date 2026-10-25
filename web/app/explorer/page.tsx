"use client";

import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import "./explorer.css";

const explorers = [
  {
    href: "/explorer/mapper",
    title: "Classical ↔ quantum mapper",
    body: "Encode route indices, binary registers, and Grover query parameters with live validation (3–6 city TSP bounds).",
  },
  {
    href: "/explorer/tsp",
    title: "Three-city routes",
    body: "Map a tiny traveling-salesperson problem: classical brute force vs a 42-gate Grover preset (simulator-grounded).",
  },
  {
    href: "/explorer/grover",
    title: "Marked-state search",
    body: "Walk through Grover amplification on four labels, then open the same idea in your lab.",
  },
];

export default function ExplorerHubPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-shell explorer-shell">
        <p className="eyebrow">QUANTUM EXPLORER</p>
        <h1>Problem → circuit → compare</h1>
        <GuestExperienceBanner context="explorer" />
        <p className="content-intro">Bounded demos (≤4 qubits). Presets use the public demo simulator; sign in for the full lab.</p>
        <div className="content-cards">
          {explorers.map((item) => (
            <article key={item.href} className="content-card">
              <h2>{item.title}</h2>
              <p>{item.body}</p>
              <Link className="card-action" href={item.href}>
                Open explorer →
              </Link>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
