"use client";

import { QuantumFlowField, type FlowProfile } from "./QuantumFlowField";

/** @deprecated Use QuantumFlowField — kept for compatibility. */
export function QuantumEntanglementVibe({
  variant = "medium",
  paused = false,
}: {
  variant?: "subtle" | "medium" | "hero";
  paused?: boolean;
}) {
  const profile: FlowProfile =
    variant === "subtle" ? "lab" : variant === "hero" ? "journey" : "default";
  const boost = variant === "hero" ? "hero" : "none";
  return <QuantumFlowField profile={profile} boost={boost} paused={paused} fixed={false} />;
}
