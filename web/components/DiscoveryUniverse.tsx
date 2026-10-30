"use client";
import Link from "next/link";
import { useState } from "react";
import { ResourceState } from "@/components/ProductPage";
import { useResource } from "@/components/useResource";
import { ScienceIcon, Surface } from "@/components/ui/QuantumUI";
import "./discovery-universe.css";

type Discovery = { id: string; title: string; concept: string; domain: string; state: "discovered" | "available" | "locked"; prerequisite: string | null; position: { x: number; y: number }; criteria: string; requirement: string; discovered_at: string | null; href: string };
export function DiscoveryUniverse() {
  const resource = useResource<{ discovered: number; total: number; note: string; objects: Discovery[] }>("/api/v1/discovery/universe");
  const [selected, setSelected] = useState("");
  const current = resource.data?.objects.find(item => item.id === selected) ?? resource.data?.objects.find(item => item.state === "available") ?? resource.data?.objects[0];
  return <section aria-label="Discovery universe"><ResourceState {...resource} />{resource.data && <>
    <p className="science-muted" role="status">{resource.data.discovered} of {resource.data.total} discoveries revealed through validated mastery</p>
    <div className="du-layout"><div className="du-map" role="group" aria-label="Scientific discoveries">
      <svg viewBox="0 0 1000 600" preserveAspectRatio="none" aria-hidden="true">{resource.data.objects.map(item => { const parent = resource.data?.objects.find(other => other.id === item.prerequisite); return parent && <path key={item.id} d={`M${parent.position.x * 10} ${parent.position.y * 6}L${item.position.x * 10} ${item.position.y * 6}`} strokeDasharray={item.state === "locked" ? "4 8" : undefined} />; })}</svg>
      {resource.data.objects.map(item => <button type="button" key={item.id} className={`du-object du-${item.state}`} style={{ left: `${item.position.x}%`, top: `${item.position.y}%` }} aria-pressed={current?.id === item.id} onClick={() => setSelected(item.id)}><span><ScienceIcon name={item.state === "discovered" ? "spark" : "atom"} size={28} /></span><strong>{item.title}</strong><small>{item.state === "discovered" ? "Discovered" : item.state === "locked" ? "Mastery required" : "Ready to explore"}</small></button>)}
    </div>{current && <Surface as="aside" className="du-detail"><span className="q-ui-eyebrow">{current.domain}</span><h2>{current.title}</h2><p>{current.concept}</p><p>{current.requirement}</p><p className="science-muted">{current.criteria}</p>{current.discovered_at && <p>Revealed {new Date(current.discovered_at).toLocaleDateString()}</p>}<Link className="q-ui-button q-ui-button-primary" href={current.href}>{current.state === "discovered" ? "Revisit experiment" : "Explore experiment"}</Link><p className="science-muted">Exploration is available before mastery. Mission prerequisites still apply to rewards.</p></Surface>}</div>
    <p className="science-muted">{resource.data.note}</p>
  </>}</section>;
}
