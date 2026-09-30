import { createHash } from "node:crypto"
import {
  appendFileSync,
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs"
import { execFileSync } from "node:child_process"
import { join } from "node:path"
import { homedir } from "node:os"

const BASE = join(homedir(), ".programmit")
const PROJECTS = join(BASE, "projects")
const MAX_MEMORY_CHARS = 12000
const MAX_FACT_CHARS = 680

type MemoryFact = {
  timestamp: string
  category: string
  key: string
  value: string
  source: string
  automatic: boolean
  verified: boolean
}

const CATEGORY_ORDER = [
  "architecture", "auth", "runtime", "dependency", "command",
  "workflow", "convention", "decision", "debugging",
  "resolution", "result", "other",
]

const CATEGORY_LABELS: Record<string, string> = {
  architecture: "Arquitectura",
  auth: "Autenticación",
  runtime: "Runtime",
  dependency: "Dependencias",
  command: "Comandos",
  workflow: "Workflows",
  convention: "Convenciones",
  decision: "Decisiones",
  debugging: "Debugging",
  resolution: "Resoluciones verificadas",
  result: "Resultados verificados",
  other: "Otros",
}

const SECRET_PATTERNS = [
  /\\bsk-[A-Za-z0-9_-]{12,}/,
  /\\bgh[pousr]_[A-Za-z0-9]{20,}/,
  /\\bAKIA[0-9A-Z]{16}\\b/,
  /Bearer\\s+[A-Za-z0-9._~-]{10,}/i,
  /-----BEGIN .*PRIVATE KEY-----/i,
  /(password|passwd|api[_ -]?key|secret|access[_ -]?token)\\s*[:=]\\s*\\S+/i,
]

const BLOCKED_SOURCE_PARTS = [
  ".env", "secret", "secrets", "credential", "credentials",
  "private-key", "private_key",
]

function sanitizeRemote(remote: string) {
  const value = (remote || "").trim()
  if (!value) return ""

  if (value.startsWith("http://") || value.startsWith("https://")) {
    try {
      const parsed = new URL(value)
      parsed.username = ""
      parsed.password = ""
      parsed.search = ""
      parsed.hash = ""
      return parsed.toString().replace(/\\/$/, "")
    } catch {
      return ""
    }
  }

  if (/^[A-Za-z0-9._-]+@[A-Za-z0-9._-]+:/.test(value)) return value
  return ""
}

function projectSlug(value: string) {
  const cleaned = value.trim().toLowerCase()
    .replace(/\\.git$/i, "")
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^[-._]+|[-._]+$/g, "")
  return cleaned || "project"
}

function readEvents(directory: string): MemoryFact[] {
  const path = join(directory, "FACTS.jsonl")
  if (!existsSync(path)) return []
  const events: MemoryFact[] = []

  for (const raw of readFileSync(path, "utf8").split(/\\r?\\n/)) {
    const line = raw.trim()
    if (!line) continue
    try {
      const obj = JSON.parse(line)
      if (obj && typeof obj === "object") events.push(obj as MemoryFact)
    } catch {}
  }
  return events
}

function latestFacts(directory: string) {
  const latest = new Map<string, MemoryFact>()
  for (const event of readEvents(directory)) {
    if (event.key) latest.set(event.key, event)
  }
  return latest
}

function containsSecret(value: string) {
  return SECRET_PATTERNS.some((pattern) => pattern.test(String(value)))
}

function blockedSource(source: string) {
  const low = String(source || "").toLowerCase()
  return BLOCKED_SOURCE_PARTS.some((part) => low.includes(part))
}

function appendFactLocal(
  directory: string,
  fact: { category: string; key: string; value: string; source?: string; automatic?: boolean },
) {
  const category = fact.category.trim().toLowerCase()
  const key = fact.key.trim()
  const value = normalize(String(fact.value)).slice(0, 700)
  const source = String(fact.source || "").trim().slice(0, 300)

  if (!category || !key || !value) return false
  if (containsSecret(key) || containsSecret(value) || blockedSource(source)) return false

  mkdirSync(directory, { recursive: true })
  const current = latestFacts(directory).get(key)
  if (current && current.category === category && current.value === value) return false

  const event: MemoryFact = {
    timestamp: new Date().toISOString(),
    category, key, value, source,
    automatic: Boolean(fact.automatic),
    verified: true,
  }

  appendFileSync(join(directory, "FACTS.jsonl"), JSON.stringify(event) + "\\n", "utf8")
  return true
}

function detectProjectFacts(root: string) {
  const detected: Array<{ category: string; key: string; value: string; source: string }> = []
  let manager = ""

  if (existsSync(join(root, "pnpm-lock.yaml"))) manager = "pnpm"
  else if (existsSync(join(root, "yarn.lock"))) manager = "yarn"
  else if (existsSync(join(root, "bun.lock")) || existsSync(join(root, "bun.lockb"))) manager = "bun"
  else if (existsSync(join(root, "package-lock.json"))) manager = "npm"

  if (manager) detected.push({ category: "dependency", key: "project.package_manager", value: manager, source: "auto:init" })

  const packagePath = join(root, "package.json")
  if (existsSync(packagePath)) {
    try {
      const pkg = JSON.parse(readFileSync(packagePath, "utf8"))
      if (typeof pkg?.name === "string" && pkg.name) {
        detected.push({ category: "architecture", key: "project.name", value: pkg.name.slice(0, 200), source: "package.json" })
      }

      const deps = { ...(pkg?.dependencies || {}), ...(pkg?.devDependencies || {}) }
      const frameworks: Record<string, string> = {
        next: "Next.js", react: "React", vue: "Vue", nuxt: "Nuxt",
        svelte: "Svelte", "@prisma/client": "Prisma", "next-auth": "NextAuth", typescript: "TypeScript",
      }
      const found = Object.entries(frameworks).filter(([key]) => key in deps).map(([, label]) => label)
      if (found.length) {
        detected.push({ category: "architecture", key: "project.stack", value: [...new Set(found)].sort().join(", "), source: "package.json" })
      }

      if (manager && pkg?.scripts && typeof pkg.scripts === "object") {
        const prefix: Record<string, string> = { npm: "npm run", pnpm: "pnpm", yarn: "yarn", bun: "bun run" }
        for (const script of ["build", "test", "lint", "typecheck", "verify"]) {
          if (script in pkg.scripts) {
            detected.push({ category: "command", key: "command." + script, value: prefix[manager] + " " + script, source: "package.json" })
          }
        }
      }
    } catch {}
  }

  const markers: Array<[string, string]> = [
    ["pyproject.toml", "Python"], ["requirements.txt", "Python"],
    ["Cargo.toml", "Rust"], ["go.mod", "Go"], ["composer.json", "PHP"],
  ]
  const languages = markers.filter(([file]) => existsSync(join(root, file))).map(([, language]) => language)
  if (languages.length) {
    detected.push({ category: "architecture", key: "project.languages", value: [...new Set(languages)].sort().join(", "), source: "auto:init" })
  }

  return detected
}

function rebuildMemory(root: string, projectName: string, digest: string, directory: string) {
  const facts = [...latestFacts(directory).values()]
    .sort((a, b) => String(b.timestamp).localeCompare(String(a.timestamp)))
    .slice(0, 100)
  const groups = new Map<string, MemoryFact[]>()

  for (const fact of facts) {
    const group = groups.get(fact.category) || []
    group.push(fact)
    groups.set(fact.category, group)
  }

  const lines = [
    "# PROGRAMMIT AUTO MEMORY", "",
    "Project: " + projectName,
    "Project ID: " + digest,
    "Root: " + root, "",
    "Memoria verificada reutilizable.",
    "No es autorización para acciones destructivas o de producción.", ""
  ]

  for (const category of CATEGORY_ORDER) {
    const items = groups.get(category) || []
    if (!items.length) continue
    lines.push("## " + (CATEGORY_LABELS[category] || category), "")
    for (const item of items.sort((a, b) => a.key.localeCompare(b.key))) {
      let line = "- **" + item.key + "**: " + item.value
      if (item.source) line += " _(fuente: " + item.source + ")_"
      lines.push(line)
    }
    lines.push("")
  }

  writeFileSync(join(directory, "MEMORY.md"), lines.slice(0, 140).join("\\n").trimEnd() + "\\n", "utf8")
}

function gitRemote(root: string) {
  try {
    return String(execFileSync("git", ["-C", root, "remote", "get-url", "origin"], { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] })).trim()
  } catch {
    return ""
  }
}

function resolveMemoryStore(root: string) {
  const remote = sanitizeRemote(gitRemote(root))
  const identity = remote ? "git:" + remote : "path:" + root
  const digest = createHash("sha256").update(identity).digest("hex").slice(0, 12)
  const rawName = remote
    ? (remote.replace(/\\/$/, "").split(/[\\\\/:]/).pop() || "project")
    : (root.split(/[\\\\/]/).filter(Boolean).pop() || "project")
  const projectName = projectSlug(rawName)
  const directory = join(PROJECTS, projectName + "-" + digest)

  mkdirSync(directory, { recursive: true })
  const factsFile = join(directory, "FACTS.jsonl")
  if (!existsSync(factsFile)) writeFileSync(factsFile, "", "utf8")

  const existing = latestFacts(directory)
  for (const fact of detectProjectFacts(root)) {
    if (!existing.has(fact.key)) appendFactLocal(directory, { ...fact, automatic: true })
  }

  rebuildMemory(root, projectName, digest, directory)
  return { projectName, digest, directory }
}

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
  let memoryStore: {
    projectName: string
    digest: string
    directory: string
  } | null = null

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
      if (!memoryStore) {
        memoryStore = resolveMemoryStore(projectRoot)
      }

      const path = join(memoryStore.directory, "MEMORY.md")

      memory = existsSync(path)
        ? readFileSync(path, "utf8").trim().slice(0, MAX_MEMORY_CHARS)
        : ""
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
      if (!memoryStore) {
        memoryStore = resolveMemoryStore(projectRoot)
      }

      const changed = appendFactLocal(memoryStore.directory, fact)

      if (changed) {
        rebuildMemory(
          projectRoot,
          memoryStore.projectName,
          memoryStore.digest,
          memoryStore.directory,
        )
      }

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
