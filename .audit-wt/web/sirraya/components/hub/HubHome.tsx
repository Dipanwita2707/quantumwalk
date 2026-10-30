"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { HUB_CATEGORIES, HUB_TOOLS, type HubTool } from "../../lib/hubTools";

const RECENT_KEY = "qw-hub-recent";

function loadRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(RECENT_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function recordRecentTool(id: string) {
  const prev = loadRecent();
  const next = [id, ...prev.filter((x) => x !== id)].slice(0, 5);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function HubHome() {
  const [category, setCategory] = useState<(typeof HUB_CATEGORIES)[number]>("All");
  const [recent, setRecent] = useState<string[]>([]);

  useEffect(() => {
    setRecent(loadRecent());
  }, []);

  const tools = useMemo(() => {
    if (category === "All") {
      const featuredIds = new Set(HUB_TOOLS.filter((t) => t.featured).map((t) => t.id));
      return HUB_TOOLS.filter((t) => !featuredIds.has(t.id));
    }
    return HUB_TOOLS.filter((t) => t.category === category);
  }, [category]);

  const featured = HUB_TOOLS.filter((t) => t.featured);
  const recentTools = recent
    .map((id) => HUB_TOOLS.find((t) => t.id === id))
    .filter((t): t is HubTool => !!t);

  return (
    <main className="qw-hub-home">
      <section className="qw-hub-hero">
        <p className="eyebrow">TOOLS HUB</p>
        <h1>Research, documents, and quantum — in one workspace</h1>
        <p className="content-intro">
          Independent Sirraya-style hub. Documents stay in your browser until you choose to sign in and save server-side
          features elsewhere in QuantumWalk.
        </p>
      </section>

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

      <section className="qw-hub-sec">
        <h2>Featured</h2>
        <div className="qw-hub-grid qw-hub-grid-lg">
          {featured.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>

      <section className="qw-hub-sec">
        <div className="qw-hub-sec-head">
          <h2>All tools</h2>
          <div className="qw-hub-tabs" role="tablist">
            {HUB_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                role="tab"
                aria-selected={category === cat}
                className={category === cat ? "on" : ""}
                onClick={() => setCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
        <div className="qw-hub-grid">
          {tools.map((tool) => (
            <ToolCard key={tool.id} tool={tool} />
          ))}
        </div>
      </section>
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
