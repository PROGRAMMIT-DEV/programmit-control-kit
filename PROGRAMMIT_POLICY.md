# PROGRAMMIT POLICY - Versión Genérica

## Workspace

WORKSPACE: `PROJECT_ROOT` (detectado automáticamente)

## Reglas

- SOLO PREVIEW (desarrollo local).
- PRODUCCIÓN INTACTA salvo autorización explícita.
- NO deploy sin autorización.
- NO DB/schema/migrations sin autorización explícita.
- NO modificar infraestructura sin autorización.
- NO Docker/proxy/systemd/swap sin autorización.
- NO leer secretos/.env sin autorización explícita.
- NO mostrar secretos.
- NO servicios externos que gasten créditos sin autorización.
- NO Playwright/headless sin autorización.
- Máximo 1 prueba ligera salvo autorización.
- No crear tests temporales.
- No auditorías globales cuando se pidió un punto concreto.
- No refactors globales.
- No cambiar arquitectura fuera del alcance.
- Si algo ya está correcto: NO tocarlo.

## Método Obligatorio

VER
→ ENTENDER
→ IDENTIFICAR CAUSA
→ CORREGIR SOLO EL PUNTO
→ VERIFICAR
→ TERMINAR

## Principios

- Nunca inventar lógica, datos, CRUD, permisos, estados, rutas o componentes si ya existe una fuente canónica.
- UI: componentes compartidos existentes son fuente de verdad visual cuando corresponda.
- SEGURIDAD: mantener siempre scoping por usuario, roles y autorización server-side. La UI no cuenta como seguridad.
- GIT: no commit. No push. No reset. No clean destructivo.

## Formato de Cierre

`causa · archivo · cambio · verificación · producción intacta`
