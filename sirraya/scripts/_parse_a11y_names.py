import json
import re
import sys

path = sys.argv[1]
acc = json.load(open(path, encoding="utf-8"))["normalized_result"]["steps"][0]["artifacts"]["accessibility"]["value"]["text"]
for m in re.finditer(r'- button "([^"]+)"', acc):
    n = m.group(1)
    if any(k in n for k in ("Quantum Explorer", "Quantum Mapper", "ML Studio", "Doc Editor", "Document Pro", "Quantum Academy", "home")):
        print(repr(n))
