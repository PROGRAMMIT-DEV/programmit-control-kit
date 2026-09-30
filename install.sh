#!/usr/bin/env bash
set -euo pipefail

KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
VERSION_FILE="$KIT_DIR/VERSION"

if [ ! -f "$VERSION_FILE" ]; then
  echo "ERROR: falta archivo VERSION" >&2
  exit 1
fi

VERSION="$(tr -d '[:space:]' < "$VERSION_FILE")"

usage() {
  cat <<'TXT'
Programmit Control Kit

Uso:

  ./install.sh --global
      Instala Programmit-Control globalmente para el usuario actual.

  ./install.sh /ruta/proyecto
      Instala la configuración portable dentro de un proyecto.

  ./install.sh .
      Instala en el proyecto actual.
TXT
}

backup_file() {
  local src="$1"

  if [ -e "$src" ]; then
    local backup="${src}.backup.$(date +%Y%m%d_%H%M%S)"
    cp -a "$src" "$backup"
    echo "Backup: $backup"
  fi
}

install_global() {
  local HOME_DIR="${HOME:?HOME no definido}"

  local OC_DIR="$HOME_DIR/.config/opencode"
  local AGENT_DIR="$OC_DIR/agents"
  local PLUGIN_DIR="$OC_DIR/plugins"
  local PROGRAMMIT_DIR="$HOME_DIR/.programmit"

  echo "Instalando Programmit Control Kit globalmente"
  echo "HOME: $HOME_DIR"

  mkdir -p "$AGENT_DIR"
  mkdir -p "$PLUGIN_DIR"

  chmod 700 "$PROGRAMMIT_DIR" || true

  if [ -f "$AGENT_DIR/programmit-control.md" ]; then
    backup_file "$AGENT_DIR/programmit-control.md"
  fi

  if [ -f "$PLUGIN_DIR/programmit-auto-memory.ts" ]; then
    backup_file "$PLUGIN_DIR/programmit-auto-memory.ts"
  fi

  cp \
    "$KIT_DIR/.opencode/agents/programmit-control.md" \
    "$AGENT_DIR/programmit-control.md"

  if [ -f "$KIT_DIR/.opencode/agents/programmit-fast.md" ]; then
    cp \
      "$KIT_DIR/.opencode/agents/programmit-fast.md" \
      "$AGENT_DIR/programmit-fast.md"
  fi

  cp \
    "$KIT_DIR/.opencode/plugins/programmit-auto-memory.ts" \
    "$PLUGIN_DIR/programmit-auto-memory.ts"

  chmod 600 "$AGENT_DIR/programmit-control.md"
  chmod 600 "$PLUGIN_DIR/programmit-auto-memory.ts"

  rm -f \
    "$PROGRAMMIT_DIR/bin/programmit-auto-memory" \
    "$PROGRAMMIT_DIR/bin/programmit-auto-memory.py" \
    "$PROGRAMMIT_DIR/bin/programmit-auto-memory.cmd" \
    "$PROGRAMMIT_DIR/bin/programmit-auto-memory.exe" 2>/dev/null || true

  printf '%s\n' "$VERSION" > "$PROGRAMMIT_DIR/version"
  chmod 600 "$PROGRAMMIT_DIR/version"

  echo
  echo "Instalación global completada."
  echo "Versión: $VERSION"
  echo
  echo "Agente:"
  echo "  $AGENT_DIR/programmit-control.md"
  echo
  echo "Plugin:"
  echo "  $PLUGIN_DIR/programmit-auto-memory.ts"
  echo
  echo "Auto Memory:"
  echo "  integrado en el plugin; no requiere Python ni motor externo."
}

install_project() {
  local PROJECT_DIR="$1"

  PROJECT_DIR="$(cd "$PROJECT_DIR" && pwd)"

  echo "Instalando Programmit Control Kit en:"
  echo "  $PROJECT_DIR"

  mkdir -p "$PROJECT_DIR/.opencode/agents"

  if [ -d "$PROJECT_DIR/.opencode" ]; then
    local BACKUP_DIR
    BACKUP_DIR="$PROJECT_DIR/.opencode.backup.$(date +%Y%m%d_%H%M%S)"

    cp -a "$PROJECT_DIR/.opencode" "$BACKUP_DIR"
    echo "Backup: $BACKUP_DIR"
  fi

  cp \
    "$KIT_DIR/.opencode/agents/programmit-control.md" \
    "$PROJECT_DIR/.opencode/agents/programmit-control.md"

  if [ -f "$KIT_DIR/.opencode/agents/programmit-fast.md" ]; then
    cp \
      "$KIT_DIR/.opencode/agents/programmit-fast.md" \
      "$PROJECT_DIR/.opencode/agents/programmit-fast.md"
  fi

  if [ -f "$KIT_DIR/KNOWLEDGE.md" ]; then
    cp "$KIT_DIR/KNOWLEDGE.md" "$PROJECT_DIR/.opencode/KNOWLEDGE.md"
  fi

  if [ -f "$KIT_DIR/PROGRAMMIT_POLICY.md" ]; then
    cp \
      "$KIT_DIR/PROGRAMMIT_POLICY.md" \
      "$PROJECT_DIR/.opencode/PROGRAMMIT_POLICY.md"
  fi

  # Instalar Programmit Brain por proyecto sin sobrescribir memoria existente
  local BRAIN_DIR="$PROJECT_DIR/.programmit"
  mkdir -p "$BRAIN_DIR"

  if [ -d "$KIT_DIR/brain-template" ]; then
    cp -rn "$KIT_DIR/brain-template/." "$BRAIN_DIR/"
    echo "Programmit Brain preparado en: $BRAIN_DIR"
  fi

  if [ -f "$KIT_DIR/opencode.json" ]; then
    if [ ! -f "$PROJECT_DIR/opencode.json" ]; then
      cp "$KIT_DIR/opencode.json" "$PROJECT_DIR/opencode.json"
    else
      echo "opencode.json existente preservado."
    fi
  fi

  echo
  echo "Instalación del proyecto completada."
}

case "${1:-}" in
  --global)
    install_global
    ;;
  -h|--help|"")
    usage
    exit 0
    ;;
  *)
    if [ ! -d "$1" ]; then
      echo "ERROR: directorio inexistente: $1" >&2
      exit 1
    fi

    install_project "$1"
    ;;
esac
