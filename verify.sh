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
check_file "$HOME_DIR/.programmit/bin/programmit-auto-memory"

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

if command -v node >/dev/null 2>&1; then
  echo "PASS  Node $(node --version)"
else
  echo "FALTA Node"
  FAIL=$((FAIL + 1))
fi

if command -v python3 >/dev/null 2>&1; then
  echo "PASS  $(python3 --version)"
else
  echo "FALTA Python3"
  FAIL=$((FAIL + 1))
fi

if command -v opencode >/dev/null 2>&1; then
  echo "PASS  OpenCode $(opencode --version 2>/dev/null || true)"
else
  echo "AVISO OpenCode no está en PATH"
fi

echo
echo "PASS=$PASS FAIL=$FAIL"

if [ "$FAIL" -ne 0 ]; then
  exit 1
fi
