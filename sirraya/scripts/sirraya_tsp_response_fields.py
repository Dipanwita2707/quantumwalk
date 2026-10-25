import re
import sys
from pathlib import Path

text = Path(sys.argv[1]).read_text(encoding="utf-8")
for token in [
    "quantum_result",
    "classical_result",
    "best_route",
    "measurement",
    "circuit_depth",
    "execution_time",
    "success",
]:
    if token in text:
        print(f"contains: {token}")

# Property access on result object `i`
for m in re.finditer(r"i\.([a-z_]+)", text):
    name = m.group(1)
    if name not in ("length",):
        pass
names = sorted(set(m.group(1) for m in re.finditer(r"i\.([a-z_][a-z0-9_]*)", text)))
print("i.* fields:", names[:40])
