"use client";

import { useEffect, useRef, useState } from "react";

/** Decorative circuit paths; never a representation of a user's private circuit. */
export function CircuitAtmosphere({ paused }: { paused: boolean }) {
  const element = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(true);
  useEffect(() => {
    let visible = true;
    const update = () => setActive(visible && !document.hidden);
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; update(); });
    if (element.current) observer.observe(element.current);
    document.addEventListener("visibilitychange", update);
    return () => { observer.disconnect(); document.removeEventListener("visibilitychange", update); };
  }, []);
  return <div ref={element} className={`db-atmosphere ${paused || !active ? "db-atmosphere-paused" : ""}`} aria-hidden="true"><div className="db-background-aura" /><svg viewBox="0 0 1400 850" preserveAspectRatio="xMidYMin slice">
    <defs><linearGradient id="dashboard-wire" x1="0" x2="1"><stop stopColor="#70dccc" stopOpacity="0" /><stop offset=".4" stopColor="#70dccc" stopOpacity=".45" /><stop offset="1" stopColor="#a989ed" stopOpacity=".1" /></linearGradient></defs>
    {[80, 160, 240, 560, 640, 720].map((y, row) => <g key={y}><path className="db-background-wire" d={`M-60 ${y} H${180 + row * 50} L${230 + row * 50} ${y + 32} H${960 - row * 40} L${1010 - row * 40} ${y} H1460`} /><path className="db-background-signal" style={{ animationDelay: `${row * -1.8}s` }} d={`M-60 ${y} H${180 + row * 50} L${230 + row * 50} ${y + 32} H${960 - row * 40} L${1010 - row * 40} ${y} H1460`} />{[370 + row * 42, 870 - row * 24].map((x, index) => <g key={x}><rect x={x} y={y + 14} width="36" height="36" rx="7" /><text x={x + 18} y={y + 37}>{index ? "H" : row % 2 ? "Z" : "X"}</text></g>)}</g>)}
    <path className="db-background-link" d="M700 112V272M565 592V752" /><circle cx="700" cy="112" r="5" /><circle cx="700" cy="272" r="12" /><circle cx="565" cy="592" r="5" /><circle cx="565" cy="752" r="12" />
  </svg></div>;
}
