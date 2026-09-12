# KERNEL DE DISCIPLINA DE EJECUCIÓN

Referencia secundaria. Las reglas críticas están en `<critical-execution>` de cada agente.

<execution-kernel>

1. UN PROBLEMA A LA VEZ
Si una tarea contiene varios bugs:
resolverlos secuencialmente.
No investigar dos causas en paralelo.

2. CICLO MÁXIMO DE DIAGNÓSTICO
Por bug:

A. localizar entrypoint/fuente;
B. formular máximo 3 hipótesis concretas;
C. ejecutar una comprobación que pueda confirmar o descartar cada hipótesis;
D. editar solo al encontrar evidencia.

No generar hipótesis abiertas indefinidamente.

3. REGISTRO DE HIPÓTESIS (uso interno)
Mantener internamente durante la tarea:

CONFIRMADO:
- ...

DESCARTADO:
- ...

PENDIENTE:
- ...

Una hipótesis en DESCARTADO NO puede volver a investigarse salvo evidencia nueva que la contradiga.
NO imprimir este registro al usuario.

4. RESOLVER RUTA ANTES DE READ

Si no se conoce la ubicación exacta de un archivo:
PRIMERA operación = glob/grep de localización.

PROHIBIDO intentar rutas por intuición como:
`src/app/...`
`src/components/...`

Una vez localizada la ruta canónica:
leer únicamente esa.

5. SECUENCIA PREFERIDA DE DIAGNÓSTICO

1. localizar
2. leer entrypoint
3. localizar productor/consumidor del dato
4. leer bloque relevante
5. comprobación decisiva

Al llegar a tool 5:
OBLIGATORIO elegir:
- CAUSA CONFIRMADA → cambio mínimo
o
- FALTA EVIDENCIA → STOP

6. VALIDACIÓN PROPORCIONAL

Sin build solicitado:
usar únicamente:
- referencia/imports;
- diff puntual;
- `git diff --check` cuando corresponda.

No convertir una tarea pequeña en auditoría.

7. STOP OBLIGATORIO

Cuando:
- causa identificada;
- cambio mínimo aplicado;
- validación solicitada completada;

DETENERSE.

No revisar "una cosa más".

8. RESTICCIONES PROGRAMMIT

Marketplace:
`/srv/programmit/marketplace`

Runtime:
`127.0.0.1:3102`

Servicio:
`programmit-marketplace-stable.service`

Si la tanda dice NO BUILD:
NO build
NO restart
NO health
sin excepciones.

9. TERMINAL GATE

A. Cada validación final se ejecuta MÁXIMO UNA VEZ.
B. Para `git diff --check`: salida vacía = PASS DEFINITIVO. NO repetir.
C. Una vez emitido el reporte final: PROHIBIDO cualquier tool call posterior.
D. En cuanto se alcanza `Estado: ... PASS` → RESPONDER → TERMINAR.
E. `git diff --stat` no es una segunda validación. No ejecutar después de PASS salvo petición explícita.
F. Si el agente detecta que entró en loop: STOP INMEDIATO. NO usar otra tool para confirmar que debe detenerse.

10. MODELO CAPAZ

"Do not overconstrain competent model reasoning."
Si el modelo identifica causa real, compara A/B correctamente, encuentra source→consumer, o propone fix mínimo:
el agente NO debe forzar pasos redundantes.
Las policies actúan como guardrails, no como un segundo razonador.

</execution-kernel>
