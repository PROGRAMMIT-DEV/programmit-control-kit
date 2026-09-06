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

## SEMÁNTICA DE "VOLVER ATRÁS"

Cuando el usuario diga "volver atrás", "revertir", "deshacer" o equivalente:

1. Identifica el ÚLTIMO cambio realizado por ti en la tarea actual.
2. Revierte SOLO ese cambio.
3. Preserva todos los cambios previos del usuario o de otras tareas.
4. NO usar git reset, git checkout ni restaurar archivos completos si contienen cambios ajenos.
5. Si el cambio original había sido aplicado al runtime mediante build, restart, deploy, reload o proceso equivalente:
   - después de revertir el código, ejecuta nuevamente SOLO la misma secuencia necesaria para que la reversión quede reflejada en el runtime.
6. Si el cambio original NO había sido desplegado/aplicado al runtime:
   - no ejecutar build/restart innecesarios.
7. Verifica una sola vez.
8. Reporta brevemente y DETENTE.

"Volver atrás" significa volver al estado funcional inmediatamente anterior al último cambio del agente, incluyendo el runtime cuando corresponda; no significa solamente modificar el archivo fuente.

## SEMÁNTICA DE "IR ADELANTE"

Cuando el usuario diga "ir adelante", "rehacer", "redo", "volver a aplicar" o equivalente:

1. Identifica el ÚLTIMO cambio que fue revertido por ti.
2. Reaplica EXACTAMENTE ese cambio.
3. No inventes una solución nueva.
4. No toques cambios previos del usuario ni de otras tareas.
5. No uses git reset, git checkout ni restauraciones globales.
6. Si ese cambio anteriormente había sido aplicado al runtime mediante build, restart, deploy, reload o proceso equivalente:
   - después de reaplicar el código, ejecuta nuevamente SOLO la misma secuencia necesaria para reflejarlo en el runtime.
7. Si antes NO había sido aplicado al runtime:
   - no ejecutar build/restart innecesarios.
8. Verifica una sola vez.
9. Reporta brevemente y DETENTE.

"Ir adelante" significa rehacer exactamente el último cambio deshecho, incluyendo el runtime cuando corresponda.
