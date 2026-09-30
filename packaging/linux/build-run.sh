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
  "$OUT_DIR"

cp "$ROOT/.opencode/agents/programmit-control.md" "$PAYLOAD/agents/"
cp "$ROOT/.opencode/agents/programmit-fast.md" "$PAYLOAD/agents/"
cp "$ROOT/.opencode/plugins/programmit-auto-memory.ts" "$PAYLOAD/plugins/"

cp "$ROOT/VERSION" "$PAYLOAD/VERSION"

tar \
  -C "$PAYLOAD" \
  -czf "$WORK/payload.tar.gz" \
  .

OUT="$OUT_DIR/Programmit-Control-v${VERSION}-Linux.run"

cat > "$OUT" <<'INSTALLER'
#!/usr/bin/env bash
set -euo pipefail

TARGET_HOME="${HOME:?HOME no definido}"

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

LINE="$(awk '/^__PROGRAMMIT_ARCHIVE_BELOW__$/ {print NR + 1; exit}' "$0")"

tail -n +"$LINE" "$0" | \
  tar -xz -C "$TMP"

AGENT_DIR="$TARGET_HOME/.config/opencode/agents"
PLUGIN_DIR="$TARGET_HOME/.config/opencode/plugins"
PROGRAMMIT_DIR="$TARGET_HOME/.programmit"
mkdir -p \
  "$AGENT_DIR" \
  "$PLUGIN_DIR" \
  "$PROGRAMMIT_DIR"

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
cp "$TMP/agents/programmit-control.md" "$AGENT_DIR/"
cp "$TMP/agents/programmit-fast.md" "$AGENT_DIR/"
cp "$TMP/plugins/programmit-auto-memory.ts" "$PLUGIN_DIR/"

cp \
  "$TMP/VERSION" \
  "$PROGRAMMIT_DIR/version"

rm -f \
  "$PROGRAMMIT_DIR/bin/programmit-auto-memory" \
  "$PROGRAMMIT_DIR/bin/programmit-auto-memory.py" \
  "$PROGRAMMIT_DIR/bin/programmit-auto-memory.cmd" \
  "$PROGRAMMIT_DIR/bin/programmit-auto-memory.exe" 2>/dev/null || true

chmod 600 \
  "$AGENT_DIR/programmit-control.md" \
  "$PLUGIN_DIR/programmit-auto-memory.ts" \
  "$PROGRAMMIT_DIR/version"

echo
echo "PROGRAMMIT Control v$(cat "$PROGRAMMIT_DIR/version") instalado."
echo "Auto Memory integrado: no requiere Python."
echo "Memoria existente preservada."
echo "Ruta: $PROGRAMMIT_DIR/projects/"
echo

exit 0

__PROGRAMMIT_ARCHIVE_BELOW__
INSTALLER

cat "$WORK/payload.tar.gz" >> "$OUT"

chmod +x "$OUT"

echo "$OUT"
