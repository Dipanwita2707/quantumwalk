import re
import sys
from pathlib import Path

text = Path(sys.argv[1]).read_text(encoding="utf-8")
for m in re.finditer(r"quantum_solutions|classical|i\.([a-z_]+)", text):
    pass
# nested access
nested = sorted(set(re.findall(r"i\.([a-z_]+)\.", text)))
print("nested:", nested)
for key in ["quantum_solutions", "quantum_advantage", "circuit_metrics", "execution_details", "recommendations"]:
    idx = text.find(key)
    if idx >= 0:
        print(key, "->", text[idx : idx + 200])

idx = text.find("quantum_solutions.slice")
if idx >= 0:
    print("\nSLICE BLOCK:\n", text[idx : idx + 1500])
