import assert from 'node:assert/strict'
import { createTicketSummary } from '../src/services/ticket-summary.mjs'
import { ticketSummaryApi } from '../worker/ticket-summary.js'

const url = 'https://service-hub.example.test/api/tickets/summary'
const input = {
  profile: 'colaborador', title: 'VPN expira ao conectar', description: 'O acesso à intranet está indisponível.',
  category: 'Acesso à VPN', priority: 'Alta', startedAt: 'Hoje às 08h40', environment: 'Notebook Windows 11',
  scope: 'Uma pessoa', impact: 'Relatório interno parado', errorMessage: 'Tempo limite atingido',
  tests: 'Site público abriu em duas redes. A VPN expirou nas duas.', guidance: ['Reinicie o aplicativo.'],
  outcome: 'A falha continuou na segunda tentativa.', queue: 'Triagem geral',
}

function request({ headers = {}, data = input } = {}) {
  return new Request(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Origin: new URL(url).origin,
      'oai-authenticated-user-id': 'test-account', ...headers },
    body: JSON.stringify(data),
  })
}

assert.equal((await ticketSummaryApi(new Request(url), {})).status, 405)
assert.equal((await ticketSummaryApi(request({ headers: { 'oai-authenticated-user-id': '' } }), {})).status, 401)
assert.equal((await ticketSummaryApi(request({ headers: { Origin: 'https://unrelated.example.test' } }), {})).status, 403)
assert.equal((await ticketSummaryApi(request({ headers: { 'Content-Type': 'text/plain' } }), {})).status, 415)
assert.equal((await ticketSummaryApi(request({ data: { ...input, tests: 'Token: exemplo-ficticio' } }), {})).status, 400)
assert.equal((await ticketSummaryApi(request({ data: { ...input, tests: 'Contato: demo@example.test' } }), {})).status, 400)
assert.equal((await ticketSummaryApi(request({ data: { ...input, extra: 'x'.repeat(25_000) } }), {})).status, 400)

const server = await ticketSummaryApi(request(), {})
assert.equal(server.headers.get('Cache-Control'), 'no-store')
const summary = await server.json()
assert.equal(summary.origin, 'regras')
assert.equal(summary.conditions[0][1], input.startedAt)
assert.equal(summary.executedTests, input.tests)
assert.deepEqual(summary.guidance, input.guidance)
assert.equal(summary.handoff, input.outcome)
assert.deepEqual(summary.gaps, [])
const local = createTicketSummary({ ...input, tests: undefined, scope: undefined })
assert.equal(local.origin, 'local')
assert.equal(local.gaps.length, 2)
assert.equal(local.executedTests, 'Não informado pelo solicitante.')

const nativeFetch = globalThis.fetch
let calls = 0
try {
  const env = { OPENAI_API_KEY: 'test-key-placeholder', OPENAI_SUMMARY_MODEL: 'mock-model' }
  globalThis.fetch = async (providerUrl, options) => {
    calls += 1
    assert.equal(providerUrl, 'https://api.openai.com/v1/responses')
    const sent = JSON.parse(options.body)
    assert.equal(sent.store, false)
    assert.equal(sent.text.format.strict, true)
    assert.equal(JSON.parse(sent.input).tests, input.tests)
    return Response.json({ status: 'completed', output: [
      { type: 'message', content: [{ type: 'output_text', text: JSON.stringify({ synopsis: 'A VPN falha desde 08h40 e expirou em duas redes.' }) }] },
    ] })
  }
  assert.equal((await ticketSummaryApi(request({ data: { ...input, report: 'Senha: exemplo-ficticio' } }), env)).status, 400)
  assert.equal(calls, 0)
  const generated = await (await ticketSummaryApi(request(), env)).json()
  assert.equal(calls, 1)
  assert.equal(generated.origin, 'modelo')
  assert.match(generated.synopsis, /08h40/)
  assert.equal(generated.executedTests, input.tests)
  globalThis.fetch = async () => new Response(null, { status: 503 })
  assert.equal((await (await ticketSummaryApi(request(), env)).json()).origin, 'regras')
} finally {
  globalThis.fetch = nativeFetch
}

console.log('Resumo factual, sessão, origem, validação, proteção de credenciais e fallback verificados.')
