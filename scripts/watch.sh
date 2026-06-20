#!/usr/bin/env bash
# pCloud側の編集を/tmpのビルドツリーに自動同期する。
# 別ターミナルで dev.sh と並行起動して使う。
set -euo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST="/tmp/mochi-uv-build"

echo "👀 watching $SRC -> $DEST"
if ! command -v fswatch >/dev/null; then
  echo "fswatch not found. install: brew install fswatch"
  exit 1
fi

sync() {
  rsync -a --delete \
    --exclude node_modules \
    --exclude .wrangler \
    --exclude dist \
    --exclude .pnpm-store \
    --exclude .git \
    "$SRC/" "$DEST/"
}

sync
fswatch -o "$SRC/apps" "$SRC/packages" | while read -r; do
  sync
  echo "↻ synced $(date +%H:%M:%S)"
done
