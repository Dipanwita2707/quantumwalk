import type { ScienceLab, ScienceResult } from "@/lib/science";

/** The detector strip encodes actual one-dimensional screen-bin counts. */
export function DoubleSlitDisplay({ lab, result }: { lab: ScienceLab; result: ScienceResult | null }) {
  const counts = result?.series.find(series => series.label === "Detected counts")?.values;
  const highest = Math.max(1, ...(counts ?? []));
  return <figure className="slit-display"><svg viewBox="0 0 600 260" role="img" aria-label="Double-slit apparatus with a detector strip encoding the calculated screen-bin counts">
    <defs><linearGradient id="slit-beam"><stop stopColor="#9f7aea" stopOpacity=".05" /><stop offset="1" stopColor="#69e1eb" stopOpacity=".35" /></linearGradient></defs>
    <path d="M48 130L210 40V220Z" fill="url(#slit-beam)" />
    <path d="M218 94L460 20V240Z M218 166L460 20V240Z" fill="url(#slit-beam)" opacity=".4" />
    <circle cx="48" cy="130" r="8" fill="var(--violet)" /><path d="M212 20V84M212 104V156M212 176V240" stroke="var(--cyan)" strokeWidth="5" />
    <rect x="460" y="20" width="52" height="220" fill="#0c152a" stroke="var(--line)" />
    {counts?.map((count, index) => <rect key={index} x="464" y={22 + index / counts.length * 216} width="44" height={216 / counts.length + .1} fill="var(--cyan)" opacity={count / highest} />)}
    <text x="20" y="250">Source</text><text x="182" y="255">Two slits</text><text x="448" y="255">Detector</text>
    <text x="310" y="32">{result ? `${result.parameters.particles} particles` : "Awaiting experiment"}</text>
  </svg><figcaption>{lab.slug === "double-slit" && "Conceptual apparatus; brightness on the detector strip represents actual sampled screen-bin counts. Geometry is schematic."}</figcaption></figure>;
}
