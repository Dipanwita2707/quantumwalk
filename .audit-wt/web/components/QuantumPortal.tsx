/** Decorative vector artwork; no canvas loop, textures, or external downloads. */
export function QuantumPortal() {
  return <div className="quantum-portal" aria-hidden="true">
    <div className="portal-halo" />
    <svg viewBox="0 0 520 520" className="portal-orb">
      <defs>
        <radialGradient id="portal-fill"><stop offset="0" stopColor="#527eff" stopOpacity=".25" /><stop offset=".7" stopColor="#7770ef" stopOpacity=".06" /><stop offset="1" stopColor="#52f4e4" stopOpacity=".1" /></radialGradient>
      </defs>
      <circle cx="260" cy="260" r="170" fill="url(#portal-fill)" className="portal-outline" />
      <g className="portal-mesh">{Array.from({ length: 13 }, (_, i) => <ellipse key={`v${i}`} cx="260" cy="260" rx={12 + i * 13} ry="170" />)}{Array.from({ length: 11 }, (_, i) => <ellipse key={`h${i}`} cx="260" cy={110 + i * 30} rx={Math.sqrt(Math.max(0, 170 ** 2 - (150 - i * 30) ** 2))} ry="18" />)}</g>
      <g className="portal-orbit"><ellipse cx="260" cy="260" rx="238" ry="70" transform="rotate(-32 260 260)" /><ellipse cx="260" cy="260" rx="228" ry="78" transform="rotate(42 260 260)" /><circle cx="60" cy="369" r="6" /><circle cx="430" cy="418" r="4" /></g>
      <g className="portal-entangle"><path d="M118 260 C180 180 340 180 402 260 C340 340 180 340 118 260" /><path d="M130 260 C195 200 325 200 390 260 C325 320 195 320 130 260" /><circle cx="118" cy="260" r="10" /><circle cx="402" cy="260" r="10" /></g>
      <circle cx="260" cy="260" r="38" className="portal-core" /><text x="260" y="275">ψ</text>
      <path d="M260 40V80M260 440V480M40 260H80M440 260H480" className="portal-crosshair" />
    </svg>
    <span className="portal-tag portal-tag-one">01 / POSSIBILITY</span><span className="portal-tag portal-tag-two">A DIFFERENT WAY TO THINK</span><span className="portal-coordinate">|ψ⟩ = α|0⟩ + β|1⟩</span>
  </div>;
}

export function PathIllustration({ variant }: { variant: number }) {
  return <svg viewBox="0 0 240 120" className="path-illustration" aria-hidden="true">
    {variant === 0 ? <><circle cx="120" cy="60" r="38" /><ellipse cx="120" cy="60" rx="38" ry="13" /><ellipse cx="120" cy="60" rx="14" ry="38" /><path d="M120 60L149 32" /><circle cx="149" cy="32" r="5" className="path-point" /></> : variant === 1 ? <><circle cx="72" cy="60" r="29" /><circle cx="168" cy="60" r="29" /><path d="M95 43Q120 10 145 43M95 77Q120 110 145 77M101 60H139" /><circle cx="72" cy="60" r="5" className="path-point" /><circle cx="168" cy="60" r="5" className="path-point" /></> : <><path d="M36 82 Q90 82 118 52 Q146 28 176 52 Q206 76 204 82" /><circle cx="118" cy="52" r="5" className="path-point" /><circle cx="176" cy="52" r="4" className="path-point" /><path d="M36 82 H204" opacity=".35" /></>}
  </svg>;
}
