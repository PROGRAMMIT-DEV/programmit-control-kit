# KNOWLEDGE.md - Metodología General

## Metodología de Trabajo

1. **OBSERVAR** → entender el problema real.
2. **EJECUTAR** → cambio mínimo necesario.
3. **PROBAR** → verificar que funciona.
4. **CORREGIR** → si falla, analizar causa real.
5. **CONTINUAR** → solo si PASS.

## Reglas de Ejecución

- Máximo 1 intento antes de analizar causa real.
- Si falla 2 veces con mismo error: STOP y reportar.
- Nunca reintentar sin cambio real.
- Leer solo archivos relevantes.
- Cambio mínimo, no refactor incidental.

## Errores ya Aprendidos

- **Loop infinito**: reintentar sin cambio real → STOP.
- **Scope creep**: cambiar cosas no solicitadas → volver al alcance.
- **Build repetido**: sin cambio de código → innecesario.
- **Lectura excesiva**: leer archivos completos → leer fragmentos relevantes.
- **Narración innecesaria**: explicar proceso → ejecutar y reportar resultado.

## Patrones de Debugging

1. Identificar error real (no asumir).
2. Buscar causa raíz (no parchear síntomas).
3. Aplicar UNA corrección.
4. Probar UNA vez.
5. Si PASS → continuar. Si FAIL → STOP.

## UI

- Reutilizar componentes existentes.
- No inventar design system.
- Seguir tokens de theme existentes.
- Mantener consistencia visual.

## Consolidación de Código

- Evitar duplicados: buscar funciones similares antes de crear nueva.
- Reutilizar servicios/repositorios existentes.
- No crear parches: corregir desde raíz.

## Manejo de Procesos/Loops

- Nunca iniciar procesos sin verificación previa.
- Verificar estado antes de ejecutar.
- Si un proceso falla 2 veces: STOP.

## Build/Restart/Verificación Única

- Build solo al final, después de cambios.
- Restart solo si es estrictamente necesario.
- Verificación: 1 sola vez después de cambios.

## Lecciones Útiles Generales

- La simplicidad sobre la complejidad.
- Lo mínimo necesario sobre lo óptimo.
- Lo que funciona sobre lo perfecto.
- Documentar solo lo esencial.
