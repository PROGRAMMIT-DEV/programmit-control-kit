#!/bin/bash

# Programmit Control Kit Installer
# Uso: ./install.sh /ruta/proyecto

set -e

KIT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="${1:-.}"

if [ ! -d "$PROJECT_DIR" ]; then
    echo "❌ Error: Directorio del proyecto no existe: $PROJECT_DIR"
    exit 1
fi

echo "🔧 Instalando Programmit Control Kit en: $PROJECT_DIR"

# Crear backup si existe configuración OpenCode
BACKUP_DIR=""
if [ -d "$PROJECT_DIR/.opencode" ]; then
    BACKUP_DIR="$PROJECT_DIR/.opencode.backup.$(date +%Y%m%d_%H%M%S)"
    echo "📦 Respaldando configuración existente en: $BACKUP_DIR"
    cp -r "$PROJECT_DIR/.opencode" "$BACKUP_DIR"
fi

# Crear directorios objetivo
mkdir -p "$PROJECT_DIR/.opencode/agents"
mkdir -p "$PROJECT_DIR/.opencode/skills"

# Copiar agentes
echo "📋 Copiando agentes..."
cp -r "$KIT_DIR/.opencode/agents/"* "$PROJECT_DIR/.opencode/agents/"

# Copiar skills
echo "📋 Copiando skills..."
if [ -d "$KIT_DIR/skills" ] && [ -n "$(find "$KIT_DIR/skills" -mindepth 1 -maxdepth 1 -print -quit)" ]; then
  cp -r "$KIT_DIR/skills/." "$PROJECT_DIR/.opencode/skills/"
fi

# Copiar KNOWLEDGE.md
if [ -f "$KIT_DIR/KNOWLEDGE.md" ]; then
    echo "📋 Copiando KNOWLEDGE.md..."
    cp "$KIT_DIR/KNOWLEDGE.md" "$PROJECT_DIR/.opencode/"
fi

# Copiar PROGRAMMIT_POLICY.md
if [ -f "$KIT_DIR/PROGRAMMIT_POLICY.md" ]; then
    echo "📋 Copiando PROGRAMMIT_POLICY.md..."
    cp "$KIT_DIR/PROGRAMMIT_POLICY.md" "$PROJECT_DIR/.opencode/"
fi


# PROGRAMMIT BRAIN INSTALL
echo "🧠 Instalando Programmit Brain..."
BRAIN_TEMPLATE="$KIT_DIR/brain-template"
BRAIN_DIR="$PROJECT_DIR/.programmit"

mkdir -p "$BRAIN_DIR"

if [ -d "$BRAIN_TEMPLATE" ]; then
    for SRC in "$BRAIN_TEMPLATE"/*; do
        [ -e "$SRC" ] || continue

        NAME="$(basename "$SRC")"
        DST="$BRAIN_DIR/$NAME"

        # La memoria existente del proyecto es canónica:
        # crear SOLO archivos faltantes, nunca sobrescribir.
        if [ ! -e "$DST" ]; then
            if [ -d "$SRC" ]; then
                cp -r "$SRC" "$DST"
            else
                cp "$SRC" "$DST"
            fi
            echo "   + $NAME"
        else
            if [ -d "$SRC" ] && [ -d "$DST" ]; then
                cp -rn "$SRC/." "$DST/"
            fi
            echo "   = $NAME preservado"
        fi
    done
fi
# END PROGRAMMIT BRAIN INSTALL


# Merge seguro de configuración
CONFIG_FILE="opencode.json"
if [ -f "$KIT_DIR/$CONFIG_FILE" ]; then
    echo "🔧 Fusionando configuración..."
    
    if [ -f "$PROJECT_DIR/$CONFIG_FILE" ]; then
        # Backup del archivo existente
        cp "$PROJECT_DIR/$CONFIG_FILE" "$PROJECT_DIR/$CONFIG_FILE.backup.$(date +%Y%m%d_%H%M%S)"
        
        # Usar Python para merge seguro
        python3 << PYTHON_SCRIPT
import json
import sys

def merge_configs(existing, kit):
    """Fusiona configuraciones preservando el existente y aplicando el kit."""
    result = existing.copy()
    
    # Preservar provider existente
    if "provider" in existing:
        result["provider"] = existing["provider"]
    
    # Aplicar/actualizar configuración portable del kit
    if "permission" in kit:
        result["permission"] = kit["permission"]

    if "default_agent" in kit:
        result["default_agent"] = kit["default_agent"]
    
    # Preservar otras claves top-level existentes
    for key in existing:
        if key not in result:
            result[key] = existing[key]
    
    return result

try:
    with open("$PROJECT_DIR/$CONFIG_FILE", "r") as f:
        existing = json.load(f)
    
    with open("$KIT_DIR/$CONFIG_FILE", "r") as f:
        kit = json.load(f)
    
    merged = merge_configs(existing, kit)
    
    with open("$PROJECT_DIR/$CONFIG_FILE", "w") as f:
        json.dump(merged, f, indent=2)
    
    print("✅ Configuración fusionada correctamente")
except Exception as e:
    print(f"❌ Error al fusionar configuración: {e}")
    sys.exit(1)
PYTHON_SCRIPT
    else
        # No existe, copiar directamente
        cp "$KIT_DIR/$CONFIG_FILE" "$PROJECT_DIR/"
        echo "📋 Configuración instalada (nueva)"
    fi
fi

echo "✅ Programmit Control Kit instalado exitosamente!"
echo ""
echo "📁 Componentes instalados:"
echo "   - Agentes: $(ls "$PROJECT_DIR/.opencode/agents/" | wc -l) archivos"
echo "   - Skills: $(find "$PROJECT_DIR/.opencode/skills" -mindepth 1 -maxdepth 1 | wc -l) directorios"
echo ""
echo "Para personalizar, edita archivos en: $PROJECT_DIR/.opencode/"
