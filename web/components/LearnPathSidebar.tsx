"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, useSession } from "@/lib/api";
import { LEARN_UNITS, unitCompletion } from "@/lib/learnUnits";
import { loadGuestLessonProgress } from "@/lib/guestLessonProgress";

const PRESET_BY_LESSON: Record<string, string> = {
  "first-qubit": "superposition",
  entanglement: "bell",
  "grover-boost": "grover2",
  "pedagogy-noise": "bell",
  "tsp-classical": "tsp3",
  "qec-bit-flip": "bell",
};

export function LearnPathSidebar({ activeSlug }: { activeSlug?: string }) {
  const { profile } = useSession();
  const [completed, setCompleted] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!profile?.authenticated) {
      const guest = loadGuestLessonProgress();
      setCompleted(new Set(Object.keys(guest.completed).filter((k) => guest.completed[k])));
      return;
    }
    void api<{ activity_slug: string; completed: boolean }[]>("/api/progress")
      .then((rows) => setCompleted(new Set(rows.filter((r) => r.completed).map((r) => r.activity_slug))))
      .catch(() => setCompleted(new Set()));
  }, [profile?.authenticated, profile?.authenticated ? profile.id : null]);

  const units = useMemo(
    () =>
      LEARN_UNITS.map((unit) => ({
        unit,
        stats: unitCompletion(unit, completed),
      })),
    [completed]
  );

  return (
    <nav className="learn-path-sidebar" aria-label="Academy path">
      {units.map(({ unit, stats }) => (
        <section key={unit.id}>
          <div className="learn-unit-head">
            <h2>{unit.title}</h2>
            {stats.total > 0 ? (
              <span className="learn-unit-pct" aria-label={`${stats.pct}% of lessons complete in ${unit.title}`}>
                {stats.pct}% · {stats.done}/{stats.total}
              </span>
            ) : (
              <span className="learn-unit-pct learn-unit-pct-muted">Concepts</span>
            )}
          </div>
          {stats.total > 0 && (
            <progress className="learn-unit-progress" value={stats.done} max={stats.total} aria-hidden="true" />
          )}
          <ul>
            {unit.lessonSlugs.map((slug) => {
              const label = slug.replace(/-/g, " ");
              const preset = PRESET_BY_LESSON[slug];
              const done = completed.has(`lesson:${slug}`);
              return (
                <li key={slug} className={done ? "learn-path-done" : ""}>
                  <Link href={`/learn/${slug}`} aria-current={activeSlug === slug ? "page" : undefined}>
                    {done ? "✓ " : ""}
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </Link>
                  {preset && (
                    <Link className="learn-path-lab-link" href={`/workspace?preset=${preset}`}>
                      Lab preset →
                    </Link>
                  )}
                </li>
              );
            })}
            {unit.links.map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
      <section className="learn-path-extras">
        <Link href="/academy">Academy hub</Link>
        <Link href="/learn/reference">Glossary & cheat sheets</Link>
      </section>
    </nav>
  );
}
