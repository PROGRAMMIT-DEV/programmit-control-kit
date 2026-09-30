#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
VERSION="$(tr -d '[:space:]' < "$ROOT/VERSION")"

OUT_DIR="$ROOT/dist"
WORK="$(mktemp -d)"

trap 'rm -rf "$WORK"' EXIT

PAYLOAD="$WORK/payload"

mkdir -p \
  "$PAYLOAD/agents" \
  "$PAYLOAD/plugins" \
  "$PAYLOAD/bin" \
  "$OUT_DIR"

cp "$ROOT/.opencode/agents/programmit-control.md" "$PAYLOAD/agents/"
cp "$ROOT/.opencode/agents/programmit-fast.md" "$PAYLOAD/agents/"
cp "$ROOT/.opencode/plugins/programmit-auto-memory.ts" "$PAYLOAD/plugins/"

cp \
  "$ROOT/brain-template/bin/programmit-auto-memory" \
  "$PAYLOAD/bin/programmit-auto-memory.py"

cp "$ROOT/VERSION" "$PAYLOAD/VERSION"

cat > "$PAYLOAD/bin/programmit-auto-memory" <<'LAUNCHER'
#!/usr/bin/env bash
set -e

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

exec python3 \
  "$DIR/programmit-auto-memory.py" \
  "$@"
LAUNCHER

chmod +x "$PAYLOAD/bin/programmit-auto-memory"

tar \
  -C "$PAYLOAD" \
  -czf "$WORK/payload.tar.gz" \
  .

OUT="$OUT_DIR/Programmit-Control-v${VERSION}-Linux.run"

cat > "$OUT" <<'INSTALLER'
#!/usr/bin/env bash
set -euo pipefail

if ! command -v python3 >/dev/null 2>&1; then
  echo "ERROR: PROGRAMMIT Control requiere Python 3."
  exit 2
fi

TARGET_HOME="${HOME:?HOME no definido}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

LINE="$(awk '/^__PROGRAMMIT_ARCHIVE_BELOW__$/ {print NR + 1; exit}' "$0")"

tail -n +"$LINE" "$0" | \
  tar -xz -C "$TMP"

AGENT_DIR="$TARGET_HOME/.config/opencode/agents"
PLUGIN_DIR="$TARGET_HOME/.config/opencode/plugins"
PROGRAMMIT_DIR="$TARGET_HOME/.programmit"
BIN_DIR="$PROGRAMMIT_DIR/bin"

mkdir -p \
  "$AGENT_DIR" \
  "$PLUGIN_DIR" \
  "$BIN_DIR"

backup() {
  local file="$1"

  if [ -f "$file" ]; then
    cp -a \
      "$file" \
      "$file.backup.$(date +%Y%m%d_%H%M%S)"
  fi
}

backup "$AGENT_DIR/programmit-control.md"
backup "$PLUGIN_DIR/programmit-auto-memory.ts"
backup "$BIN_DIR/programmit-auto-memory"

cp "$TMP/agents/programmit-control.md" "$AGENT_DIR/"
cp "$TMP/agents/programmit-fast.md" "$AGENT_DIR/"
cp "$TMP/plugins/programmit-auto-memory.ts" "$PLUGIN_DIR/"

cp \
  "$TMP/bin/programmit-auto-memory.py" \
  "$BIN_DIR/"

cp \
  "$TMP/bin/programmit-auto-memory" \
  "$BIN_DIR/"

cp \
  "$TMP/VERSION" \
  "$PROGRAMMIT_DIR/version"

chmod 600 \
  "$AGENT_DIR/programmit-control.md" \
  "$PLUGIN_DIR/programmit-auto-memory.ts" \
  "$PROGRAMMIT_DIR/version" \
  "$BIN_DIR/programmit-auto-memory.py"

chmod 700 \
  "$BIN_DIR/programmit-auto-memory"

echo
echo "PROGRAMMIT Control v$(cat "$PROGRAMMIT_DIR/version") instalado."
echo "Memoria existente preservada."
echo "Ruta: $PROGRAMMIT_DIR/projects/"
echo

exit 0

__PROGRAMMIT_ARCHIVE_BELOW__
INSTALLER

cat "$WORK/payload.tar.gz" >> "$OUT"

chmod +x "$OUT"

echo "$OUT"
