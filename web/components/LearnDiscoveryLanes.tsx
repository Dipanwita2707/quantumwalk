import Link from "next/link";

const LANES = [
  {
    href: "/learn/reference",
    kicker: "REFERENCE",
    title: "Glossary & cheat sheets",
    body: "Searchable terms and gate notation with links into the lab.",
  },
  {
    href: "/academy/foundations",
    kicker: "MATH SPINE",
    title: "Foundations reader",
    body: "Complex numbers, measurement, and unitaries before deep labs.",
  },
  {
    href: "/learn/hardware",
    kicker: "HARDWARE",
    title: "Architectures & characterization",
    body: "Superconducting, ion, and neutral-atom cards — teaching models only.",
  },
  {
    href: "/challenges",
    kicker: "ARENA",
    title: "Challenges",
    body: "Simulator-graded missions when signed in; inspect as a guest.",
  },
  {
    href: "/algorithms",
    kicker: "LIBRARY",
    title: "Algorithm templates",
    body: "Grover, Bell, and Deutsch–Jozsa narratives with lab presets.",
  },
] as const;

export function LearnDiscoveryLanes() {
  return (
    <section className="learn-discovery-lanes" aria-label="More learning resources">
      <span className="panel-kicker">EXPLORE FURTHER</span>
      <div className="learn-discovery-lane-grid">
        {LANES.map((lane) => (
          <article key={lane.href} className="content-card learn-discovery-lane">
            <span className="panel-kicker">{lane.kicker}</span>
            <h2>
              <Link href={lane.href}>{lane.title}</Link>
            </h2>
            <p>{lane.body}</p>
            <Link className="card-action" href={lane.href}>
              Open →
            </Link>
          </article>
        ))}
      </div>
    </section>
  );
}
