export type LabParameter = { key: string; label: string; unit: string; minimum: number; maximum: number; default: number; step: number };
export type ScienceLab = { slug: string; title: string; domain: string; level: string; minutes: number; question: string; objective: string; prediction: string; parameters: LabParameter[]; model: string; assumptions: string; limitations: string; reference: string; related: string; version: string; review_status: string; tier?: string; prerequisites?: string[] };
export type ScienceResult = { id?: string; lab: string; model_version: string; status: string; execution: string; seed: number; parameters: Record<string, number>; x: number[]; x_label: string; y_label: string; series: { label: string; values: number[] }[]; metrics: Record<string, number>; interpretation?: string };

export function displayNumber(value: number) {
  return Math.abs(value) > 0 && (Math.abs(value) < .001 || Math.abs(value) >= 1e5) ? value.toExponential(3) : Number(value.toFixed(4)).toLocaleString();
}
