"use client";

import Link from "next/link";
import { discoveryTracks, type Experience } from "@/lib/onboarding";

const order: Experience[] = ["beginner", "intermediate", "advanced"];
const tags = ["The first spark", "Connect the dots", "Beyond the basics"] as const;

const branchPaths = [
  "M 120 280 C 120 220 180 180 280 160 S 480 140 620 120",
  "M 120 280 C 120 240 200 230 360 230 S 720 230 900 230",
  "M 120 280 C 120 260 220 300 380 320 S 760 360 980 340",
] as const;

export function PathPickerSection({ onSelect, paused = false }: { onSelect: (level: Experience) => void; paused?: boolean }) {
  return (
    <section
      className={`path-picker start-reveal ${paused ? "path-picker-paused" : ""}`}
      aria-labelledby="path-picker-title"
    >
      <div className="path-picker-ambient" aria-hidden="true">
        <svg className="path-constellation" viewBox="0 0 1100 380" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="path-node-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0" stopColor="#8cf5e2" stopOpacity="0.9" />
              <stop offset="1" stopColor="#8cf5e2" stopOpacity="0" />
            </radialGradient>
          </defs>
          <circle className="path-origin-pulse" cx="120" cy="280" r="28" />
          <circle className="path-origin-core" cx="120" cy="280" r="6" />
          {branchPaths.map((d, index) => (
            <g key={d}>
              <path className={`path-branch path-branch-${index + 1}`} d={d} />
              <path className={`path-branch-flow path-branch-flow-${index + 1}`} d={d} />
            </g>
          ))}
          {[
            { cx: 620, cy: 120 },
            { cx: 900, cy: 230 },
            { cx: 980, cy: 340 },
          ].map((node, index) => (
            <circle key={index} className={`path-branch-node path-branch-node-${index + 1}`} cx={node.cx} cy={node.cy} r="5" />
          ))}
        </svg>
      </div>
      <nav className="path-tool-hub" aria-label="QuantumWalk tools">
        <Link href="/workspace?mode=circuit">Lab</Link>
        <Link href="/learn">Path</Link>
        <Link href="/explorer/grover">Explorer</Link>
        <Link href="/learn/hardware">Hardware story</Link>
      </nav>
      <header className="path-picker-head">
        <p className="path-kicker">
          <span className="path-kicker-beacon" aria-hidden="true" />
          Choose your entry point
        </p>
        <h2 id="path-picker-title">
          Three paths. <span>Your pace.</span>
        </h2>
        <p className="path-picker-lede">No exam. No pressure. Start wherever you feel comfortable.</p>
      </header>
      <div className="path-streams">
        {order.map((value, index) => (
          <button
            type="button"
            className={`path-stream path-stream-${value} path-option-reveal path-option-reveal-${index + 1}`}
            key={value}
            onClick={() => onSelect(value)}
          >
            <span className="path-stream-node" aria-hidden="true" />
            <span className="path-stream-body">
              <span className="path-stream-index">0{index + 1}</span>
              <span className="path-stream-copy">
                <span className="path-option-tag">{tags[index]}</span>
                <span className="path-stream-title">{discoveryTracks[value].label}</span>
                <span className="path-stream-desc">{discoveryTracks[value].description}</span>
              </span>
            </span>
            <span className="path-stream-enter" aria-hidden="true">
              Enter path
            </span>
          </button>
        ))}
      </div>
      <p className="discovery-note path-picker-note">Two small discoveries · Two predictions · Your private quantum lab</p>
    </section>
  );
}
