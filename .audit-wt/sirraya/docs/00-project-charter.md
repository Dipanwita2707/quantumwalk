# Project charter — Sirraya independent reimplementation

**Project ID:** SIRRAYA-REIMPL-001  
**Date:** 25 October 2026  
**Status:** active — Phase 1 complete, Phase 2 in progress  

## Mission

Investigate the authorized, observable behavior of [Sirraya Labs tools](https://tools.sirraya.org/) and deliver an independent, maintainable implementation aligned with evidence—not a proprietary source or brand copy.

## Scope boundaries

| In scope | Out of scope (unless approved) |
| --- | --- |
| Public hub and tool behavior established from bundles, UI, and normal browsing | Bypassing auth, scraping private data, or attacking the reference site |
| Quantum Explorer / Academy / Mapper (partial overlap with existing **QuantumWalk** in this repo) | Rebuilding Sirraya’s full QuTub compiler stack or proprietary templates verbatim |
| Document Pro and Doc Editor as **equivalent-capability** designs | Copying Sirraya legal templates, logos, or registered entity boilerplate |
| Local dev, tests, deployment **preparation** | Public deploy, paid cloud, or production credentials without explicit approval |

## Workspace relationship

This repository is **QuantumWalk** (Next.js + FastAPI quantum education). Sirraya work lives entirely in **`sirraya/`** (docs, `sirraya/api`, `sirraya/web`). QuantumWalk wires routes via thin re-exports in `web/app/hub` and `web/app/academy` plus `sirraya.api` in `api/main.py`.

Prior competitive analysis: [SIRRAYA_REFERENCE_AND_ROADMAP.md](../references/SIRRAYA_REFERENCE_AND_ROADMAP.md).

## Roles and gates

Work proceeds evidence-first (see [03-evidence-register.md](./03-evidence-register.md)). Explicit approval required before: paid services, public deployment, destructive DB ops, or overwriting unrelated user changes in `web/` / `api/`.

## Success criteria (from master spec)

1. Feature inventory and workflow map with confidence labels  
2. Frontend and API catalogs with unknowns explicit  
3. PostgreSQL-oriented data model for **our** platform (not Sirraya’s internal DB)  
4. Runnable implementation for agreed scope or documented blockers  
5. Automated tests executed and recorded  
6. Deployment/runbook docs reproducible locally  

## Current phase

**Phase 2 — reconnaissance** (Phase 1 deliverables created 25 Oct 2026).
