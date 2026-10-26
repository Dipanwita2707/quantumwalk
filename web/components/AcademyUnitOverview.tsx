"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, useSession } from "@/lib/api";
import { LEARN_UNITS, unitCompletion } from "@/lib/learnUnits";

export function AcademyUnitOverview() {
  const { profile } = useSession();
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!profile?.authenticated) {
      setCompleted(new Set());
      return;
    }
    void api<{ activity_slug: string; completed: boolean }[]>("/api/progress")
      .then((rows) => setCompleted(new Set(rows.filter((r) => r.completed).map((r) => r.activity_slug))))
      .catch(() => setCompleted(new Set()));
  }, [profile?.authenticated, profile?.authenticated ? profile.id : null]);

  const units = useMemo(
    () => LEARN_UNITS.map((unit) => ({ unit, stats: unitCompletion(unit, completed) })),
    [completed]
  );

  return (
    <section className="academy-unit-overview" aria-label="Academy units">
      <div className="academy-unit-overview-head">
        <span className="panel-kicker">ACADEMY UNITS</span>
        <Link className="card-action" href="/learn/reference">
          Glossary →
        </Link>
      </div>
      <div className="academy-unit-cards">
        {units.map(({ unit, stats }) => (
          <article key={unit.id} className="content-card academy-unit-card">
            <h2>{unit.title}</h2>
            {stats.total > 0 ? (
              <>
                <p>
                  {stats.pct}% complete · {stats.done}/{stats.total} lessons
                </p>
                <progress value={stats.done} max={Math.max(1, stats.total)} aria-label={`${unit.title} progress`} />
                <ul>
                  {unit.lessonSlugs.slice(0, 3).map((slug) => (
                    <li key={slug}>
                      <Link href={`/learn/${slug}`}>{slug.replace(/-/g, " ")}</Link>
                    </li>
                  ))}
                </ul>
              </>
            ) : (
              <p>Concept modules — no graded lessons yet.</p>
            )}
            {unit.links.map((link) => (
              <Link key={link.href} className="learn-path-lab-link" href={link.href}>
                {link.label} →
              </Link>
            ))}
          </article>
        ))}
      </div>
    </section>
  );
}
