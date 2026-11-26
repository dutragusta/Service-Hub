const generateUrl = 'http://127.0.0.1:11434/api/generate'

export function createOllamaSummary(model) {
  function generate(payload, timeout) {
    return fetch(generateUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ model, stream: false, ...payload }),
      redirect: 'error',
      signal: AbortSignal.timeout(timeout),
    })
  }

  return {
    async preload() {
      try {
        const response = await generate({ options: { num_ctx: 4096 } }, 120_000)
        const result = response.ok ? await response.json() : null
        return result?.done === true
      } catch {
        return false
      }
    },

    async summarize(input, instructions, schema) {
      // O navegador encerra esta solicitação após 8,5 segundos.
      const response = await generate({
        system: instructions,
        prompt: JSON.stringify(input),
        format: schema,
        options: { temperature: 0.1, num_ctx: 4096, num_predict: 192 },
      }, 7_500)
      if (!response.ok) return
      const result = await response.json()
      if (result.done !== true || result.done_reason === 'length' || typeof result.response !== 'string') return
      return JSON.parse(result.response).synopsis
    },
  }
}
