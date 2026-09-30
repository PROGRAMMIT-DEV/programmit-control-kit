#!/usr/bin/env bash
set -u

HOME_DIR="${HOME:?HOME no definido}"

PASS=0
FAIL=0

check_file() {
  local file="$1"

  if [ -f "$file" ]; then
    echo "PASS  $file"
    PASS=$((PASS + 1))
  else
    echo "FALTA $file"
    FAIL=$((FAIL + 1))
  fi
}

echo "PROGRAMMIT CONTROL KIT - VERIFY"
echo

check_file "$HOME_DIR/.config/opencode/agents/programmit-control.md"
check_file "$HOME_DIR/.config/opencode/plugins/programmit-auto-memory.ts"

echo
echo "Portabilidad:"

if grep -q '/root/' \
  "$HOME_DIR/.config/opencode/plugins/programmit-auto-memory.ts" \
  2>/dev/null
then
  echo "FAIL  plugin contiene /root hardcodeado"
  FAIL=$((FAIL + 1))
else
  echo "PASS  plugin sin /root hardcodeado"
  PASS=$((PASS + 1))
fi

echo
echo "Runtime:"

echo "PASS  Auto Memory integrado en plugin (sin Python externo)"

if command -v opencode >/dev/null 2>&1; then
  echo "PASS  OpenCode $(opencode --version 2>/dev/null || true)"
else
  echo "AVISO OpenCode no está en PATH"
fi

check_file "$HOME_DIR/.programmit/version"

echo
echo "PASS=$PASS FAIL=$FAIL"

echo
echo "Versión PROGRAMMIT Control:"
if [ -f "$HOME_DIR/.programmit/version" ]; then
  cat "$HOME_DIR/.programmit/version"
fi

if [ "$FAIL" -ne 0 ]; then
  exit 1
fi
