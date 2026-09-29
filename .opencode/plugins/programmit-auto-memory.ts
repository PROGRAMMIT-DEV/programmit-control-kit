import { createHash } from "node:crypto"
import { existsSync } from "node:fs"
import { join } from "node:path"
import { homedir } from "node:os"

const MEMORY_BIN = join(homedir(), ".programmit", "bin", "programmit-auto-memory")
const MAX_MEMORY_CHARS = 12000
const MAX_FACT_CHARS = 680

function looksLikeProject(directory: string) {
  return [
    ".git",
    "package.json",
    "pyproject.toml",
    "requirements.txt",
    "Cargo.toml",
    "go.mod",
    "composer.json",
  ].some((name) => existsSync(join(directory, name)))
}

function isProgrammitControl(agent?: string) {
  return Boolean(
    agent &&
      agent.toLowerCase().includes("programmit-control")
  )
}

function normalize(text: string) {
  return text
    .replace(/\r/g, "")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

function uncertain(text: string) {
  const value = text.toLowerCase()

  return [
    "falta evidencia",
    "no confirmado",
    "no se pudo confirmar",
    "no fue posible verificar",
    "posible causa",
    "hipótesis no confirmada",
  ].some((x) => value.includes(x))
}

function extractPath(text: string) {
  const matches = text.match(
    /(?:src|app|components|lib|prisma|server|pages|routes|api|infrastructure)\/[A-Za-z0-9_./()[\]@+-]+\.(?:ts|tsx|js|jsx|py|php|go|rs)/g
  )

  return matches?.[0] || ""
}

function slug(value: string) {
  return value
    .toLowerCase()
    .replace(/\.[a-z0-9]+$/i, "")
    .replace(/[^a-z0-9]+/g, ".")
    .replace(/^\.+|\.+$/g, "")
    .slice(0, 90)
}

function hash(value: string) {
  return createHash("sha256")
    .update(value.toLowerCase())
    .digest("hex")
    .slice(0, 12)
}

function section(text: string, name: string, next: string[]) {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
  const stops = next
    .map((x) => x.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
    .join("|")

  const regex = new RegExp(
    `(?:^|\\n)${escaped}\\s*\\n([\\s\\S]*?)(?=\\n(?:${stops})\\s*\\n|$)`,
    "i",
  )

  return normalize(text.match(regex)?.[1] || "")
}

function correctionFact(text: string) {
  if (!/CORRECCIÓN COMPLETADA/i.test(text)) return null

  const state = section(text, "ESTADO", [])

  if (!state) return null
  if (uncertain(text)) return null

  const cause = section(
    text,
    "CAUSA",
    ["CAMBIO", "ARCHIVOS", "VALIDACIÓN", "ESTADO"],
  )

  const change = section(
    text,
    "CAMBIO",
    ["ARCHIVOS", "VALIDACIÓN", "ESTADO"],
  )

  const files = section(
    text,
    "ARCHIVOS",
    ["VALIDACIÓN", "ESTADO"],
  )

  const validation = section(
    text,
    "VALIDACIÓN",
    ["ESTADO"],
  )

  if (!cause || !change) return null

  const strong =
    /RUNTIME PASS|AUTH PASS|VISUAL PASS/i.test(state)

  const codeOnly =
    /CODE PASS/i.test(state)

  if (!strong && !codeOnly) return null

  const category = strong ? "resolution" : "result"

  let value =
    `Nivel: ${state} | ` +
    `Problema/Causa: ${cause} | ` +
    `Cambio: ${change}`

  if (files) {
    value += ` | Archivos: ${files}`
  }

  if (validation) {
    value += ` | Verificación: ${validation}`
  }

  if (codeOnly) {
    value +=
      " | Nota: CODE PASS verifica código; no implica producción/runtime."
  }

  value = normalize(value).slice(0, MAX_FACT_CHARS)

  const file = extractPath(text)

  const key = file
    ? `${category}.${slug(file)}`
    : `${category}.final.${hash(value)}`

  return {
    category,
    key,
    value,
    source: "opencode:session-final",
  }
}

function auditFact(text: string) {
  const audit =
    /AUDITORÍA COMPLETADA/i.test(text) ||
    /RESULTADO AUDITORÍA/i.test(text)

  if (!audit) return null
  if (uncertain(text)) return null

  const result = section(
    text,
    "RESULTADO",
    ["HALLAZGOS", "RIESGO", "RECOMENDACIÓN", "ESTADO"],
  )

  const findings = section(
    text,
    "HALLAZGOS",
    ["RIESGO", "RECOMENDACIÓN", "ESTADO"],
  )

  const state = section(text, "ESTADO", [])

  const sourceText =
    result ||
    findings ||
    normalize(text).slice(0, 500)

  if (sourceText.length < 40) return null

  const file = extractPath(text)

  let value = normalize(
    [
      result && `Resultado: ${result}`,
      findings && `Hallazgos: ${findings}`,
      state && `Estado: ${state}`,
    ]
      .filter(Boolean)
      .join(" | "),
  )

  if (!value) {
    value = sourceText
  }

  value = value.slice(0, MAX_FACT_CHARS)

  const key = file
    ? `architecture.${slug(file)}`
    : `architecture.final.${hash(value)}`

  return {
    category: "architecture",
    key,
    value,
    source: "opencode:session-final",
  }
}

function generalVerifiedFact(text: string) {
  if (uncertain(text)) return null

  const confirmed =
    /confirmado|verificado|funcional|PASS/i.test(text)

  const file = extractPath(text)

  if (!confirmed || !file) return null

  const value = normalize(text).slice(0, MAX_FACT_CHARS)

  return {
    category: "architecture",
    key: `architecture.${slug(file)}`,
    value,
    source: "opencode:session-final",
  }
}

export const ProgrammitAutoMemory = async ({
  directory,
  $,
  client,
}: any) => {
  let projectRoot = directory
  let active = looksLikeProject(directory)
  let memory = ""

  const sessionAgents = new Map<string, string>()
  const savedMessageIDs = new Set<string>()

  try {
    const result =
      await $`git -C ${directory} rev-parse --show-toplevel`.quiet()

    const root = result.text().trim()

    if (root) {
      projectRoot = root
      active = true
    }
  } catch {
    // También funciona en proyectos sin Git.
  }

  async function refreshMemory() {
    if (!active) {
      memory = ""
      return
    }

    try {
      const result =
        await $`${MEMORY_BIN} context ${projectRoot}`.quiet()

      memory = result
        .text()
        .trim()
        .slice(0, MAX_MEMORY_CHARS)
    } catch {
      memory = ""
    }
  }

  async function saveFact(fact: {
    category: string
    key: string
    value: string
    source: string
  }) {
    try {
      await $`${MEMORY_BIN} learn ${fact.category} ${fact.key} ${fact.value} --source ${fact.source} --path ${projectRoot}`.quiet()

      await refreshMemory()
    } catch {
      // Auto Memory nunca debe romper la sesión.
    }
  }

  async function getMessages(sessionID: string) {
    try {
      const response =
        await client.session.messages({ path: { id: sessionID }, query: { limit: 30 } })

      if (Array.isArray(response?.data)) {
        return response.data
      }

      if (Array.isArray(response)) {
        return response
      }
    } catch {
      /*
       * Compatibilidad con otras formas del cliente generado.
       */
      try {
        const response =
          await client.session.messages({
            path: { id: sessionID },
            query: { limit: 30 },
          })

        if (Array.isArray(response?.data)) {
          return response.data
        }

        if (Array.isArray(response)) {
          return response
        }
      } catch {
        return []
      }
    }

    return []
  }

  async function learnFinal(sessionID: string) {
    if (!active) return

    const agent = sessionAgents.get(sessionID)

    if (!isProgrammitControl(agent)) return

    const messages = await getMessages(sessionID)

    const assistants = messages.filter(
      (item: any) =>
        item?.info?.role === "assistant",
    )

    if (assistants.length === 0) return

    const message = assistants[assistants.length - 1]

    const messageID =
      String(message?.info?.id || "")

    if (!messageID) return
    if (savedMessageIDs.has(messageID)) return

    /*
     * IMPORTANTE:
     * Solo el ÚLTIMO text part del mensaje final.
     * No reasoning.
     * No tools.
     * No textos intermedios.
     */
    const texts = (message?.parts || [])
      .filter(
        (part: any) =>
          part?.type === "text" &&
          typeof part?.text === "string" &&
          part.text.trim(),
      )
      .map((part: any) => part.text.trim())

    if (texts.length === 0) return

    const finalText = texts[texts.length - 1]

    if (finalText.length < 60) return

    const fact =
      correctionFact(finalText) ||
      auditFact(finalText) ||
      generalVerifiedFact(finalText)

    /*
     * Marcar como visto aunque no haya aprendizaje.
     * Así un mismo mensaje nunca se reprocesa.
     */
    savedMessageIDs.add(messageID)

    if (!fact) return

    await saveFact(fact)
  }

  await refreshMemory()

  return {
    "chat.message": async (
      input: {
        sessionID: string
        agent?: string
      },
      _output: any,
    ) => {
      if (input.sessionID && input.agent) {
        sessionAgents.set(
          input.sessionID,
          input.agent,
        )
      }
    },

    "experimental.chat.system.transform": async (
      input: {
        sessionID?: string
      },
      output: {
        system: string[]
      },
    ) => {
      if (!active || !input.sessionID) return

      const agent =
        sessionAgents.get(input.sessionID)

      if (!isProgrammitControl(agent)) return

      const context = `
<programmit-auto-memory>

MEMORIA VERIFICADA DEL PROYECTO:

${memory || "Sin memoria previa."}

Usa esta memoria únicamente para evitar redescubrir hechos verificados.

La evidencia actual tiene prioridad sobre cualquier recuerdo.

CODE PASS no equivale a RUNTIME/AUTH/VISUAL PASS.

La memoria nunca autoriza:
Git destructivo, DB, producción, infraestructura o secretos.

El aprendizaje se realiza automáticamente al FINAL del turno.
No ejecutes herramientas ni bloques especiales para guardar memoria.

</programmit-auto-memory>
      `.trim()

      if (output.system.length > 0) {
        output.system[0] =
          `${output.system[0]}\n\n${context}`
      } else {
        output.system.push(context)
      }
    },

    /*
     * YA NO guardamos desde experimental.text.complete.
     * text.complete ocurre varias veces durante un turno con tools.
     */

    event: async ({ event }: any) => {
      if (
        event?.type === "session.status" &&
        event?.properties?.status?.type === "idle"
      ) {
        const sessionID =
          event?.properties?.sessionID

        if (sessionID) {
          await learnFinal(sessionID)
        }

        return
      }

      /*
       * Fallback para versiones que aún emiten session.idle.
       * El messageID deduplica ambos eventos.
       */
      if (event?.type === "session.idle") {
        const sessionID =
          event?.properties?.sessionID

        if (sessionID) {
          await learnFinal(sessionID)
        }
      }
    },
  }
}
