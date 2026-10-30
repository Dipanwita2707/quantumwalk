"use client";

import { useEffect, useRef, useState } from "react";

export type DiscoveryScene = "superposition" | "measurement" | "interference" | "bell" | "mixed" | "grover" | "kickback";

const descriptions: Record<DiscoveryScene, { title: string; caption: string }> = {
  superposition: { title: "You control the first change.", caption: "Start with a qubit that will give 0. H is a gate: an operation that changes its state. Apply H to make 0 and 1 equally likely when measured." },
  measurement: { title: "One measurement. One outcome.", caption: "Each freshly prepared |+⟩ gives one classical result, 0 or 1. These are illustrative outcomes, not a simulation run." },
  interference: { title: "Same probabilities. Different phase.", caption: "H maps |+⟩ to |0⟩ and |−⟩ to |1⟩. Relative phase changes how amplitudes interfere." },
  bell: { title: "A pair with shared outcomes.", caption: "H followed by CX prepares (|00⟩ + |11⟩)/√2. Only 00 and 11 have nonzero probabilities." },
  mixed: { title: "The pair is pure. Each part is mixed.", caption: "Either qubit of this Bell pair has reduced state I/2. Its local Bloch vector is zero; the correlations belong to the joint state." },
  grover: { title: "Four states. One marked result.", caption: "For this ideal four-state search, one oracle and diffuser iteration changes the marked |11⟩ probability from 25% to 100%." },
  kickback: { title: "The target stays. The phase changes.", caption: "With target |−⟩, U_f adds (−1)^f(x) to each input amplitude. Relative signs can then influence interference." },
};

export function DiscoveryVisual({ scene }: { scene: DiscoveryScene }) {
  const [paused, setPaused] = useState(false);
  const [active, setActive] = useState(true);
  const [changed, setChanged] = useState(false);
  const [samples, setSamples] = useState<number[]>([]);
  const last = samples.at(-1);
  const zeros = samples.filter((value) => value === 0).length;
  const container = useRef<HTMLDivElement>(null);
  useEffect(() => {
    let visible = true;
    const update = () => setActive(visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    if (container.current) observer.observe(container.current);
    document.addEventListener("visibilitychange", update);
    update();
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);
  const description = descriptions[scene];
  return <div ref={container} className={`discovery-animation ${paused || !active ? "animation-paused" : ""}`} data-scene={scene}>
    <h2>{description.title}</h2>
    <svg viewBox="0 0 480 310" role="img" aria-label={description.caption} className="discovery-diagram">
      {scene === "superposition" && !changed && <>
        <text x="70" y="162">Start: 0</text><path d="M120 155H340" /><circle cx="350" cy="155" r="30" /><text x="350" y="162">0</text><text x="240" y="235" className="diagram-small">Before H: 0 is certain</text><circle r="6" className="diagram-traveler initial-zero" />
      </>}
      {scene === "superposition" && changed && <>
        <path d="M55 155H180M225 155L350 75M225 155L350 235" />
        <text x="55" y="135">|0⟩</text><rect x="180" y="130" width="50" height="50" rx="12" /><text x="205" y="162" className="gate-text">H</text>
        <circle cx="350" cy="75" r="26" /><circle cx="350" cy="235" r="26" /><text x="350" y="82">0</text><text x="350" y="242">1</text>
        <circle r="6" className="diagram-traveler branch-zero" /><circle r="6" className="diagram-traveler branch-one" />
        <text x="415" y="82" className="diagram-small">50%</text><text x="415" y="242" className="diagram-small">50%</text>
      </>}
      {scene === "measurement" && <>
        <text x="75" y="160">|+⟩</text><path d="M105 155H180M250 155H310" /><rect x="180" y="120" width="70" height="70" rx="16" /><text x="215" y="164">M</text>
        <circle cx="345" cy="155" r="38" /><text x="345" y="165">{last ?? "?"}</text>
        <text x="240" y="250" className="diagram-small">Prepare → measure → one result</text>
      </>}
      {scene === "interference" && [90, 220].map((y, index) => <g key={y} opacity={Number(changed) === index ? 1 : 0.35}>
        <text x="60" y={y + 8}>{index === 0 ? "|+⟩" : "|−⟩"}</text><path d={`M100 ${y}H195M245 ${y}H355`} /><rect x="195" y={y - 25} width="50" height="50" rx="12" /><text x="220" y={y + 8}>H</text><text x="385" y={y + 8}>{index === 0 ? "|0⟩" : "|1⟩"}</text><circle r="6" className={`diagram-traveler interference-${index}`} />
      </g>)}
      {scene === "bell" && <>
        <path d="M40 85H300M40 170H300M215 85V170" /><rect x="100" y="60" width="50" height="50" rx="12" /><text x="125" y="93">H</text><circle cx="215" cy="85" r="7" /><circle cx="215" cy="170" r="18" /><path d="M215 157V183M202 170H228" />
        <text x="45" y="58" className="diagram-small">q0</text><text x="45" y="210" className="diagram-small">q1</text>
        <g className="bell-outcomes"><g opacity={last === 1 ? 0.3 : 1}><rect x="325" y="60" width="110" height="50" rx="12" /><text x="380" y="92">00</text></g><g opacity={last === 0 ? 0.3 : 1}><rect x="325" y="145" width="110" height="50" rx="12" /><text x="380" y="177">11</text></g></g><text x="240" y="270" className="diagram-small">Joint probabilities: 50% / 50%</text>
      </>}
      {scene === "mixed" && <>
        {[135, 345].map((x, index) => <g key={x}><circle cx={x} cy="145" r="70" /><ellipse cx={x} cy="145" rx="70" ry="22" /><path d={`M${x} 65V225`} /><circle cx={x} cy="145" r="7" className="local-center" /><text x={x} y="45">q{index}</text><text x={x} y="255" className="diagram-small">ρ = I/2 · vector = 0</text></g>)}
        {!changed && <><path d="M210 145H270" className="correlation-link" /><text x="240" y="295" className="diagram-small">Shared Bell state: (|00⟩ + |11⟩)/√2</text></>}
      </>}
      {scene === "grover" && <>
        <text x="240" y="35" className="diagram-small">{changed ? "After one iteration: 11 is certain" : "Before search: each outcome has 25%"}</text>
        {["00", "01", "10", "11"].map((label, index) => <g key={label}><rect x={65 + index * 95} y="75" width="48" height="160" rx="8" className="probability-track" /><rect x={65 + index * 95} y={changed && index === 3 ? 75 : 195} width="48" height={changed ? index === 3 ? 160 : 0 : 40} rx="8" className="grover-bar" /><text x={89 + index * 95} y="265">{label}</text></g>)}
        <text x="240" y="300" className="diagram-small">Marked state: |11⟩</text>
      </>}
      {scene === "kickback" && <>
        <text x="60" y="95">|x⟩</text><text x="60" y="210">|−⟩</text><path d="M100 85H180M100 200H180M280 85H340M280 200H340" /><rect x="180" y="50" width="100" height="185" rx="16" /><text x="230" y="150">U_f</text><text x="400" y="88" className="diagram-small phase-sign">{changed ? "−|x⟩" : "+|x⟩"}</text><text x="390" y="210">|−⟩</text><text x="240" y="285" className="diagram-small">f(x) = {changed ? "1" : "0"} · target unchanged</text>
      </>}
    </svg>
    <div className="discovery-experiment">
      <span className="panel-kicker">TRY IT YOURSELF</span>
      {scene === "measurement" || scene === "bell" ? <>
        <button type="button" disabled={samples.length >= 100} onClick={() => setSamples((current) => [...current, Math.random() < 0.5 ? 0 : 1])}>{scene === "bell" ? "Prepare a pair & measure" : "Prepare a qubit & measure"}</button>
        <p role="status">{samples.length ? `Latest result: ${scene === "bell" ? last === 0 ? "00" : "11" : last}. ${samples.length} trials: ${zeros} ${scene === "bell" ? "00s" : "zeros"}, ${samples.length - zeros} ${scene === "bell" ? "11s" : "ones"}.` : "Press the button. Each trial starts with a freshly prepared state."}</p>
        {samples.length > 0 && <button className="experiment-reset" type="button" onClick={() => setSamples([])}>Reset trials</button>}
        <small>Local sampling of the ideal 50/50 distribution. Counts can vary; this preview does not run a quantum circuit.</small>
      </> : <>
        <button type="button" aria-pressed={changed} onClick={() => setChanged(!changed)}>{scene === "superposition" ? changed ? "Undo H · return to 0" : "Apply H · watch what changes" : scene === "grover" ? changed ? "Reset to the equal start" : "Run one Grover iteration" : scene === "interference" ? changed ? "Compare the + state" : "Compare the − state" : scene === "mixed" ? changed ? "See the shared pair" : "Look at each qubit alone" : changed ? "Set f(x) to 0" : "Set f(x) to 1"}</button>
        <p role="status">{scene === "superposition" ? changed ? "H applied: 0 and 1 each have a 50% chance. A measurement will still give only one result." : "No H yet: measuring this starting state always gives 0." : scene === "grover" ? changed ? "The marked outcome 11 now has probability 100% in this ideal example." : "All four outcomes start equally likely. The cyan bars show probabilities." : scene === "interference" ? changed ? "The minus state goes through H and becomes 1 with certainty." : "The plus state goes through H and becomes 0 with certainty." : scene === "mixed" ? changed ? "Each center dot means a zero local Bloch vector. Looking at one qubit cannot reveal all the pair's correlations." : "Together, the pair has a definite quantum state with matching 00 or 11 outcomes." : changed ? "When f(x) = 1, the input amplitude gains a minus sign; the target stays the same." : "When f(x) = 0, the input amplitude keeps its sign; the target stays the same."}</p>
      </>}
    </div>
    <button type="button" className="diagram-pause" aria-pressed={paused} onClick={() => setPaused(!paused)}>{paused ? "Play animation" : "Pause animation"}</button>
    <p>{description.caption}</p>
  </div>;
}
