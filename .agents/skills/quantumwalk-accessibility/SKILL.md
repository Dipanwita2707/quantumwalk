---
name: quantumwalk-accessibility
description: Use when implementing or reviewing keyboard access, semantics, focus, contrast, motion, screen-reader support, or accessible forms in QuantumWalk.
---

# Accessibility

- Prefer semantic HTML and native controls where possible.
- All interactive elements must be keyboard operable with visible focus.
- Associate labels, descriptions, and validation errors with inputs.
- Ensure focus is managed sensibly for dialogs, navigation changes, and errors.
- Check color contrast; never convey status by color alone.
- Support reduced motion and avoid flashing or distracting animation.
- Use accessible names and announce important asynchronous status changes appropriately.
- Do not use ARIA to compensate for incorrect native semantics.
- Test the actual interaction path, not only markup.
