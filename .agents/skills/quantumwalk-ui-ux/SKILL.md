---
name: quantumwalk-ui-ux
description: Use for visual design, screenshot matching, UX flows, responsive layouts, design systems, interaction design, and polishing QuantumWalk pages.
---

# QuantumWalk UI/UX standards

## Brand and visual direction
- Preserve the reference-aligned dark navy base with violet/cyan accents unless the user explicitly changes it.
- Avoid generic admin-dashboard styling. Maintain a deliberate visual hierarchy and consistent spacing.
- Core visual workspace: circuit builder, Bloch sphere, state vector; supporting step-by-step execution, state evolution, AI tutor, algorithm library, learning and challenges.

## Implementation standards
- Compare the requested screenshot/spec with the actual page before changing it.
- Match structure, proportions, spacing, typography, color, and interaction hierarchy; don't only copy colors.
- Use design tokens for colors, spacing, radii, shadows, typography, and focus states.
- Build responsive layouts that preserve key workflows on narrow screens.
- Every interactive control must work; do not add decorative dead buttons.
- Provide loading, empty, error, disabled, and success states where relevant.
- Ensure keyboard navigation, visible focus, labels, contrast, touch targets, and reduced-motion support.
- Use animation purposefully and avoid distracting motion.
- Prefer existing components over new dependencies; check screenshots or browser output when available.
- Do not claim pixel-perfect matching unless it was actually visually checked.
