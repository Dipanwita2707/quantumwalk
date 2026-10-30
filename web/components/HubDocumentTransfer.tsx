"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createTransfer, readTransfer, HUB_TOOL_NAMES, type HubToolId, type HubTransfer } from "@/lib/hubWorkspace";

export function HubSendActions({ source, body, ready }: { source: HubToolId; body: string; ready: boolean }) {
  const router = useRouter();
  const [error, setError] = useState("");
  function send(target: "doc-editor" | "document-pro") {
    try { const href = createTransfer(source, target, body); setError(""); router.push(href); }
    catch { setError("Could not send this copy. Check browser storage or export your work instead."); }
  }
  return <div className="hub-send-actions"><span>Carry a copy to</span>{(["doc-editor", "document-pro"] as const).filter(target => target !== source).map(target => <button key={target} type="button" disabled={!ready || !body.trim()} onClick={() => send(target)}>{HUB_TOOL_NAMES[target]} →</button>)}{error && <p role="alert">{error}</p>}</div>;
}

export function HubIncomingDocument({ ready, onImport }: { ready: boolean; onImport: (transfer: HubTransfer) => void }) {
  const [incoming, setIncoming] = useState<HubTransfer | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("transfer");
    if (!id) return;
    try { const transfer = readTransfer(id); if (!transfer) throw new Error("missing"); setIncoming(transfer); }
    catch { setError("This shared copy is no longer available in this browser. Your existing draft is unchanged."); }
  }, []);
  function clearLink() {
    const url = new URL(window.location.href); url.searchParams.delete("transfer");
    window.history.replaceState(window.history.state, "", `${url.pathname}${url.search}${url.hash}`);
  }
  function apply() {
    if (!incoming) return;
    try { onImport(incoming); setNotice(`Opened a copy from ${HUB_TOOL_NAMES[incoming.source]}. Your previous draft is available with Restore previous draft.`); setIncoming(null); setError(""); clearLink(); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Could not import this document."); }
  }
  return <>{incoming && <section className="hub-incoming" aria-label="Incoming document"><span className="panel-kicker">FROM {HUB_TOOL_NAMES[incoming.source].toUpperCase()}</span><h2>{incoming.title}</h2><p>Your current draft stays in place until you open this copy. A previous-draft backup will be saved first.</p><pre>{incoming.body.slice(0, 400)}{incoming.body.length > 400 ? "…" : ""}</pre><div><button type="button" disabled={!ready} onClick={apply}>Open incoming copy</button><button type="button" onClick={() => { setIncoming(null); setNotice("Kept your current draft."); clearLink(); }}>Keep current draft</button></div></section>}{notice && <p className="hub-transfer-notice" role="status">{notice}</p>}{error && <p className="hub-transfer-error" role="alert">{error}</p>}</>;
}
