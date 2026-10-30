"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

/**
 * API origin for fetch(). In the browser, default to same-origin so Next.js rewrites
 * (/api/*, /auth/*, /health) reach API_INTERNAL_URL. Set NEXT_PUBLIC_API_URL only when
 * the API is on a different public host (e.g. split deploy).
 */
export function getApiBase(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "");
  if (configured) return configured;
  if (typeof window !== "undefined") return "";
  return (process.env.API_INTERNAL_URL ?? "http://127.0.0.1:8000").replace(/\/$/, "");
}

/** @deprecated Prefer getApiBase() in browser code; kept for modules that read once at import. */
export const API_BASE = process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, "") ?? "";

export type SessionProfile = {
  authenticated: true;
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  analytics_opt_in: boolean;
  csrf_token: string;
  roles?: string[];
};
export type GuestProfile = { authenticated: false; google_enabled: boolean };
export type Profile = SessionProfile | GuestProfile;

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

const CSRF_STALE = "Invalid request token";

async function fetchSessionProfile(): Promise<Profile> {
  const response = await fetch(`${getApiBase()}/api/me`, {
    credentials: "include",
    signal: AbortSignal.timeout(12_000),
  });
  if (!response.ok) throw new ApiError("Could not refresh your session.", response.status);
  return (await response.json()) as Profile;
}

function syncProfile(profile: Profile) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("quantumwalk-profile-sync", { detail: profile }));
  }
}

export async function api<T>(
  path: string,
  init: RequestInit = {},
  csrf?: string,
  retried = false
): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (csrf) headers.set("X-CSRF-Token", csrf);
  let response: Response;
  try {
    response = await fetch(`${getApiBase()}${path}`, { ...init, headers, credentials: "include" });
  } catch {
    throw new ApiError("Could not reach the QuantumWalk API. Check that it is running.", 0);
  }
  if (!response.ok) {
    if (response.status === 401 && typeof window !== "undefined") window.dispatchEvent(new Event("quantumwalk-session-expired"));
    let detail = "The request could not be completed.";
    try {
      const body = await response.json() as { detail?: string };
      if (typeof body.detail === "string") detail = body.detail;
    } catch { /* A non-JSON error still has a safe fallback. */ }
    if (
      !retried &&
      csrf &&
      response.status === 403 &&
      detail === CSRF_STALE &&
      typeof window !== "undefined"
    ) {
      try {
        const fresh = await fetchSessionProfile();
        syncProfile(fresh);
        if (fresh.authenticated) {
          return api<T>(path, init, fresh.csrf_token, true);
        }
      } catch {
        /* fall through to original error */
      }
    }
    if (detail === CSRF_STALE) {
      throw new ApiError("Your session token was out of date. Try again, or sign out and sign back in.", response.status);
    }
    throw new ApiError(detail, response.status);
  }
  return response.status === 204 ? null as T : await response.json() as T;
}

function useSessionState() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      const nextProfile = await api<Profile>("/api/me");
      setProfile(nextProfile);
      setError("");
      if (nextProfile.authenticated && typeof window !== "undefined") {
        const stored = localStorage.getItem("qw_discovery_explored");
        if (stored) {
          const explored = Math.min(4, Math.max(0, Number(stored) || 0));
          try {
            await api("/api/discovery/progress", {
              method: "POST",
              body: JSON.stringify({ explored }),
            }, nextProfile.csrf_token);
          } catch {
            /* keep local value for a later refresh */
          }
          localStorage.removeItem("qw_discovery_explored");
        }
      }
    }
    catch (cause) {
      setProfile({ authenticated: false, google_enabled: false });
      setError(cause instanceof Error ? cause.message : "Account state unavailable.");
    }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const expired = () => { void refresh(); };
    const synced = (event: Event) => {
      const next = (event as CustomEvent<Profile>).detail;
      if (next) setProfile(next);
    };
    window.addEventListener("quantumwalk-session-expired", expired);
    window.addEventListener("quantumwalk-profile-sync", synced);
    return () => {
      window.removeEventListener("quantumwalk-session-expired", expired);
      window.removeEventListener("quantumwalk-profile-sync", synced);
    };
  }, [refresh]);
  return { profile, loading, error, refresh };
}

const SessionContext = createContext<ReturnType<typeof useSessionState> | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const session = useSessionState();
  return createElement(SessionContext.Provider, { value: session }, children);
}

export function useSession() {
  const session = useContext(SessionContext);
  if (!session) throw new Error("SessionProvider is required");
  return session;
}
