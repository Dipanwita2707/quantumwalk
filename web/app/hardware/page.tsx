"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { api } from "@/lib/api";

export default function HardwarePage() {
  const [message, setMessage] = useState("Checking hardware availability…");
  useEffect(() => {
    void api<{ available: boolean; message: string }>("/api/hardware/status")
      .then((status) => setMessage(status.message))
      .catch(() => setMessage("Hardware status is unavailable. No physical device is connected in this release."));
  }, []);
  return <><SiteHeader /><main className="content-shell narrow"><p className="eyebrow">OPTIONAL FUTURE INTEGRATION</p><h1>Real quantum hardware</h1><div className="content-card"><h2>Simulator first</h2><p role="status">{message}</p><p>Every current result is produced by a bounded classical simulator and labeled as such. A real-device option will appear only after a provider, job quotas, user confirmation, and result-status handling are configured and tested.</p><Link className="card-action" href="/">Use the ideal simulator →</Link></div></main></>;
}
