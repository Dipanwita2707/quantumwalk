"use client";

import { QuantumPortal } from "@/components/QuantumPortal";

/** Discovery hero focal — portal only; global flow provides atmosphere. */
export function StartHeroStage() {
  return (
    <div className="start-hero-stage" aria-hidden="true">
      <div className="start-hero-portal">
        <QuantumPortal />
      </div>
      <svg className="start-hero-frame" viewBox="0 0 440 440" role="presentation">
        <circle cx="220" cy="220" r="200" className="start-frame-ring start-frame-ring-a" />
        <circle cx="220" cy="220" r="168" className="start-frame-ring start-frame-ring-b" />
        <path className="start-frame-tick" d="M220 12 V36 M220 404 V428 M12 220 H36 M404 220 H428" />
      </svg>
    </div>
  );
}
