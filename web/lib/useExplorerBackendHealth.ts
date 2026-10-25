"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type BackendHealthState,
  fetchBackendHealth,
  healthFailureMessage,
} from "@/lib/explorerBackend";

export function useExplorerBackendHealth() {
  const [state, setState] = useState<BackendHealthState>("checking");
  const [detail, setDetail] = useState("Checking API…");
  const inflight = useRef<AbortController | null>(null);

  const check = useCallback(async () => {
    inflight.current?.abort();
    const controller = new AbortController();
    inflight.current = controller;
    setState("checking");
    setDetail("Checking API…");
    const result = await fetchBackendHealth(controller.signal);
    if (controller.signal.aborted) return;
    if (result.ok) {
      setState("online");
      setDetail("QuantumWalk API is online. Backend Grover sampling is available.");
    } else {
      setState("offline");
      setDetail(healthFailureMessage(result.reason, result.status));
    }
    if (inflight.current === controller) inflight.current = null;
  }, []);

  useEffect(() => {
    void check();
    return () => {
      inflight.current?.abort();
    };
  }, [check]);

  return {
    state,
    detail,
    check,
    checking: state === "checking",
    canRunBackendSolve: state === "online",
  };
}
