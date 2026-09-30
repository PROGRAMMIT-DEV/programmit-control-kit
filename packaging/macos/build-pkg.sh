#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VERSION="$(tr -d '[:space:]' < "$ROOT/VERSION")"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

ROOTFS="$WORK/root"
SCRIPTS="$WORK/scripts"

BASE="/usr/local/share/programmit-control"

mkdir -p \
  "$ROOTFS$BASE/agents" \
  "$ROOTFS$BASE/plugins" \
  "$ROOTFS$BASE/bin" \
  "$SCRIPTS" \
  "$ROOT/dist"

cp \
  "$ROOT/.opencode/agents/programmit-control.md" \
  "$ROOTFS$BASE/agents/"

cp \
  "$ROOT/.opencode/agents/programmit-fast.md" \
  "$ROOTFS$BASE/agents/"

cp \
  "$ROOT/.opencode/plugins/programmit-auto-memory.ts" \
  "$ROOTFS$BASE/plugins/"

cp \
  "$ROOT/brain-template/bin/programmit-auto-memory" \
  "$ROOTFS$BASE/bin/programmit-auto-memory.py"

cp \
  "$ROOT/packaging/macos/programmit-auto-memory" \
  "$ROOTFS$BASE/bin/programmit-auto-memory"

cp "$ROOT/VERSION" "$ROOTFS$BASE/VERSION"

cp \
  "$ROOT/packaging/macos/postinstall" \
  "$SCRIPTS/postinstall"

chmod +x \
  "$ROOTFS$BASE/bin/programmit-auto-memory" \
  "$SCRIPTS/postinstall"

pkgbuild \
  --root "$ROOTFS" \
  --scripts "$SCRIPTS" \
  --identifier "com.programmit.control" \
  --version "$VERSION" \
  "$ROOT/dist/Programmit-Control-v${VERSION}-macOS.pkg"

echo "$ROOT/dist/Programmit-Control-v${VERSION}-macOS.pkg"
