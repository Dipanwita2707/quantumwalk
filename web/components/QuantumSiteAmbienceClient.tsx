"use client";

import dynamic from "next/dynamic";

/** Decorative backdrop — client-only to avoid hydration drift and stale RSC bundles. */
export const QuantumSiteAmbience = dynamic(
  () => import("./QuantumSiteAmbience").then((mod) => mod.QuantumSiteAmbience),
  { ssr: false }
);
