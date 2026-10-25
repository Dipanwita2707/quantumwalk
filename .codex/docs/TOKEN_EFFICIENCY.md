# Token efficiency and context hygiene

## High-value habits
- One outcome per prompt; provide acceptance criteria.
- Inspect the relevant call path, not the entire repository.
- Prefer symbol search and small line ranges over full-file dumps.
- Do not repeatedly reread unchanged files or re-explain stable architecture.
- Avoid subagents for routine edits.
- Avoid verbose plans and long summaries when a concise result is enough.
- Run focused tests first and only expand validation when risk or failures justify it.
- Keep skills on-demand. Too many always-loaded instructions can increase context.
- For unrelated tasks, use a fresh conversation/session rather than dragging along stale history.
- Measure actual usage rather than assuming a prompt style saves a fixed percentage.

## Do not optimize away
- Security validation.
- Tests that protect critical behavior.
- Required migrations, type checks, accessibility checks, or build verification.
- User approval for destructive or broad changes.

## Task template
“Implement [one specific outcome]. Acceptance criteria: [2–4 bullets]. Inspect only relevant files, use the relevant skill, preserve existing patterns, make the smallest complete change, run targeted checks, and summarize in five bullets maximum.”
