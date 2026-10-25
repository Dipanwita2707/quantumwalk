import re
import sys
from pathlib import Path

text = Path(sys.argv[1]).read_text(encoding="utf-8")
# Find JSON body construction near solve-tsp
for m in re.finditer(r"cities|r\.algorithm|distance|matrix|shots", text):
    if m.start() > 5000:
        break
print(text[8000:14000])
