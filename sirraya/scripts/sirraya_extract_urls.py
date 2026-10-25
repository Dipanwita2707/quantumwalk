import re
import sys
from pathlib import Path

text = Path(sys.argv[1]).read_text(encoding="utf-8")
urls = sorted(set(re.findall(r"http://localhost:8000[/\w\-?=&.]*", text)))
for u in urls:
    print(u)
