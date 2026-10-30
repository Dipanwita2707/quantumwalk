"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { EXPLORER_DEMOS } from "@/lib/explorerDemos";

function matchesQuery(text: string, query: string): boolean {
  return text.toLowerCase().includes(query.trim().toLowerCase());
}

const topics: Record<string, { category: string; goal: string; outcome: string; steps: string; label: string }> = {
  mapper: { category: "Encoding", goal: "How does a classical route become a quantum register?", outcome: "Inspect route IDs, binary labels, and the size of the search space.", steps: "Route → index → register", label: "BUILD THE REPRESENTATION" },
  tsp: { category: "Optimization", goal: "Which route should a search algorithm favor?", outcome: "Edit costs and compare classical tours with bounded Grover sampling.", steps: "Costs → threshold → sampled tour", label: "COMPARE TWO APPROACHES" },
  grover: { category: "Search", goal: "How does a marked answer become more likely?", outcome: "Follow marking and amplification across four candidate labels.", steps: "Prepare → mark → amplify", label: "SEE INTERFERENCE AT WORK" },
};

export function ExplorerHubCatalog() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All experiments");
  const [marked, setMarked] = useState("10");
  const [amplified, setAmplified] = useState(false);

  const demos = useMemo(() => {
    const q = query.trim();
    return EXPLORER_DEMOS.filter(
      (item) => (category === "All experiments" || topics[item.id]?.category === category) && (!q || matchesQuery(item.title, q) || matchesQuery(item.body, q) || matchesQuery(item.id, q)),
    );
  }, [query, category]);

  return (
    <>
      <section className="ex-preview" aria-labelledby="ex-preview-title">
        <div className="ex-preview-copy"><span className="ex-eyebrow">TRY THE IDEA / TWO-QUBIT SEARCH</span><h2 id="ex-preview-title">Make one answer stand out.</h2><p>Choose a target label. One ideal Grover iteration turns a uniform four-label state into the marked answer.</p><div className="ex-preview-actions"><button type="button" aria-pressed={amplified} onClick={() => setAmplified(!amplified)}>{amplified ? "Reset to uniform state" : "Apply one Grover iteration"}</button><Link href="/explorer/grover">Open the full search experiment →</Link></div><small>Analytical preview · 2 qubits · 1 marked label. Open the experiment for the full walkthrough.</small></div>
        <div className="ex-preview-register"><span className="ex-eyebrow">SELECT A TARGET LABEL</span><div role="group" aria-label="Search preview target">{["00", "01", "10", "11"].map(basis => <button key={basis} type="button" aria-pressed={marked === basis} onClick={() => { setMarked(basis); setAmplified(false); }}><span>|{basis}⟩</span><span className="ex-preview-bar"><span style={{ height: `${amplified ? marked === basis ? 100 : 0 : 25}%` }} /></span><strong>{amplified ? marked === basis ? "100%" : "0%" : "25%"}</strong><small>{marked === basis ? "Target" : "Candidate"}</small></button>)}</div><p role="status">{amplified ? `Ideal probability of |${marked}⟩ is now 100%.` : "Uniform state: each candidate has 25% probability."}</p></div>
      </section>
      <div className="ex-catalog-heading"><div><span className="ex-eyebrow">CHOOSE YOUR EXPERIMENT</span><h2>Start with a question.</h2></div><Link href="/explorer/tsp">Suggested first stop: Three-city routes →</Link></div>
      <div className="ex-catalog-toolbar">
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
      <div className="ex-category-filters" role="group" aria-label="Filter experiment topics">{["All experiments", "Encoding", "Optimization", "Search"].map(value => <button type="button" key={value} aria-pressed={category === value} onClick={() => setCategory(value)}>{value}</button>)}</div>
      </div>
      {demos.length === 0 ? (
        <p className="explorer-note" role="status">
          No experiments match these filters. <button type="button" className="ex-reset" onClick={() => { setQuery(""); setCategory("All experiments"); }}>Reset filters</button>
        </p>
      ) : (
        <p className="ex-result-count" role="status">{demos.length} {demos.length === 1 ? "experiment" : "experiments"} available · Choose a problem to configure, run, and interpret.</p>
      )}
      <div
        className={`content-cards explorer-hub-cards${query.trim() ? " explorer-hub-cards-filtered" : ""}`}
        aria-label="Explorer demos"
      >
        {demos.map((item) => (
          <article key={item.href} className={`content-card ex-demo-card ex-demo-${item.id}`}>
            <div className="ex-card-visual" aria-hidden="true"><svg viewBox="0 0 280 100">{item.id === "mapper" ? <><path d="M26 50h50m125 0h50" /><rect x="78" y="25" width="120" height="50" rx="8" /><text x="138" y="57">101 → |101⟩</text><circle cx="24" cy="50" r="5" /><circle cx="254" cy="50" r="5" /></> : item.id === "tsp" ? <><path d="M55 72 140 20 225 72Z" /><path className="ex-route-trace" d="M55 72 140 20 225 72Z" />{[[55,72],[140,20],[225,72]].map(([x,y],index) => <g key={index}><circle cx={x} cy={y} r="11" /><text x={x} y={y+4}>{["A","B","C"][index]}</text></g>)}</> : <>{[0,1,2,3].map(index => <g key={index}><rect x={50+index*48} y={index===2?16:65} width="26" height={index===2?64:15} rx="4" /><text x={63+index*48} y="96">{index.toString(2).padStart(2,"0")}</text></g>)}</>}</svg></div>
            <span className="ex-eyebrow">{topics[item.id]?.label}</span>
            <h2>{item.title}</h2>
            <p className="ex-card-question">{topics[item.id]?.goal}</p>
            <p>{topics[item.id]?.outcome ?? item.body}</p><div className="ex-card-process">{topics[item.id]?.steps}</div>
            <Link className="card-action" href={item.href} aria-label={`Open ${item.title}`}>
              Open explorer →
            </Link>
          </article>
        ))}
      </div>
    </>
  );
}
