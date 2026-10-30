"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { ActionLink, PageHeading, ScienceIcon, Surface } from "@/components/ui/QuantumUI";
import { api } from "@/lib/api";
import "./hardware.css";

export default function HardwarePage() {
  const [message, setMessage] = useState("Checking hardware availability...");
  useEffect(() => {
    let active = true;
    api<{ available: boolean; message: string }>("/api/hardware/status")
      .then(status => { if (active) setMessage(status.message); })
      .catch(() => { if (active) setMessage("Hardware status is unavailable. No physical device is connected in this release."); });
    return () => { active = false; };
  }, []);
  return <><SiteHeader /><main className="content-shell q-ui-hardware">
    <PageHeading title="Real quantum hardware" description="Understand the circuit-to-device workflow. Current QuantumWalk executions use a bounded classical simulator." />
    <div className="q-ui-hardware-layout"><div>
      <Surface className="q-ui-hardware-circuit"><header><h2>A circuit to explore</h2><span>Example only / not submitted</span></header>
        <svg viewBox="0 0 620 190" role="img" aria-label="Example Bell circuit: Hadamard on qubit zero, then controlled X from qubit zero to qubit one."><g stroke="#627c9e" fill="none"><path d="M70 65H580M70 135H580M330 65V135" /></g><g fill="#b9c9df" fontSize="15"><text x="20" y="70">q0</text><text x="20" y="140">q1</text></g><rect x="160" y="43" width="44" height="44" rx="5" fill="#8b4fe9" stroke="#c59dff" /><text x="175" y="72" fill="white" fontSize="22">H</text><circle cx="330" cy="65" r="6" fill="#bf9dff" /><circle cx="330" cy="135" r="18" stroke="#bf9dff" fill="#221c42" /><path d="M318 135H342M330 123V147" stroke="#e0caff" /></svg>
        <ActionLink href="/workspace?mode=circuit&preset=bell">Run in the simulator</ActionLink>
      </Surface>
      <Surface className="q-ui-hardware-results"><ScienceIcon name="chip" size={30} /><h2>No hardware job submitted</h2><p>Device results and job status will appear only when an actual hardware execution service is available. The circuit above is an example, not a device result.</p></Surface>
    </div><Surface as="aside" className="q-ui-hardware-provider"><span className="q-ui-eyebrow">DEVICE ACCESS</span><h2>Simulator first</h2><p role="status">{message}</p><p>A live execution workflow requires a configured provider, job quotas, confirmation, and verified result handling.</p><button type="button" disabled aria-describedby="hardware-unavailable">Hardware execution unavailable</button><small id="hardware-unavailable">This release does not provide a device submission action.</small><Link href="/learn/hardware">Explore hardware architectures</Link></Surface></div>
  </main></>;
}
