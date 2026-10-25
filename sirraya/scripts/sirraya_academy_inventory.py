"""Extract module/lesson titles from Sirraya QuantumAcademy bundle (observed strings)."""
import re
import sys
from pathlib import Path

text = Path(sys.argv[1]).read_text(encoding="utf-8", errors="replace")

# Common patterns in embedded curriculum JSON
titles = sorted(set(re.findall(r'title:"([^"]{4,120})"', text)))
modules = sorted(set(re.findall(r'module(?:Id|Name)?:"([^"]+)"', text, re.I)))
lessons = sorted(set(re.findall(r'lesson(?:Id|Title)?:"([^"]{4,120})"', text, re.I)))

print("title: count", len(titles))
for t in titles[:60]:
    print("  title:", t)
if len(titles) > 60:
    print("  ...", len(titles) - 60, "more")

print("\nmodule keys:", modules[:30])
print("\nlesson keys sample:", lessons[:30])

# Section headers in markdown content
heads = sorted(set(re.findall(r"## ([^\n`]{4,80})", text)))
print("\nh2 count", len(heads))
for h in heads[:25]:
    print("  ##", h)
