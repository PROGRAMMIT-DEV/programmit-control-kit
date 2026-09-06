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

## SEMÁNTICA DE "IR ATRÁS / VOLVER ATRÁS"

Cuando el usuario diga "ir atrás", "volver atrás", "deshacer", "undo", "revertir" o equivalente:

1. El objetivo es volver al ESTADO FUNCIONAL inmediatamente anterior, no simplemente deshacer la última edición textual.
2. Identifica el último cambio FUNCIONAL realizado por ti en la tarea/sesión actual.
3. Ignora como objetivo de rollback cambios textuales equivalentes que no alteraron el comportamiento funcional.
   Ejemplo:
   - `<div className="mt-0">` → `<div>` normalmente sigue representando 0 margen.
   - Ese cambio cosmético/equivalente NO debe convertirse automáticamente en el estado funcional anterior.
4. Revierte únicamente el cambio funcional correspondiente.
5. Preserva todo cambio previo del usuario, de otras tareas o ya existente en el working tree.
6. NO usar git reset, git checkout ni restaurar archivos completos para revertir.
7. Si ese estado funcional había sido aplicado al runtime mediante build/restart/deploy/reload:
   - reproduce únicamente la secuencia necesaria para que el estado anterior vuelva a reflejarse realmente en el runtime.
8. Si no había sido aplicado al runtime:
   - no ejecutar build/restart innecesarios.
9. Verifica una sola vez.
10. Reporta brevemente:
   ESTADO ANTERIOR → REVERSIÓN → RUNTIME → PASS/ERROR.
11. DETENTE.

IMPORTANTE:
"ir atrás" significa ESTADO FUNCIONAL ANTERIOR.
No significa necesariamente "deshacer la última línea modificada".

Si no puedes determinar con seguridad cuál fue el estado funcional anterior:
NO inventes.
Reporta AMBIGUO y DETENTE.

## SEMÁNTICA DE "IR ADELANTE"

Cuando el usuario diga "ir adelante", "rehacer", "redo", "volver a aplicar" o equivalente:

1. Reaplica el último ESTADO FUNCIONAL que fue deshecho mediante "ir atrás / volver atrás".
2. No reapliques simplemente una edición textual cosmética si no representaba un cambio funcional.
3. Reaplica exactamente el cambio funcional deshecho.
4. No inventes una solución nueva.
5. Preserva todos los cambios ajenos o anteriores.
6. NO usar git reset, git checkout ni restauraciones globales.
7. Si ese estado había sido aplicado al runtime:
   - vuelve a ejecutar únicamente la secuencia necesaria para reflejarlo realmente en el runtime.
8. Verifica una sola vez.
9. Reporta brevemente:
   ESTADO REHECHO → RUNTIME → PASS/ERROR.
10. DETENTE.

Si no existe un estado funcional previamente deshecho:
reporta NADA QUE REHACER y DETENTE.

## VERIFICACIÓN DE RUNTIME

BUILD PASS NO significa RUNTIME PASS.

Cuando un cambio deba reflejarse en un servicio actualmente ejecutándose:

1. Ejecutar build UNA vez.
2. Si build PASS, reiniciar SOLO el servicio correspondiente.
3. Esperar readiness breve si corresponde.
4. Confirmar que el servicio está ACTIVE.
5. Confirmar health local HTTP 200 cuando exista endpoint de health.
6. Solo después declarar PASS.

Para Marketplace PROGRAMMIT:
npm run build
systemctl restart programmit-marketplace-stable.service
sleep 2
systemctl is-active programmit-marketplace-stable.service
curl -fsS http://127.0.0.1:3102/api/health >/dev/null

Si build pasa pero restart/health no fue comprobado:
reportar FALTA o ERROR, nunca PASS.

Esta misma regla aplica a:
- ir atrás
- ir adelante
- cambios normales
- reparaciones
- deploy/reload equivalentes

Nunca dejar un build nuevo servido por un proceso antiguo.

## UNDO/REDO DETERMINÍSTICO V2

STATE no debe intercambiar ni reinterpretar estados.

Modelo canónico:
- transition.before = estado funcional anterior, INMUTABLE
- transition.after = cambio funcional corregido, INMUTABLE
- active = "before" o "after"
- file = archivo exacto
- line_hint = línea aproximada

IR ATRÁS:
- solo permitido si active == "after"
- modificar EXCLUSIVAMENTE STATE.file
- reemplazar transition.after → transition.before
- después establecer active = "before"

IR ADELANTE:
- solo permitido si active == "before"
- modificar EXCLUSIVAMENTE STATE.file
- reemplazar transition.before → transition.after
- después establecer active = "after"

PROHIBIDO:
- intercambiar before/after
- buscar otro archivo
- Glob
- búsqueda global
- git diff global
- adivinar rutas
- modificar archivos no registrados en STATE
- declarar PASS si el reemplazo exacto no ocurrió

Después de cambio destinado al runtime:
CAMBIO
→ BUILD
→ RESTART
→ SERVICE ACTIVE
→ HEALTH 200
→ BRAIN SILENCIOSO
→ RESPUESTA FINAL

Si cualquier paso falla:
ERROR y STOP.

Respuesta premium de una línea:

IR ATRÁS:
↩️ ATRÁS — Archivo:Línea | cambio | build PASS | service ACTIVE | health 200

IR ADELANTE:
↪️ ADELANTE — Archivo:Línea | cambio | build PASS | service ACTIVE | health 200

## TARGET EXACTO PARA UNDO/REDO

Cuando STATE.json contenga target/transition:

- Modificar SOLO STATE.files[0].
- El target es obligatorio y exacto.
- NO seleccionar una clase por coincidencia genérica.
- NO tocar otro mt-3/mt-0 del mismo archivo.
- NO usar Glob, búsqueda global, git log ni archivos alternativos.

Para localizar el cambio:
1. usar STATE.target.component;
2. usar STATE.target.line_hint solo como referencia;
3. confirmar que transition.before/after está en el wrapper INMEDIATO del componente indicado.

Si existen varias coincidencias y no se puede demostrar cuál es el target:
❌ ERROR y STOP.

transition.before y transition.after son INMUTABLES.
Solo cambia STATE.active:
- ir atrás: after → before
- ir adelante: before → after

Si cualquier comando Brain devuelve exit code != 0:
❌ ERROR y prohibido declarar PASS.
