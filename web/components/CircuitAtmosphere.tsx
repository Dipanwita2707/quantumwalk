"use client";

/** Soft dashboard backdrop — no animated circuit SVG (reduces visual noise). */
export function CircuitAtmosphere({ paused }: { paused: boolean }) {
  return (
    <div
      className={`db-atmosphere db-atmosphere-minimal ${paused ? "db-atmosphere-paused" : ""}`}
      aria-hidden="true"
    >
      <div className="db-background-aura" />
    </div>
  );
}
