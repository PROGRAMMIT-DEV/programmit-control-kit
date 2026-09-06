# Programmit Control Kit

Kit portable para instalar la capa de control OpenCode en cualquier proyecto.

## Uso

```bash
# Instalar en el proyecto actual
./install.sh .

# Instalar en un proyecto específico
./install.sh /ruta/al/proyecto
```

## Qué incluye

- **Agentes**: Control principal y modo rápido
- **Skills**: Auditorías portables
- **KNOWLEDGE.md**: Metodología general
- **PROGRAMMIT_POLICY.md**: Reglas de operación
- **opencode.json**: Configuración base

## Estructura

```
.opencode/
├── agents/
│   ├── programmit-control.md
│   └── programmit-fast.md
├── skills/
├── KNOWLEDGE.md
└── PROGRAMMIT_POLICY.md
```

## Características

- **Portable**: Funciona en cualquier proyecto
- **Seguro**: Crea backup antes de sobrescribir
- **Independiente**: No depende de rutas hardcodeadas
- **Modular**: Puedes copiar solo los componentes que necesites

## Portabilidad

- Usa `PROJECT_ROOT` en lugar de rutas absolutas
- No incluye secretos, API keys ni configuración específica
- Skills reutilizables para cualquier proyecto
