"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EXPLORER_DEMOS, EXPLORER_WORKFLOW } from "@/lib/explorerDemos";

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

export function ExplorerHubCatalog() {
  const [query, setQuery] = useState("");

  const demos = useMemo(() => {
    const q = query.trim();
    if (!q) return EXPLORER_DEMOS;
    return EXPLORER_DEMOS.filter(
      (item) => matchesQuery(item.title, q) || matchesQuery(item.body, q) || matchesQuery(item.id, q),
    );
  }, [query]);

  return (
    <>
      <label className="hub-catalog-search explorer-catalog-search">
        <span className="visually-hidden">Search experiments</span>
        <input
          type="search"
          aria-label="Search experiments"
          placeholder="Search mapper, TSP, Grover…"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </label>
      <div className="explorer-workflow-strip" aria-label="Typical explorer flow">
        {EXPLORER_WORKFLOW.map((step) => (
          <span key={step}>{step}</span>
        ))}
      </div>
      <p className="explorer-note">
        {demos.length === 0 ? (
          <>No demos match your search. Clear the filter or open the sidebar list.</>
        ) : (
          <>
            Start with <Link href="/explorer/tsp">Three-city routes</Link> for the full classical vs quantum story, or pick
            any demo below.
          </>
        )}
      </p>
      <div
        className={`content-cards explorer-hub-cards${query.trim() ? " explorer-hub-cards-filtered" : ""}`}
        aria-label="Explorer demos"
      >
        {demos.map((item) => (
          <article key={item.href} className="content-card">
            <h2>{item.title}</h2>
            <p>{item.body}</p>
            <Link className="card-action" href={item.href}>
              Open explorer →
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
