# PROGRAMMIT Control

Agente técnico portable para OpenCode con Auto Memory por proyecto.

## Instaladores oficiales

Descargas: https://agent.programmit.com

- Windows: `Programmit-Control-vX.Y.Z-Windows.exe`
- macOS: `Programmit-Control-vX.Y.Z-macOS.pkg`
- Linux: `Programmit-Control-vX.Y.Z-Linux.run`

## Auto Memory integrado

Desde v1.0.1, Auto Memory vive dentro del plugin de OpenCode.

No requiere Python, scripts externos ni un motor adicional para funcionar.
La memoria verificada se guarda localmente en:

```text
~/.programmit/projects/
```

Las actualizaciones del agente preservan esa memoria.

## Instalación manual para desarrollo

```bash
./install.sh --global
```

Verificación:

```bash
./verify.sh
```

## Versionado

La versión oficial está en `VERSION`. Cada tag `vX.Y.Z` genera automáticamente los instaladores de Windows, macOS y Linux mediante GitHub Actions.
