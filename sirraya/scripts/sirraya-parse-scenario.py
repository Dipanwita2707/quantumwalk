"""Summarize REA capture_browser_scenario evidence JSON."""
from __future__ import annotations

import json
import sys
from collections import defaultdict
from pathlib import Path


def main() -> int:
    path = Path(sys.argv[1])
    data = json.loads(path.read_text(encoding="utf-8"))
    nr = data["normalized_result"]
    steps = nr["steps"]
    events = nr.get("events", {}).get("items", [])

    print(f"# Scenario summary: {path.name}\n")
    print(f"- duration_ms: {nr.get('duration_ms')}")
    print(f"- network events: {sum(1 for e in events if e.get('kind') == 'response')}")
    print(f"- limitations: {len(nr.get('limitations', []))}\n")

    print("## Steps\n")
    print("| step_id | status | after_url |")
    print("| --- | --- | --- |")
    for s in steps:
        au = s.get("after_url") or {}
        url = au.get("url") if isinstance(au, dict) else au
        err = s.get("error")
        status = s.get("status", "?")
        if err and status != "completed":
            status = f"{status} ({str(err)[:40]}…)"
        print(f"| {s.get('step_id')} | {status} | {url} |")

    print("\n## Network (unique URLs)\n")
    by_url: dict[str, list[int]] = defaultdict(list)
    for e in events:
        if e.get("kind") != "response":
            continue
        raw_url = e.get("url") or ""
        url = raw_url.get("url") if isinstance(raw_url, dict) else str(raw_url)
        st = e.get("status")
        if url.startswith("https://tools.sirraya.org") or "localhost" in url or ":8000" in url:
            by_url[url].append(st)

    for url in sorted(by_url.keys()):
        statuses = sorted({s for s in by_url[url] if s is not None})
        print(f"- `{url}` → statuses {statuses}")

    print("\n## Tool settle snapshots (headings)\n")
    settle_ids = [s["step_id"] for s in steps if s["step_id"].endswith("-settle")]
    for sid in settle_ids:
        step = next(s for s in steps if s["step_id"] == sid)
        acc = (step.get("artifacts") or {}).get("accessibility") or {}
        if acc.get("state") != "captured":
            print(f"### {sid}: accessibility unavailable")
            continue
        text = acc["value"]["text"]
        headings = [
            line.strip()
            for line in text.splitlines()
            if "heading" in line.lower() and "level=" in line.lower()
        ][:8]
        print(f"### {sid}")
        for h in headings:
            print(f"- {h}")
        if "Backend Server Offline" in text:
            print("- OBSERVED: Backend Server Offline callout (Quantum Explorer)")
        if "localhost" in text.lower():
            print("- OBSERVED: localhost mentioned in UI text")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
