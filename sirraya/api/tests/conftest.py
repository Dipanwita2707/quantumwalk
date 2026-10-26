"""Ensure repo root and api/ are on sys.path for Sirraya API tests."""

import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
API = ROOT / "api"
for path in (str(ROOT), str(API)):
    if path not in sys.path:
        sys.path.insert(0, path)
