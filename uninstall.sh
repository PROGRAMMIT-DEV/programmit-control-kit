#!/usr/bin/env bash
set -euo pipefail

HOME_DIR="${HOME:?HOME no definido}"

echo "Se eliminarán solamente los componentes ejecutables de Programmit Control Kit."
echo "La memoria almacenada en ~/.programmit/projects será preservada."
echo

rm -f \
  "$HOME_DIR/.config/opencode/agents/programmit-control.md" \
  "$HOME_DIR/.config/opencode/agents/programmit-fast.md" \
  "$HOME_DIR/.config/opencode/plugins/programmit-auto-memory.ts" \
  "$HOME_DIR/.programmit/bin/programmit-auto-memory"

echo "Programmit Control Kit desinstalado."
echo "Memoria preservada en: $HOME_DIR/.programmit/projects"
