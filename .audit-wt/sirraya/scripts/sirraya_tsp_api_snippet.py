"""Find solve-tsp fetch usage context in Sirraya TSP bundle."""
import sys
from pathlib import Path

text = Path(sys.argv[1]).read_text(encoding="utf-8")
needle = "solve-tsp"
idx = 0
while True:
    i = text.find(needle, idx)
    if i < 0:
        break
    print(text[max(0, i - 200) : i + 400])
    print("\n---\n")
    idx = i + len(needle)
