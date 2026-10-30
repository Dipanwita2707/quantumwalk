"""Regenerate web/lib/tspGroverPreset.ts from api/tsp_grover.py."""

from __future__ import annotations

import math
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from tsp_grover import build_tsp_grover_operations  # noqa: E402

out = Path(__file__).resolve().parents[2] / "web" / "lib" / "tspGroverPreset.ts"
lines = ["export const TSP3_GROVER_OPERATIONS = ["]
for op in build_tsp_grover_operations():
    parts = [f'gate: "{op.gate}"', f"target: {op.target}"]
    if op.control is not None:
        parts.append(f"control: {op.control}")
    if op.angle is not None:
        if abs(op.angle - math.pi / 4) < 1e-9:
            parts.append("angle: Math.PI / 4")
        elif abs(op.angle + math.pi / 4) < 1e-9:
            parts.append("angle: -Math.PI / 4")
        else:
            parts.append(f"angle: {op.angle!r}")
    lines.append("  {" + ", ".join(parts) + "},")
lines.append("] as const;")
lines.append("")
out.write_text("\n".join(lines), encoding="utf-8")
print(f"Wrote {len(build_tsp_grover_operations())} ops to {out}")
