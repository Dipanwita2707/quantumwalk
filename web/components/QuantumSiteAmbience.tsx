"use client";

import { usePathname } from "next/navigation";
import { QuantumFlowField, type FlowProfile } from "./QuantumFlowField";
import { useSiteAtmosphere } from "@/lib/site-atmosphere";

function profileForPath(path: string): { profile: FlowProfile; className: string } {
  if (path === "/") return { profile: "marketing", className: "qw-site-ambience-landing" };
  if (path.startsWith("/start")) return { profile: "journey", className: "qw-site-ambience-journey" };
  if (path.startsWith("/workspace") || path.startsWith("/dashboard")) {
    return { profile: "lab", className: "qw-site-ambience-lab" };
  }
  return { profile: "default", className: "qw-site-ambience-default" };
}

/** Fixed decorative quantum flow — one canvas sitewide. */
export function QuantumSiteAmbience() {
  const path = usePathname() ?? "/";
  const { paused, intensityBoost } = useSiteAtmosphere();
  const { profile, className } = profileForPath(path);

  return (
    <div
      className={`qw-site-ambience ${className} ${paused ? "qw-site-ambience-paused" : ""}`}
      aria-hidden="true"
    >
      <QuantumFlowField profile={profile} boost={intensityBoost} paused={paused} fixed />
      <div className="qw-ambience-grid" />
      <div className="qw-ambience-vignette" />
    </div>
  );
}
