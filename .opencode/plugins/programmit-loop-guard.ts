import { definePlugin } from 'opencode/plugin'

export default definePlugin({
  hooks: {
    'chat.message': ({ ctx }) => {
      // Reset state for session when user sends a new message
      ctx.state = {}
    },
    'tool.execute.before': ({ ctx, tool, args }) => {
      const key = `${tool}:${JSON.stringify(args)}`
      if (!ctx.state.calls) ctx.state.calls = []
      
      const recentCalls = ctx.state.calls.slice(-2)
      const allSame = recentCalls.length === 2 && recentCalls.every((call: any) => call.key === key)
      
      if (allSame) {
        throw new Error(`PROGRAMMIT_LOOP_GUARD: Se detectó repetición sin progreso. Detén herramientas y responde: ERROR concreto + resultado actual + qué falta.`)
      }
    },
    'tool.execute.after': ({ ctx, tool, args, result }) => {
      const key = `${tool}:${JSON.stringify(args)}`
      if (!ctx.state.calls) ctx.state.calls = []
      ctx.state.calls.push({ key, result })
      // Keep only last 3 calls
      if (ctx.state.calls.length > 3) {
        ctx.state.calls.shift()
      }
    }
  }
})
