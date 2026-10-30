"use client";

/** Private workspace — orbital vault + wire markers (no rectangular gate panels). */
export function PrivateLabVisual({ paused = false }: { paused?: boolean }) {
  const wires = [
    { y: 78, gates: [{ x: 118, l: "H" }, { x: 268, l: "●" }, { x: 402, l: "M" }] },
    { y: 132, gates: [{ x: 92, l: "X" }, { x: 428, l: "Z" }] },
    { y: 186, gates: [{ x: 140, l: "Z" }, { x: 312, l: "H" }, { x: 384, l: "M" }] },
  ];

  return (
    <figure className={`ql-private-visual ql-reveal ${paused ? "ql-private-visual-paused" : ""}`}>
      <div className="ql-private-trail" aria-hidden="true">
        <div className="ql-private-trail-glow" />
        <svg className="ql-private-trail-svg" viewBox="0 0 520 260" role="presentation">
          <defs>
            <linearGradient id="ql-trail-wire" x1="0" x2="1">
              <stop stopColor="#57e6ea" stopOpacity="0" />
              <stop offset="0.45" stopColor="#70dccc" stopOpacity="0.55" />
              <stop offset="1" stopColor="#a279ff" stopOpacity="0.15" />
            </linearGradient>
            <radialGradient id="ql-vault-core">
              <stop offset="0" stopColor="#8cf5e2" stopOpacity="0.35" />
              <stop offset="1" stopColor="#a279ff" stopOpacity="0" />
            </radialGradient>
          </defs>
          <ellipse className="ql-trail-orbit ql-trail-orbit-a" cx="260" cy="132" rx="198" ry="72" />
          <ellipse className="ql-trail-orbit ql-trail-orbit-b" cx="260" cy="132" rx="168" ry="58" transform="rotate(18 260 132)" />
          {wires.map(({ y, gates }, row) => (
            <g key={y}>
              <path className="ql-trail-wire" d={`M 28 ${y} H 492`} />
              <path className="ql-trail-signal" style={{ animationDelay: `${row * -1.6}s` }} d={`M 28 ${y} H 492`} />
              {gates.map(({ x, l }) => (
                <g key={`${y}-${x}`} className="ql-trail-marker">
                  <circle cx={x} cy={y} r="16" />
                  <line x1={x} y1={y - 22} x2={x} y2={y + 22} />
                  <text x={x} y={y + 5}>{l}</text>
                </g>
              ))}
            </g>
          ))}
          <circle className="ql-trail-vault" cx="260" cy="132" r="36" fill="url(#ql-vault-core)" />
          <circle className="ql-trail-node" cx="260" cy="132" r="22" />
          <g className="ql-trail-satellites">
            {[
              { x: 72, y: 52, label: "SAVED" },
              { x: 448, y: 58, label: "TRAIL" },
              { x: 260, y: 218, label: "YOU" },
            ].map(({ x, y, label }, i) => (
              <g key={label} className="ql-trail-satellite" style={{ animationDelay: `${i * -2.2}s` }}>
                <circle cx={x} cy={y} r="6" />
                <text x={x} y={y + 22}>{label}</text>
              </g>
            ))}
          </g>
        </svg>
        <p className="ql-private-trail-tag">SAVED CIRCUITS · LEARNING TRAIL · YOUR ACCOUNT</p>
      </div>
      <figcaption className="ql-private-caption">Your own corner of the quantum world</figcaption>
    </figure>
  );
}
