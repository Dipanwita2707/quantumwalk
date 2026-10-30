"""Probe API health and readiness; emit safe JSON for a scheduler/monitor."""
import argparse
import json
import sys
from datetime import datetime, timezone
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import urlopen


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--api-url", default="http://localhost:8000")
    args = parser.parse_args()
    parts = urlsplit(args.api_url)
    if parts.scheme not in ("http", "https") or not parts.hostname or parts.username or parts.password or parts.query or parts.fragment:
        parser.error("Use an HTTP(S) API base URL without credentials, query, or fragment")
    checks = {}
    for path, expected in (("/health", "ok"), ("/readyz", "ready")):
        try:
            with urlopen(args.api_url.rstrip("/") + path, timeout=6) as response:
                body = json.loads(response.read(4096))
                checks[path] = response.status == 200 and isinstance(body, dict) and body.get("status") == expected
        except (HTTPError, URLError, TimeoutError, OSError, ValueError):
            checks[path] = False
    healthy = all(checks.values())
    print(json.dumps({"timestamp": datetime.now(timezone.utc).isoformat(), "healthy": healthy, "checks": checks}))
    return 0 if healthy else 1


if __name__ == "__main__":
    sys.exit(main())
