# Page specifications (hub + tools)

Evidence-led summaries for independent UI build. **Not** pixel specs.

## Hub home (OBSERVED)

- **Layout:** Hero (eyebrow greeting + name), primary CTAs (“Create a document”, search), optional “Jump back in”, Featured (2 large cards), All tools grid with category tabs, footer.  
- **Data:** Static tool registry in bundle (six entries).  
- **Empty states:** N/A on first visit; recents hidden when empty.

## Tool shell (OBSERVED)

- **Chrome:** Top bar with logo, tool name, search, shortcuts, profile field, back/home.  
- **Loading:** Suspense fallback progress + “Loading {name}…”.  
- **Title:** `{Tool name} · Sirraya Labs`.

## Quantum Explorer (OBSERVED — partial)

- **States:** `input` → run → `results`; backend status badge (checking / online / offline).  
- **Controls:** City count slider 3–6, distance matrix editor, algorithm select, shots, optimization level, error mitigation toggle, Grover iterations when applicable.  
- **Dependencies:** Local FastAPI (E009).

## Other tools

| Tool | Spec depth this cycle |
| --- | --- |
| Quantum Academy | Large embedded lesson JSON in chunk; screen-by-screen spec **UNKNOWN** |
| Quantum Mapper | Not downloaded; **UNKNOWN** |
| ML Studio | Not downloaded; **UNKNOWN** |
| Doc Editor | CodeMirror + AI commands inferred; **PARTIAL** |
| Document Pro | Template/export/sign inferred; **PARTIAL** — do not copy embedded org profile (E010) |
