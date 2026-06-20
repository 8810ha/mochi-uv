#!/usr/bin/env bash
# pCloud配下ではsymlinkが使えないため、/tmpにrsyncしてからdevサーバーを起動する。
# 編集はpCloud側で行い、watch.shで自動同期する想定。
set -euo pipefail

SRC="$(cd "$(dirname "$0")/.." && pwd)"
DEST="/tmp/mochi-uv-build"

echo "🌸 mochi UV dev — sync $SRC -> $DEST"
mkdir -p "$DEST"
rsync -a --delete \
  --exclude node_modules \
  --exclude .wrangler \
  --exclude dist \
  --exclude .pnpm-store \
  "$SRC/" "$DEST/"

cd "$DEST"
# /tmpではnode-linker=hoisted不要。デフォルトのsymlink方式で軽量に動く。
rm -f .npmrc
if [ ! -d node_modules ]; then
  echo "📦 installing dependencies in /tmp..."
  pnpm install
fi

echo "🚀 starting Vite dev server (http://localhost:5173)"
pnpm dev
