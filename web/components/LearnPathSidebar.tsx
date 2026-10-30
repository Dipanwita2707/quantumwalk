"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { api, useSession } from "@/lib/api";
import { LEARN_UNITS, unitCompletion } from "@/lib/learnUnits";
import { loadGuestLessonProgress } from "@/lib/guestLessonProgress";

export function LearnPathSidebar({ activeSlug }: { activeSlug?: string }) {
  const { profile } = useSession();
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [mobileOpen, setMobileOpen] = useState(false);

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
    <aside className="learn-path-rail">
      <button type="button" className="learn-path-toggle" aria-expanded={mobileOpen} aria-controls="learn-course-navigation" onClick={() => setMobileOpen(!mobileOpen)}>Course navigation <span>{mobileOpen ? "Close ↑" : "Open ↓"}</span></button>
    <nav id="learn-course-navigation" className={`learn-path-sidebar${mobileOpen ? " is-open" : ""}`} aria-label="Academy path">
      <div className="learn-path-heading"><span>QUANTUM ACADEMY</span><strong>Your learning path</strong></div>
      <Link className="learn-path-foundations" href="/academy/foundations">Foundations activities ↗</Link>
      {units.filter(({ unit }) => unit.id !== "math-spine").map(({ unit, stats }) => (
        <details key={unit.id} className="learn-path-unit" open={unit.lessonSlugs.includes(activeSlug ?? "") || (!activeSlug && unit.id === "foundations")}>
          <summary className="learn-unit-head">
            <span>{unit.title}</span>
            {stats.total > 0 ? (
              <span className="learn-unit-pct" aria-label={`${stats.done} of ${stats.total} lessons complete in ${unit.title}`}>
                {stats.done}/{stats.total}
              </span>
            ) : (
              <span className="learn-unit-pct learn-unit-pct-muted">Concepts</span>
            )}
          </summary>
          {stats.total > 0 && (
            <progress className="learn-unit-progress" value={stats.done} max={stats.total} aria-hidden="true" />
          )}
          <ul>
            {unit.lessonSlugs.map((slug) => {
              const label = slug.replace(/-/g, " ");
              const done = completed.has(`lesson:${slug}`);
              return (
                <li key={slug} className={done ? "learn-path-done" : ""}>
                  <Link href={`/learn/${slug}`} aria-current={activeSlug === slug ? "page" : undefined}>
                    {done ? "✓ " : ""}
                    {label.charAt(0).toUpperCase() + label.slice(1)}
                  </Link>
                </li>
              );
            })}
            {unit.links.filter(link => link.href !== "/learn/reference").map((link) => (
              <li key={link.href}>
                <Link href={link.href}>{link.label}</Link>
              </li>
            ))}
          </ul>
        </details>
      ))}
      <section className="learn-path-extras">
        <Link href="/learn">Learn home</Link>
        <Link href="/learn/reference">Glossary & cheat sheets</Link>
      </section>
    </nav>
    </aside>
  );
}
