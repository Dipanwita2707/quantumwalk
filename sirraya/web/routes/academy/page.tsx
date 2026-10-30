import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { ACADEMY_MODULES } from "../../lib/academyModules";
import { LEARN_UNITS } from "@/lib/learnUnits";

const tiles = [
  {
    href: "/learn",
    kicker: "CURRICULUM",
    title: "Learning path",
    body: "Foundations → algorithms → noise → hardware concepts. Missions with embedded simulators.",
  },
  {
    href: "/academy/foundations",
    kicker: "MATH SPINE",
    title: "Foundations reader",
    body: "Complex numbers, measurement, tensor products, and unitaries — with links into lessons and lab.",
  },
  {
    href: "/academy/reservoir",
    kicker: "ADVANCED TOPIC",
    title: "Reservoir computing",
    body: "Concept overview tied to noise and entanglement lessons — no proprietary Sirraya demo clone.",
  },
  {
    href: "/learn/reference",
    kicker: "REFERENCE",
    title: "Glossary & cheat sheets",
    body: "30+ plain-language terms and gate notation with links into the lab.",
  },
  {
    href: "/learn/hardware",
    kicker: "HARDWARE STORY",
    title: "Architectures & characterization",
    body: "Superconducting, ion, and neutral-atom cards plus T1/T2 toy models — no live device.",
  },
  {
    href: "/explorer",
    kicker: "EXPLORER",
    title: "Problem → circuit",
    body: "Grover and TSP demos with classical baselines and honest simulator labels.",
  },
  {
    href: "/workspace?mode=circuit",
    kicker: "VIRTUAL LAB",
    title: "Circuit composer",
    body: "Build, run, step through Bloch sphere and probabilities. Qiskit or Cirq engine.",
  },
  {
    href: "/challenges",
    kicker: "ARENA",
    title: "Challenges",
    body: "Simulator-graded missions when signed in; inspect missions as a guest.",
  },
];

export default function AcademyHubPage() {
  return (
    <>
      <SiteHeader />
      <main className="content-shell academy-hub">
        <p className="eyebrow">QUANTUM ACADEMY</p>
        <h1>Learn the stack — one honest simulator at a time</h1>
        <p className="content-intro">
          Sirraya-style academy breadth without pretending we host live hardware. Pick a lane: guided lessons,
          reference, explorers, or the full lab.
        </p>

        <section className="academy-unit-map" aria-label="Curriculum units">
          <span className="panel-kicker">CURRICULUM MAP</span>
          <ul>
            {LEARN_UNITS.map((unit) => (
              <li key={unit.id}>
                <strong>{unit.title}</strong>
                <span>
                  {unit.lessonSlugs.length > 0
                    ? `${unit.lessonSlugs.length} lesson${unit.lessonSlugs.length === 1 ? "" : "s"}`
                    : "Concept modules"}
                </span>
              </li>
            ))}
          </ul>
          <Link className="card-action" href="/learn">
            Open learning path →
          </Link>
        </section>

        <section className="academy-unit-map" aria-label="Sirraya-aligned modules">
          <span className="panel-kicker">MODULE MAP (EVIDENCE-ALIGNED)</span>
          <ul>
            {ACADEMY_MODULES.map((mod) => (
              <li key={mod.id}>
                <Link href={mod.href}>
                  <strong>{mod.title}</strong>
                </Link>
                <span>{mod.description}</span>
              </li>
            ))}
          </ul>
        </section>

        <div className="academy-tiles">
          {tiles.map((tile) => (
            <article key={tile.href} className="content-card academy-tile">
              <span className="panel-kicker">{tile.kicker}</span>
              <h2>
                <Link href={tile.href}>{tile.title}</Link>
              </h2>
              <p>{tile.body}</p>
              <Link className="card-action" href={tile.href}>
                Enter →
              </Link>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
