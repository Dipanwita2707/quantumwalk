"use client";

import { useEffect, useRef, useState, type SetStateAction } from "react";

export type HubToolId = "doc-editor" | "document-pro" | "ml-studio";
export type HubTransfer = { version: 1; id: string; source: HubToolId; title: string; body: string; createdAt: number };
export const HUB_TOOL_NAMES: Record<HubToolId, string> = { "doc-editor": "Doc Editor", "document-pro": "Document Pro", "ml-studio": "ML Studio" };
const MAX_DOCUMENT = 250_000;
const TRANSFERS_KEY = "qw-hub-transfers-v1";

export function isRecord(value: unknown): value is Record<string, unknown> { return !!value && typeof value === "object" && !Array.isArray(value); }
export function isDocument(value: unknown): value is string { return typeof value === "string" && value.length <= MAX_DOCUMENT; }
export function documentTitle(body: string) { return (body.split("\n").find(line => line.trim()) ?? "Untitled document").replace(/^#+\s*/, "").slice(0, 120); }
export function readRecentTools(): string[] {
  try { const raw: unknown = JSON.parse(localStorage.getItem("qw-hub-recent") ?? "[]"); return Array.isArray(raw) ? [...new Set(raw.filter((id): id is string => typeof id === "string" && id.length <= 80))].slice(0, 6) : []; }
  catch { return []; }
}
export function recordRecentTool(id: string) {
  try { localStorage.setItem("qw-hub-recent", JSON.stringify([id, ...readRecentTools().filter(value => value !== id)].slice(0, 6))); }
  catch { /* A recent-tools shortcut must never prevent navigation. */ }
}

function validTransfer(value: unknown): value is HubTransfer {
  return isRecord(value) && value.version === 1 && typeof value.id === "string" && /^[a-zA-Z0-9-]{1,80}$/.test(value.id) && typeof value.source === "string" && Object.hasOwn(HUB_TOOL_NAMES, value.source) && typeof value.title === "string" && value.title.length <= 120 && isDocument(value.body) && typeof value.createdAt === "number" && Number.isFinite(value.createdAt);
}
export function readTransfer(id: string): HubTransfer | null {
  if (!/^[a-zA-Z0-9-]{1,80}$/.test(id)) return null;
  const raw: unknown = JSON.parse(localStorage.getItem(TRANSFERS_KEY) ?? "[]");
  if (!Array.isArray(raw)) return null;
  return raw.find((entry): entry is HubTransfer => validTransfer(entry) && entry.id === id) ?? null;
}
export function createTransfer(source: HubToolId, target: "doc-editor" | "document-pro", body: string, title = documentTitle(body)): string {
  if (!isDocument(body) || !body.trim()) throw new Error("Add content before sending it. Documents can contain up to 250,000 characters.");
  const raw: unknown = JSON.parse(localStorage.getItem(TRANSFERS_KEY) ?? "[]");
  const previous = Array.isArray(raw) ? raw.filter(validTransfer) : [];
  const transfer: HubTransfer = { version: 1, id: crypto.randomUUID(), source, title: title.slice(0, 120), body, createdAt: Date.now() };
  // Keep a bounded history. The URL contains only an identifier, never document text.
  localStorage.setItem(TRANSFERS_KEY, JSON.stringify([transfer, ...previous].slice(0, 8)));
  return `/hub/${target}?transfer=${transfer.id}`;
}

/** Local-only drafts, with synchronous saves so navigation cannot outrun a debounce. */
export function useHubDraft<T>(key: string, initial: T, validate: (value: unknown) => value is T, mode: "json" | "text" = "json") {
  const [value, setValue] = useState(initial);
  const current = useRef(initial);
  const [ready, setReady] = useState(false);
  const [storageError, setStorageError] = useState(false);
  const [hasPrevious, setHasPrevious] = useState(false);
  const decode = (raw: string): unknown => mode === "text" ? raw : JSON.parse(raw);
  const encode = (next: T) => mode === "text" ? String(next) : JSON.stringify(next);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved !== null) {
        const parsed = decode(saved);
        if (!validate(parsed)) throw new Error("Invalid saved draft");
        current.current = parsed; setValue(parsed);
      }
      const previous = localStorage.getItem(`${key}:previous`);
      setHasPrevious(previous !== null && validate(decode(previous)));
    } catch { setStorageError(true); }
    setReady(true);
    // Each tool has a fixed key, schema, and codec for its mounted lifetime.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  function update(next: SetStateAction<T>) {
    if (!ready) return;
    const resolved = typeof next === "function" ? (next as (previous: T) => T)(current.current) : next;
    if (!validate(resolved)) return;
    current.current = resolved; setValue(resolved);
    try { localStorage.setItem(key, encode(resolved)); setStorageError(false); } catch { setStorageError(true); }
  }
  function importValue(next: T) {
    if (!ready || !validate(next)) throw new Error("The incoming content could not be loaded.");
    try {
      localStorage.setItem(`${key}:previous`, encode(current.current));
      localStorage.setItem(key, encode(next));
    } catch { setStorageError(true); throw new Error("The browser could not save a backup. Your current draft has been kept."); }
    current.current = next; setValue(next); setHasPrevious(true); setStorageError(false);
  }
  function restorePrevious() {
    try {
      const raw = localStorage.getItem(`${key}:previous`);
      const previous: unknown = raw === null ? null : decode(raw);
      if (!validate(previous)) throw new Error("No valid previous draft");
      importValue(previous);
    } catch { setStorageError(true); }
  }
  return { value, update, importValue, restorePrevious, ready, storageError, hasPrevious };
}
