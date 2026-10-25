"""One-off parser for Sirraya hub tool registry in the Vite entry bundle."""
import re
import sys
from pathlib import Path

path = Path(sys.argv[1])
text = path.read_text(encoding="utf-8")
for block in re.finditer(
    r'\{id:"([^"]+)",name:"([^"]+)",description:"([^"]+)"',
    text,
):
    print(f"{block.group(1)}\t{block.group(2)}\t{block.group(3)}")
