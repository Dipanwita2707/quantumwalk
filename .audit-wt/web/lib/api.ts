"use client";

import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export type SessionProfile = {
  authenticated: true;
  id: string;
  display_name: string;
  email: string;
  avatar_url: string | null;
  analytics_opt_in: boolean;
  csrf_token: string;
};
export type GuestProfile = { authenticated: false; google_enabled: boolean };
export type Profile = SessionProfile | GuestProfile;

export class ApiError extends Error {
  constructor(message: string, public status: number) { super(message); }
}

export async function api<T>(path: string, init: RequestInit = {}, csrf?: string): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body) headers.set("Content-Type", "application/json");
  if (csrf) headers.set("X-CSRF-Token", csrf);
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, { ...init, headers, credentials: "include" });
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
    }
    catch (cause) { setProfile(null); setError(cause instanceof Error ? cause.message : "Account state unavailable."); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => { void refresh(); }, [refresh]);
  useEffect(() => {
    const expired = () => { void refresh(); };
    window.addEventListener("quantumwalk-session-expired", expired);
    return () => window.removeEventListener("quantumwalk-session-expired", expired);
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
