"use client";

import Link from "next/link";
import { LEARN_UNITS, unitCompletion } from "@/lib/learnUnits";
import { useId, useState } from "react";
import { Surface, ActionLink } from "@/components/ui/QuantumUI";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { CourseArtwork } from "@/components/ui/CourseArtwork";

const unitDescriptions: Record<string, string> = {
  "math-spine": "Build intuition for the mathematics behind quantum states.",
  foundations: "From your first qubit to entanglement and teleportation.",
  algorithms: "Follow interference through search, transforms and optimization.",
  noise: "Explore how errors affect a circuit and how correction works.",
  hardware: "Understand device architectures and their physical constraints.",
  reservoir: "Connect quantum dynamics with time-series learning.",
};

const unitLevels: Record<string, string> = { "math-spine": "beginner", foundations: "beginner", algorithms: "intermediate", noise: "intermediate", hardware: "intermediate", reservoir: "advanced" };

export function AcademyUnitOverview({ completed, progressReady }: { completed: Set<string>; progressReady: boolean }) {
  const [level, setLevel] = useState("all");
  const [sort, setSort] = useState("curriculum");
  const sortId = useId();
  const units = LEARN_UNITS.filter(unit => level === "all" || unitLevels[unit.id] === level).map((unit) => ({ unit, stats: unitCompletion(unit, completed) })).sort((a, b) => sort === "title" ? a.unit.title.localeCompare(b.unit.title) : 0);

  return (
    <section className="academy-unit-overview" aria-label="Academy units">
      <div className="academy-unit-overview-head">
        <span className="panel-kicker">ACADEMY UNITS</span>
        <Link className="card-action" href="/learn/reference">
          Glossary →
        </Link>
      </div>
      <div className="q-ui-catalog-toolbar"><SegmentedControl label="Learning path difficulty" value={level} onChange={setLevel} items={[{ value: "all", label: "All paths" }, { value: "beginner", label: "For beginners" }, { value: "intermediate", label: "Intermediate" }, { value: "advanced", label: "Advanced" }]} /><div className="q-ui-catalog-sort"><label htmlFor={sortId}>Sort by</label><select id={sortId} value={sort} onChange={event => setSort(event.target.value)}><option value="curriculum">Curriculum order</option><option value="title">Title</option></select></div></div>
      <div className="academy-unit-cards">
        {units.map(({ unit, stats }) => (
          <Surface as="article" key={unit.id} className="academy-unit-card q-ui-course-card">
            <CourseArtwork unit={unit.id} />
            <h2>{unit.title}</h2>
            <p>{unitDescriptions[unit.id]}</p>
            {stats.total > 0 ? (
              <>
                {progressReady ? <p>
                  {stats.pct}% complete · {stats.done}/{stats.total} lessons
                </p> : <p>Progress unavailable until lessons load.</p>}
                {progressReady && <progress value={stats.done} max={Math.max(1, stats.total)} aria-label={`${unit.title} progress`} />}
                <ActionLink className="academy-resume" href={`/learn/${unit.lessonSlugs.find(slug => !completed.has(`lesson:${slug}`)) ?? unit.lessonSlugs[0]}`}>
                  {progressReady && stats.done === stats.total ? "Review unit" : progressReady && stats.done > 0 ? "Resume unit" : "Start unit"} →
                </ActionLink>
                <details className="q-ui-course-resources"><summary>Lessons &amp; resources</summary>
                <ul>
                  {unit.lessonSlugs.slice(0, 3).map((slug) => (
                    <li key={slug}>
                      <Link href={`/learn/${slug}`}>{slug.replace(/-/g, " ")}</Link>
                    </li>
                  ))}
                </ul>
                {unit.links.map(link => <Link key={link.href} className="learn-path-lab-link" href={link.href}>{link.label} →</Link>)}
                </details>
              </>
            ) : (
              <><p className="q-ui-course-meta">Concept guide · no graded lessons</p>{unit.links[0] && <ActionLink className="academy-resume" href={unit.links[0].href}>{unit.links[0].label} →</ActionLink>}</>
            )}
            {stats.total === 0 && unit.links.slice(1).map((link) => (
              <Link key={link.href} className="learn-path-lab-link" href={link.href}>
                {link.label} →
              </Link>
            ))}
          </Surface>
        ))}
      </div>
    </section>
  );
}
