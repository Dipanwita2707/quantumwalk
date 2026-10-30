"use client";
import { useEffect } from "react";
import { getApiBase, useSession } from "@/lib/api";
export function PreferenceMotion() {
  const { profile } = useSession();
  useEffect(() => {
    const controller = new AbortController();
    delete document.documentElement.dataset.userReducedMotion;
    if (profile?.authenticated) fetch(`${getApiBase()}/api/v1/me/preferences`, { credentials: "include", signal: controller.signal }).then(async response => {
      if (!response.ok) return; // An optional preference fetch must not replace session handling.
      const value = await response.json() as { reduced_motion?: boolean };
      if (!controller.signal.aborted && typeof value.reduced_motion === "boolean") document.documentElement.dataset.userReducedMotion = String(value.reduced_motion);
    }).catch(() => { /* OS motion preference remains active when account settings are unavailable. */ });
    return () => controller.abort();
  }, [profile?.authenticated, profile?.authenticated ? profile.id : null]);
  return null;
}
