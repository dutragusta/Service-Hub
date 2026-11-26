import { cleanSummaryInput } from '../src/services/ticket-summary.mjs'

export async function ticketEmailApi(request, env) {
  const respond = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } })
  if (request.method !== 'POST') return respond({ error: 'Método indisponível.' }, 405)
  if (request.headers.get('Origin') !== new URL(request.url).origin) return respond({ error: 'Origem não permitida.' }, 403)
  if (env.TICKET_EMAIL_DEMO === true) return respond({ status: 'demo' })

  const subject = request.headers.get('oai-authenticated-user-id')
  const email = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase()
  if (!subject || !email) return respond({ error: 'Entre com sua conta para enviar os e-mails.' }, 401)
  const account = await env.DB.prepare("SELECT email FROM demo_portal_accounts WHERE subject = ? AND profile = 'cliente' AND status = 'approved'")
    .bind(subject).first()
  if (account?.email !== email) return respond({ error: 'Os e-mails exigem uma conta de cliente aprovada.' }, 403)
  if (!env.RESEND_API_KEY || !env.TICKET_EMAIL_FROM || !env.TICKET_SUPPORT_EMAIL) return respond({ status: 'unconfigured' })

  if (request.headers.get('Content-Type')?.split(';')[0] !== 'application/json') return respond({ error: 'Formato esperado: JSON.' }, 415)
  const { protocol, title, description, category, priority, queue, synopsis } = await request.json().catch(() => ({})) ?? {}
  const input = cleanSummaryInput({ profile: 'cliente', title, description, category, priority, queue })
  if (typeof protocol !== 'string' || !/^SH-[A-F0-9]{8}$/.test(protocol) || !input ||
      typeof synopsis !== 'string' || synopsis.length > 2400) {
    return respond({ error: 'Dados do chamado inválidos.' }, 400)
  }

  const heading = input.title.replace(/\s+/g, ' ').slice(0, 90)
  const requestText = 'Protocolo: ' + protocol + '\nSolicitação: ' + heading + '\n\n' + input.description
  const base = { from: env.TICKET_EMAIL_FROM, subject: '[' + protocol + '] ' + heading }
  const messages = [
    { ...base, to: [email], text: 'Seu chamado foi registrado. Guarde o protocolo para acompanhar a solicitação.\n\n' + requestText },
    { ...base, to: [env.TICKET_SUPPORT_EMAIL], reply_to: email, text: requestText + '\n\nCliente: ' + email +
      '\nCategoria: ' + input.category + '\nPrioridade: ' + input.priority + '\nFila: ' + (input.queue || 'Triagem geral') +
      '\n\nResumo para o suporte:\n' + (synopsis.trim() || input.description) },
  ]
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(subject + ':' + protocol))
  const key = Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
  const delivery = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': 'service-hub/' + key },
    body: JSON.stringify(messages),
    signal: AbortSignal.timeout(6000),
  })
  const receipt = delivery.ok ? await delivery.json().catch(() => null) : null
  if (!Array.isArray(receipt?.data) || receipt.data.length !== messages.length || !receipt.data.every((entry) => entry?.id)) {
    return respond({ status: 'failed' }, 502)
  }
  return respond({ status: 'sent' })
}
