"use client";

import { usePathname } from "next/navigation";
import { useSiteAtmosphere } from "@/lib/site-atmosphere";

function classForPath(path: string): string {
  if (path === "/") return "qw-site-ambience-landing";
  if (path.startsWith("/start")) return "qw-site-ambience-journey";
  if (path.startsWith("/workspace") || path.startsWith("/dashboard")) return "qw-site-ambience-lab";
  return "qw-site-ambience-default";
}

/** Fixed sitewide backdrop — static gradients only (no canvas motion). */
export function QuantumSiteAmbience() {
  const path = usePathname() ?? "/";
  const { paused } = useSiteAtmosphere();

  return (
    <div
      className={`qw-site-ambience ${classForPath(path)} ${paused ? "qw-site-ambience-paused" : ""}`}
      aria-hidden="true"
    >
      <div className="qw-ambience-base" />
      <div className="qw-ambience-glow qw-ambience-glow-violet" />
      <div className="qw-ambience-glow qw-ambience-glow-cyan" />
      <div className="qw-ambience-vignette" />
    </div>
  );
}
