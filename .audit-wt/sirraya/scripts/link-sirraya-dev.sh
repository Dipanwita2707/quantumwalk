#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
WEB_NM="$ROOT/web/node_modules"
SIRRAYA_NM="$ROOT/sirraya/web/node_modules"
if [[ ! -d "$WEB_NM" ]]; then
  echo "Run npm install in web/ first." >&2
  exit 1
fi
if [[ -e "$SIRRAYA_NM" ]]; then
  echo "Already linked: $SIRRAYA_NM"
else
  ln -s "../../web/node_modules" "$SIRRAYA_NM"
  echo "Linked $SIRRAYA_NM -> web/node_modules"
fi
