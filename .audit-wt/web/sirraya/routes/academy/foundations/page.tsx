import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";

const topics = [
  {
    title: "Complex numbers & vectors",
    body: "Amplitudes are complex. Probability comes from squared magnitude, not the raw number itself.",
    lab: "/workspace?mode=circuit&preset=superposition",
  },
  {
    title: "Measurement & probability",
    body: "One shot is one classical outcome. The simulator shows exact probabilities before sampling.",
    lab: "/learn/first-qubit",
  },
  {
    title: "Many qubits & tensor products",
    body: "Two qubits use four basis labels. Entanglement means you cannot describe each qubit alone.",
    lab: "/learn/entanglement",
  },
  {
    title: "Unitaries & circuits",
    body: "Each gate is a reversible rotation on the state vector until measurement ends the story.",
    lab: "/workspace?mode=circuit",
  },
];

export default function AcademyFoundationsPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-shell academy-hub">
        <p className="eyebrow">MATH & PHYSICS SPINE</p>
        <h1>Foundations before the widgets</h1>
        <p className="content-intro">
          Independent curriculum aligned with common academy ordering (Sirraya Academy bundle lists similar module
          titles). Start with the{" "}
          <Link href="/learn/math-amplitudes">amplitudes lesson</Link>, then open linked labs — all simulator-grounded.
        </p>
        <ol className="academy-spine-list">
          {topics.map((item) => (
            <li key={item.title} className="content-card">
              <h2>{item.title}</h2>
              <p>{item.body}</p>
              <Link className="card-action" href={item.lab}>
                Open linked activity →
              </Link>
            </li>
          ))}
        </ol>
        <Link className="card-action" href="/academy">
          ← Academy hub
        </Link>
      </main>
    </>
  );
}
