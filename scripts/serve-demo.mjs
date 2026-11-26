import { createServer } from 'node:http'
import { Readable } from 'node:stream'
import { access } from 'node:fs/promises'
import { createOllamaSummary } from './ollama-summary.mjs'

const path = new URL('../dist/server/index.js', import.meta.url)
await access(path).catch(() => {
  console.error('Versão compilada ausente. Execute npm run build antes de iniciar.')
  process.exit(1)
})
const { default: worker } = await import(path)
const port = Number(process.env.SERVICE_HUB_PORT ?? 4173)
if (!Number.isInteger(port) || port < 1024 || port > 65535) {
  console.error('SERVICE_HUB_PORT precisa ser uma porta entre 1024 e 65535.')
  process.exit(1)
}

const origin = 'http://127.0.0.1:' + port
const originHost = new URL(origin).host
const identity = 'analista.demo@example.test'
const model = process.env.OLLAMA_MODEL?.trim() || 'llama3.1:8b'
const ollama = createOllamaSummary(model)
const env = { OLLAMA_SYNOPSIS: ollama.summarize, TICKET_EMAIL_DEMO: true }
const routes = new Map([
  ['/api/access', { role: 'support', email: identity, demo: true }],
  ['/api/portal/account', { demo: true }],
])

const server = createServer(async (incoming, outgoing) => {
  try {
    if (incoming.headers.host !== originHost || (incoming.headers.origin && incoming.headers.origin !== origin)) {
      incoming.resume()
      outgoing.writeHead(403).end()
      return
    }

    const parsed = new URL(incoming.url, origin)
    if (parsed.origin !== origin || !incoming.url.startsWith('/')) {
      incoming.resume()
      outgoing.writeHead(403).end()
      return
    }

    const headers = new Headers(incoming.headers)
    headers.delete('oai-authenticated-user-id')
    headers.delete('oai-authenticated-user-email')
    const method = incoming.method
    const hasBody = method !== 'GET' && method !== 'HEAD'
    let response
    if (method === 'GET' && routes.has(parsed.pathname)) {
      response = Response.json(routes.get(parsed.pathname), { headers: { 'Cache-Control': 'no-store' } })
    } else if (parsed.pathname.startsWith('/api/') &&
      !['/api/knowledge', '/api/tickets/summary', '/api/tickets/email'].includes(parsed.pathname)) {
      incoming.resume()
      response = Response.json({ error: 'Esta operação requer a hospedagem autenticada.' }, { status: 503 })
    } else {
      if (parsed.pathname === '/api/tickets/summary') headers.set('oai-authenticated-user-id', 'local-demo')
      const request = new Request(parsed, { method, headers, ...(hasBody && { body: Readable.toWeb(incoming), duplex: 'half' }) })
      response = await worker.fetch(request, env)
    }
    outgoing.writeHead(response.status, Object.fromEntries(response.headers))
    if (!response.body || method === 'HEAD') outgoing.end()
    else Readable.fromWeb(response.body).on('error', () => outgoing.destroy()).pipe(outgoing)
  } catch {
    if (outgoing.headersSent) outgoing.destroy()
    else outgoing.writeHead(500).end('Não foi possível processar o pedido.')
  }
})

server.on('error', (error) => {
  console.error(error.code === 'EADDRINUSE' ? 'A porta está em uso. Feche a outra execução do Service Hub.' : error.message)
  process.exitCode = 1
})
server.listen(port, '127.0.0.1', () => {
  console.log('Service Hub · Demonstração local em ' + origin + '/')
  ollama.preload().then((ready) => {
    console.log(ready
      ? 'Ollama · Modelo pronto: ' + model
      : 'Ollama · Modelo indisponível. O Service Hub pode resumir por regras.')
  })
})
