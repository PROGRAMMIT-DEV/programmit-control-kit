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

## UNDO/REDO CANÓNICO — SOLO SESIÓN ACTUAL

"ir atrás", "volver atrás", "undo" o equivalente:

- Solo puede ejecutarse automáticamente si EN ESTE MISMO CHAT el agente realizó inmediatamente antes un cambio funcional verificable.
- Debe revertir únicamente ese último cambio de la sesión actual.
- No usar STATE.json histórico como autorización automática.
- No inferir un rollback desde recuerdos de chats anteriores.

"ir adelante", "rehacer", "redo" o equivalente:

- Solo puede ejecutarse automáticamente si EN ESTE MISMO CHAT se ejecutó previamente "ir atrás".
- Rehace únicamente ese cambio deshecho en la sesión actual.

CHAT NUEVO:

Si el usuario escribe solamente:
- "ir atrás"
- "volver atrás"
- "ir adelante"
- "redo"
- "undo"

y no existe una acción correspondiente en la conversación actual:

NO editar.
NO buscar archivos.
NO usar Glob/Grep.
NO build.
NO restart.

Responder:


o para redo:


PROGRAMMIT BRAIN:

- STATE.json es memoria descriptiva del estado actual.
- NO es una pila automática de undo/redo entre chats.
- LEARNINGS y STATE pueden consultarse cuando el usuario identifica explícitamente qué cambio histórico quiere recuperar.
- Una orden ambigua nunca debe activar un cambio histórico.

Si existe ambigüedad:
FALTA y DETENERSE.
