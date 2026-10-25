# Design system (independent implementation)

**Scope:** QuantumWalk + Sirraya program · **Updated:** 2026-10-25

## Reference vs product

Sirraya hub uses `sx-*` classes and Tailwind CDN (OBSERVED). QuantumWalk keeps its **approved dark navy UI** with violet/cyan accents per AGENTS.md — functional parity, not pixel clone.

## Tokens (QuantumWalk — OBSERVED repo)

| Token | Usage |
| --- | --- |
| Navy backgrounds | Shell, cards, lab panels |
| Violet / cyan accents | CTAs, focus, quantum chrome |
| `--mx` / `--my` | Optional hover gradients (Sirraya hub pattern — not copied wholesale) |

## Typography

- System / sans stack in `web/app/style.css` and layout CSS  
- Prose for learn content; monospace for circuits  

## Components

See [component-inventory.md](./component-inventory.md).

## Accessibility

Follow `quantumwalk-accessibility` skill: keyboard nav on hub tiles, `aria-label` on academy sidebars, reduced motion via existing ambience toggles.
