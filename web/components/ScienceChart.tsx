import { displayNumber, type ScienceResult } from "@/lib/science";

export function ScienceChart({ result }: { result: ScienceResult }) {
  const all = result.series.flatMap(series => series.values);
  const low = Math.min(0, ...all), high = Math.max(...all, .00000001);
  const xmin = Math.min(...result.x), xmax = Math.max(...result.x);
  const project = (x: number, y: number) => `${60 + (x - xmin) / (xmax - xmin || 1) * 600},${260 - (y - low) / (high - low || 1) * 220}`;
  return <figure className="science-chart">
    <svg viewBox="0 0 700 320" role="img" aria-label={`${result.y_label} versus ${result.x_label}. Numerical data follows the chart.`}>
      {[0, .25, .5, .75, 1].map(ratio => <g key={ratio}><line x1="60" x2="660" y1={260 - ratio * 220} y2={260 - ratio * 220} stroke="var(--line)" /><text x="52" y={264 - ratio * 220} textAnchor="end">{displayNumber(low + (high - low) * ratio)}</text></g>)}
      {result.series.map((series, index) => <polyline key={series.label} points={series.values.map((y, i) => project(result.x[i], y)).join(" ")} fill="none" stroke={index % 2 ? "var(--cyan)" : "var(--violet)"} strokeWidth="2" />)}
      <text x="60" y="283">{displayNumber(xmin)}</text><text x="660" y="283" textAnchor="end">{displayNumber(xmax)}</text>
      <text x="360" y="309" textAnchor="middle">{result.x_label}</text>
    </svg>
    <figcaption><strong>{result.y_label}</strong><span className="science-chart-legend">{result.series.map((series, index) => <span key={series.label}><i style={{ background: index % 2 ? "var(--cyan)" : "var(--violet)" }} aria-hidden="true" />{series.label}</span>)}</span></figcaption>
    <details><summary>View numerical data</summary><div className="science-table-scroll"><table><thead><tr><th scope="col">{result.x_label}</th>{result.series.map(series => <th scope="col" key={series.label}>{series.label}</th>)}</tr></thead><tbody>{result.x.map((x, i) => <tr key={i}><th scope="row">{displayNumber(x)}</th>{result.series.map(series => <td key={series.label}>{displayNumber(series.values[i])}</td>)}</tr>)}</tbody></table></div></details>
  </figure>;
}
