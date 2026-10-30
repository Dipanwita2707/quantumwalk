# QuantumWalk

**See inside a quantum algorithm.** Build small quantum circuits, run a bounded classical simulation, and inspect every step through probability, state-vector, Bloch, and measurement views.

The platform lives in `web/` (Next.js) and `api/` (FastAPI, Qiskit Aer, SQLAlchemy). It also includes starter algorithms, lessons, challenges, private saved circuits, Google sign-in integration, exports, and local curated explanations. See [DEVELOPMENT.md](DEVELOPMENT.md) for setup and verification, and [PLATFORM_BUILD_PLAN.md](PLATFORM_BUILD_PLAN.md) for the release plan and remaining gates.

## Goals
- Improve codebase maintainability and industry-grade engineering practices.
- Improve UI/UX and frontend implementation.
- Improve backend/API, database, testing, security, performance, accessibility, and DevOps quality.
- Reduce avoidable context consumption through focused inspection, on-demand skills, concise output, and targeted verification.
- Preserve QuantumWalk's product decisions and privacy/security requirements.

## Included
- `AGENTS.md`: short, always-relevant project rules.
- `.agents/skills/`: task-specific skills. Each skill is loaded only when relevant; do not paste all skill contents into every prompt.
- `.codex/prompts/`: reusable scoped prompts.
- `.codex/docs/`: workflow, architecture, quality gates, and token-efficiency guidance.
- `.codex/config.toml.example`: intentionally minimal example; not a drop-in replacement for global config.

## Install on Windows
1. Extract this ZIP.
2. Copy `AGENTS.md`, `.agents`, and `.codex` into `D:\quantumwalk`.
3. If `D:\quantumwalk\AGENTS.md` already exists, merge the content instead of overwriting it.
4. Start/reopen Codex from the QuantumWalk repository root.
5. Ask Codex: `Read AGENTS.md only. Do not scan source files. Summarize the applicable rules in 5 bullets. Do not edit anything.`

## Important: this is not the Token Optimizer plugin
This pack provides project instructions and skills; it does not include third-party plugin code or automatically install hooks. The separate Token Optimizer project has its own Codex setup and hook requirements:
https://github.com/alexgreensh/token-optimizer/blob/main/docs/codex.md

Its current Codex guide describes Codex CLI/Desktop, a marketplace plugin, and a separate hook setup requiring Python 3.9+. If you use only the VS Code extension and don't have the `codex` CLI command, don't run CLI commands in PowerShell expecting them to work. First verify whether your environment supports that plugin flow.

## Token-saving principles
Skills improve consistency but don't guarantee a fixed usage reduction. The pack keeps always-loaded instructions short, describes skills concisely, and recommends targeted file inspection and tests. Do not reduce necessary testing or security work just to save usage.

## Safety
- Never commit credentials, `.env` files, OAuth secrets, production data, or private research data.
- Do not execute unknown install scripts blindly.
- Review third-party plugin source and permissions before installing.
- Do not overwrite `%USERPROFILE%\.codex\config.toml` with the example file.
