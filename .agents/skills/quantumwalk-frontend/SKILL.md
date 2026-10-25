---
name: quantumwalk-frontend
description: Use for Next.js, React, TypeScript, component design, frontend state, routing, forms, data fetching, or UI implementation in QuantumWalk.
---

# Frontend engineering

- Verify the actual framework, router, package manager, and component conventions before editing.
- Use strict TypeScript types; avoid `any` unless justified and contained.
- Keep components cohesive and reasonably sized; extract shared components only when reuse or clarity benefits.
- Separate rendering from data access and domain logic where useful.
- Handle loading, empty, error, success, disabled, and retry states.
- Avoid duplicate requests, unnecessary rerenders, fragile effects, prop drilling when existing patterns solve it, and premature state libraries.
- Validate forms on client for usability and on server for security.
- Never put secrets or privileged authorization decisions in client code.
- Follow accessibility semantics, keyboard operation, focus management, reduced motion, and responsive behavior.
- Reuse existing tokens and components; avoid arbitrary CSS duplication.
- Run relevant lint/type/test checks and report what was not verified.
