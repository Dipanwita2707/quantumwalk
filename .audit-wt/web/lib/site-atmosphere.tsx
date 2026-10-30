"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

export type IntensityBoost = "none" | "hero";

type SiteAtmosphereContextValue = {
  paused: boolean;
  setPaused: (paused: boolean) => void;
  togglePaused: () => void;
  intensityBoost: IntensityBoost;
  setIntensityBoost: (boost: IntensityBoost) => void;
};

const SiteAtmosphereContext = createContext<SiteAtmosphereContextValue | null>(null);

export function SiteAtmosphereProvider({ children }: { children: ReactNode }) {
  const [paused, setPaused] = useState(false);
  const [intensityBoost, setIntensityBoost] = useState<IntensityBoost>("none");
  const value = useMemo(
    () => ({
      paused,
      setPaused,
      togglePaused: () => setPaused((current) => !current),
      intensityBoost,
      setIntensityBoost,
    }),
    [paused, intensityBoost],
  );
  return <SiteAtmosphereContext.Provider value={value}>{children}</SiteAtmosphereContext.Provider>;
}

export function useSiteAtmosphere() {
  const context = useContext(SiteAtmosphereContext);
  if (!context) {
    return {
      paused: false,
      setPaused: () => {},
      togglePaused: () => {},
      intensityBoost: "none" as IntensityBoost,
      setIntensityBoost: () => {},
    };
  }
  return context;
}
