"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { filterGlossary } from "@/lib/glossary";

export function LabGlossaryDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const visible = filterGlossary(query);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    panel.current?.focus();
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="lab-glossary-backdrop" role="presentation" onClick={onClose}>
      <aside
        className="lab-glossary-drawer"
        role="dialog"
        aria-labelledby="lab-glossary-title"
        ref={panel}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <h2 id="lab-glossary-title">Plain-language glossary</h2>
          <button type="button" onClick={onClose} aria-label="Close glossary">
            ✕
          </button>
        </header>
        <label>
          Search
          <input type="search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try measurement or Hadamard" />
        </label>
        <ul>
          {visible.map((item) => (
            <li key={item.term}>
              <strong>{item.term}</strong>
              <p>{item.plain}</p>
              {item.anchor && (
                <a href={`#${item.anchor}`} onClick={onClose}>
                  Show in lab →
                </a>
              )}
            </li>
          ))}
        </ul>
        <p className="lab-glossary-full-ref">
          <Link href="/learn/reference" onClick={onClose}>
            Full glossary & cheat sheets →
          </Link>
        </p>
      </aside>
    </div>
  );
}
