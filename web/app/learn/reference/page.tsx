"use client";

import Link from "next/link";
import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { GuestExperienceBanner } from "@/components/GuestExperienceBanner";
import { CHEAT_SHEETS, filterGlossary } from "@/lib/glossary";

export default function AcademyReferencePage() {
  const [query, setQuery] = useState("");
  const visible = filterGlossary(query);

  return (
    <>
      <SiteHeader />
      <main className="content-shell academy-reference">
        <GuestExperienceBanner context="learn" />
        <p className="eyebrow">QUANTUM ACADEMY · REFERENCE</p>
        <h1>Glossary & cheat sheets</h1>
        <p className="content-intro">
          Search concepts in plain language, then jump into the lab panel that shows the idea. No live hardware claims —
          simulator-grounded only.
        </p>
        <Link className="card-action" href="/learn">
          ← Academy hub
        </Link>

        <label className="academy-search">
          <span className="panel-kicker">SEARCH</span>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Try Grover, syndrome, or Hadamard"
            aria-label="Search glossary"
          />
        </label>

        <section aria-labelledby="glossary-heading">
          <h2 id="glossary-heading">Glossary ({visible.length} terms)</h2>
          <ul className="academy-glossary-list">
            {visible.map((item) => (
              <li key={item.term}>
                <strong>{item.term}</strong>
                <p>{item.plain}</p>
                {item.anchor && (
                  <Link href={`/workspace#${item.anchor}`}>Open in lab →</Link>
                )}
              </li>
            ))}
          </ul>
          {visible.length === 0 && <p role="status">No terms match. Try a shorter phrase.</p>}
        </section>

        {CHEAT_SHEETS.map((sheet) => (
          <section key={sheet.id} className="content-card academy-cheat-sheet" aria-labelledby={`sheet-${sheet.id}`}>
            <h2 id={`sheet-${sheet.id}`}>{sheet.title}</h2>
            <table>
              <thead>
                <tr>
                  <th scope="col">Item</th>
                  <th scope="col">Meaning</th>
                </tr>
              </thead>
              <tbody>
                {sheet.rows.map((row) => (
                  <tr key={row.label}>
                    <th scope="row">{row.label}</th>
                    <td>
                      {row.href ? (
                        <Link href={row.href}>{row.detail}</Link>
                      ) : (
                        row.detail
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        ))}
      </main>
    </>
  );
}
