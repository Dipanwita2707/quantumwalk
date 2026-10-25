---
name: quantumwalk-token-efficiency
description: Use for scoped Codex tasks where context efficiency, minimal file inspection, concise output, and targeted verification matter.
---

# Token-efficient engineering workflow

1. Check `git status --short`.
2. Determine the smallest relevant file set and inspect only those files.
3. Search symbols before opening whole files; read only needed ranges.
4. Reuse existing architecture and docs; don't repeat discovery of unchanged facts.
5. Do not spawn agents for routine tasks.
6. Make one small, complete change; ask before expanding scope.
7. Run the narrowest meaningful tests and expand only when risk/failure requires it.
8. Review the actual diff and `git diff --check`.
9. Keep final output to five bullets maximum.
10. Never claim fixed savings; token usage depends on model, context, and task.
