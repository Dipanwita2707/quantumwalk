"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { HUB_CATEGORIES, HUB_TOOLS, type HubTool } from "../../lib/hubTools";
import { HubToolsNav } from "@/components/HubToolsNav";
import { isRecord, readRecentTools, recordRecentTool, useHubDraft } from "@/lib/hubWorkspace";
import "@/app/hub/hub-home.css";

type HubFilters = { category: (typeof HUB_CATEGORIES)[number]; query: string };
const INITIAL_FILTERS: HubFilters = { category: "All", query: "" };
function validFilters(value: unknown): value is HubFilters { return isRecord(value) && HUB_CATEGORIES.some(category => category === value.category) && typeof value.query === "string" && value.query.length <= 200; }

export function HubHome() {
  const filters = useHubDraft("qw-hub-filters", INITIAL_FILTERS, validFilters);
  const { category, query: toolQuery } = filters.value;
  const [recent, setRecent] = useState<string[]>([]);
  const pathname = usePathname();

  useEffect(() => {
    if (pathname === "/hub") setRecent(readRecentTools());
  }, [pathname]);

  const tools = useMemo(() => {
    const q = toolQuery.trim().toLowerCase();
    return HUB_TOOLS.filter(tool => (category === "All" || tool.category === category) && (!q || `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(q)));
  }, [category, toolQuery]);

  const recentTools = recent
    .map((id) => HUB_TOOLS.find((t) => t.id === id))
    .filter((t): t is HubTool => !!t);

  return (
    <main className="content-shell hub-home-layout">
      <HubToolsNav />
      <div className="hub-home-main qw-hub-home" style={{ padding: 0, maxWidth: "none", margin: 0 }}>
        <section className="qw-hub-hero">
          <p className="eyebrow">TOOLS HUB</p>
          <h1>Your work, connected.</h1>
          <p className="content-intro">
            Build a network design, turn it into a report, and refine the document. Tool drafts are saved in this browser;
            Send actions carry a copy into the next tool without silently replacing another draft.
          </p>
        </section>

        <details className="hub-workflow-details"><summary>How the document tools connect</summary><section className="hub-workflow-overview" aria-label="Connected document workflow"><div><Link href="/hub/ml-studio"><strong>01 · Design</strong><span>Build a network and send its design report</span></Link><span aria-hidden="true">→</span><Link href="/hub/doc-editor"><strong>02 · Draft</strong><span>Edit Markdown with a live preview</span></Link><span aria-hidden="true">→</span><Link href="/hub/document-pro"><strong>03 · Prepare</strong><span>Use templates, review, and print or export</span></Link></div></section></details>

        {recentTools.length > 0 && (
          <section className="qw-hub-sec">
            <h2>Jump back in</h2>
            <ul className="qw-hub-jump">
              {recentTools.map((tool) => (
                <li key={tool.id}>
                  <Link href={tool.href} onClick={() => recordRecentTool(tool.id)}>
                    {tool.name} →
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="qw-hub-sec qw-hub-catalog" aria-label="Primary tools">
          <div className="qw-hub-sec-head">
            <h2>All tools</h2>
            <div className="qw-hub-tabs" role="group" aria-label="Tool categories">
              {HUB_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  disabled={!filters.ready}
                  aria-pressed={category === cat}
                  className={category === cat ? "on" : ""}
                  onClick={() => filters.update(previous => ({ ...previous, category: cat }))}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
          <label className="hub-catalog-search">
            <span className="visually-hidden">Search tools</span>
            <input
              type="search"
              disabled={!filters.ready}
              maxLength={200}
              aria-label="Search tools"
              placeholder="Search documents, quantum, research…"
              value={toolQuery}
              onChange={(event) => filters.update(previous => ({ ...previous, query: event.target.value }))}
            />
          </label>
          {tools.length === 0 ? (
            <p className="explorer-note" role="status">
              No tools match your search. <button type="button" className="hub-button" onClick={() => filters.update(INITIAL_FILTERS)}>Reset filters</button>
            </p>
          ) : (
            <div className="qw-hub-grid">
              {tools.map((tool) => (
                <ToolCard key={tool.id} tool={tool} />
              ))}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function ToolCard({ tool }: { tool: HubTool }) {
  return (
    <article className="content-card qw-hub-card">
      <span className="panel-kicker">{tool.category.toUpperCase()}</span>
      <h3>
        <Link href={tool.href} onClick={() => recordRecentTool(tool.id)}>
          {tool.name}
        </Link>
      </h3>
      <p>{tool.description}</p>
      <Link className="card-action" href={tool.href} onClick={() => recordRecentTool(tool.id)}>
        Open →
      </Link>
    </article>
  );
}
