import Image from "next/image";
import { Surface } from "./QuantumUI";

export function ExplorerProfile({ level, xp, guest }: { level: number | null; xp: number | null; guest: boolean }) {
  return <Surface as="aside" className="q-ui-explorer-profile" aria-label="Explorer profile"><p>Your Explorer</p><div className="q-ui-explorer-portrait"><Image src="/images/quantum-explorer-v1.png" width={360} height={360} alt="Illustrated QuantumWalk explorer wearing a scientific hoodie" /></div><h2>{guest ? "Guest explorer" : level === null ? "Quantum explorer" : `Level ${level}`}</h2><span>Quantum Explorer</span>{!guest && xp !== null ? <><progress value={xp % 500} max={500} aria-label="Explorer level progress" /><small>{xp % 500}/500 XP to the next level</small></> : <small>{guest ? "Sign in to keep your discoveries." : "Progress will appear when available."}</small>}</Surface>;
}
