# Comandos APRENDE para Agentes

## Palabras Clave

- `APRENDE AGENTES: <regla>` → Aplica a Programmit-Control + Flash
- `APRENDE CONTROL: <regla>` → Solo a Programmit-Control
- `APRENDE FLASH: <regla>` → Solo a Flash

## Uso

```bash
# Ejemplo 1: Regla para ambos agentes
echo "APRENDE AGENTES: Siempre verificar permisos antes de ejecutar comandos bash" | bash learn-agents.sh

# Ejemplo 2: Regla solo para Programmit-Control
echo "APRENDE CONTROL: Nunca modificar archivos de configuración del kit sin autorización explícita" | bash learn-agents.sh

# Ejemplo 3: Regla solo para Flash
echo "APRENDE FLASH: Priorizar correcciones mínimas sobre reescrituras completas" | bash learn-agents.sh
```

## Comportamiento

1. **Persistencia**: Las reglas se guardan permanentemente en los archivos de agentes.
2. **Deduplicación**: Si una regla equivalente ya existe, no se duplica.
3. **Conflictos**: Si una regla nueva reemplaza una anterior, se actualiza la canónica.
4. **Supervivencia**: Las reglas sobreviven nuevas sesiones de OpenCode.
5. **Sin Brain nuevo**: Se usa el mecanismo de aprendizaje existente.

## Archivos Modificados

- `/srv/programmit/programmit-control-kit/.opencode/agents/programmit-control.md`
- `/srv/programmit/programmit-control-kit/.opencode/agents/programmit-fast.md`
- `/srv/programmit/marketplace/.opencode/agents/programmit-control.md`
- `/srv/programmit/marketplace/.opencode/agents/programmit-fast.md`

## Formato de Regla

Las reglas se añaden en la sección "REGLAS APRENDIDAS" de cada archivo:

```markdown
## REGLAS APRENDIDAS

- [REGLA] (fuente: APRENDE AGENTES/CONTROL/FLASH, fecha: YYYY-MM-DD)
```