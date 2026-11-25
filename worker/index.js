import knowledgeBase from '../src/data/base-atendimento.json'
import { ticketSummaryApi } from './ticket-summary.js'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const inviteDuration = 48 * 60 * 60 * 1000

async function hash(value) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value))
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

function json(data, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}

async function permissionApi(request, db, path) {
  const subject = request.headers.get('oai-authenticated-user-id')
  const email = request.headers.get('oai-authenticated-user-email')?.trim().toLowerCase()
  if (!subject || !email) return json({ error: 'Entre com sua conta para continuar.' }, 401)
  const isOwner = await hash(email) === owner
  const entry = isOwner ? undefined : await db.prepare('SELECT role, invite_hash FROM demo_team_access WHERE email = ?').bind(email).first()
  const role = isOwner ? 'admin' : entry && !entry.invite_hash ? entry.role : null
  if (path === '/api/access' && request.method === 'GET') return json(role ? { role, email } : { role })

  if (request.method === 'POST' && request.headers.get('Origin') !== new URL(request.url).origin) {
    return json({ error: 'Origem não permitida.' }, 403)
  }
  if (path === '/api/portal/account' || path === '/api/team/accounts') {
    return portalAccountApi(request, db, path, { subject, email, role })
  }
  if (path === '/api/access/accept' && request.method === 'POST') {
    const { token } = await request.json()
    if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) return json({ error: 'Convite inválido.' }, 400)
    const result = await db.prepare('UPDATE demo_team_access SET invite_hash = NULL, expires_at = NULL WHERE email = ? AND invite_hash = ? AND expires_at > ?')
      .bind(email, await hash(token), Date.now()).run()
    return result.meta.changes ? json({ accepted: true }) : json({ error: 'Convite expirado, usado ou vinculado a outra conta.' }, 403)
  }
  if (path !== '/api/team/access') return json({ error: 'Rota indisponível.' }, 404)
  if (role !== 'admin') return json({ error: 'Acesso administrativo necessário.' }, 403)
  if (request.method === 'GET') {
    const { results } = await db.prepare('SELECT email, role, expires_at FROM demo_team_access ORDER BY email LIMIT 250').all()
    return json({ entries: results })
  }
  if (request.method !== 'POST') return json({ error: 'Método indisponível.' }, 405)

  const body = await request.json()
  const target = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (target.length > 254 || !emailPattern.test(target)) return json({ error: 'Informe um e-mail válido.' }, 400)
  if (target === email || await hash(target) === owner) return json({ error: 'Esta permissão não pode ser alterada por esta conta.' }, 400)
  if (body.action === 'remove') {
    await db.prepare('DELETE FROM demo_team_access WHERE email = ?').bind(target).run()
    return json({ saved: true })
  }
  if (!['admin', 'support'].includes(body.role) || !['grant', 'invite'].includes(body.action)) return json({ error: 'Selecione uma ação e um perfil válidos.' }, 400)
  if (body.action === 'invite') {
    const token = Array.from(crypto.getRandomValues(new Uint8Array(32)), (byte) => byte.toString(16).padStart(2, '0')).join('')
    const result = await db.prepare('INSERT INTO demo_team_access (email, role, invite_hash, expires_at) VALUES (?, ?, ?, ?) ON CONFLICT(email) DO UPDATE SET role = excluded.role, invite_hash = excluded.invite_hash, expires_at = excluded.expires_at WHERE demo_team_access.invite_hash IS NOT NULL')
      .bind(target, body.role, await hash(token), Date.now() + inviteDuration).run()
    return result.meta.changes ? json({ token }) : json({ error: 'Esta conta já tem acesso. Use Conceder acesso para alterar o perfil.' }, 409)
  }
  await db.prepare('INSERT INTO demo_team_access (email, role) VALUES (?, ?) ON CONFLICT(email) DO UPDATE SET role = excluded.role, invite_hash = NULL, expires_at = NULL').bind(target, body.role).run()
  return json({ saved: true })
}

async function portalAccountApi(request, db, path, identity) {
  const managing = path === '/api/team/accounts'
  if (managing && identity.role !== 'admin') return json({ error: 'Acesso administrativo necessário.' }, 403)
  const { method } = request
  if (method !== 'GET' && method !== 'POST') return json({ error: 'Método indisponível.' }, 405)
  const body = method === 'POST' ? await request.json().catch(() => null) : null
  const profile = method === 'GET' ? new URL(request.url).searchParams.get('profile') : body?.profile
  if (profile !== 'cliente') return json({ error: 'Selecione um perfil válido.' }, 400)

  if (managing) {
    if (method === 'GET') {
      const { results } = await db.prepare('SELECT subject, name, email, company, status, updated_at FROM demo_portal_accounts WHERE profile = ? ORDER BY updated_at DESC LIMIT 250').bind(profile).all()
      return json({ entries: results })
    }
    if (!['approved', 'rejected'].includes(body?.status) || typeof body.subject !== 'string' || !body.subject || body.subject.length > 256) {
      return json({ error: 'Informe uma conta e uma decisão válidas.' }, 400)
    }
    const result = await db.prepare('UPDATE demo_portal_accounts SET status = ?, updated_at = ? WHERE subject = ? AND profile = ? AND status = ?')
      .bind(body.status, Date.now(), body.subject, profile, 'pending').run()
    return result.meta.changes ? json({ saved: true }) : json({ error: 'A solicitação já foi revisada ou está indisponível.' }, 409)
  }

  const lookup = () => db.prepare('SELECT name, company, status FROM demo_portal_accounts WHERE subject = ? AND profile = ?').bind(identity.subject, profile).first()
  const access = (account) => ({ account, canEnter: account?.status === 'approved' })
  if (method === 'GET') return json(access(await lookup()))

  const email = typeof body?.email === 'string' ? body.email.trim().toLowerCase() : ''
  if (email.length > 254 || !emailPattern.test(email)) return json({ error: 'Informe um e-mail válido.' }, 400)
  if (email !== identity.email) return json({ error: 'Use o mesmo e-mail da sua conta autenticada.' }, 403)
  const account = await lookup()
  if (body.action === 'verify') return json(access(account))
  if (body.action !== 'register') return json({ error: 'Ação indisponível para este perfil.' }, 400)

  const name = typeof body.name === 'string' ? body.name.trim() : ''
  const company = typeof body.company === 'string' ? body.company.trim() : ''
  if (!name || name.length > 100 || !company || company.length > 120) {
    return json({ error: 'Informe seu nome e sua empresa.' }, 400)
  }
  const result = await db.prepare("INSERT INTO demo_portal_accounts (subject, profile, name, email, company, status, updated_at) VALUES (?, ?, ?, ?, ?, 'pending', ?) ON CONFLICT(subject, profile) DO UPDATE SET name = excluded.name, email = excluded.email, company = excluded.company, status = excluded.status, updated_at = excluded.updated_at WHERE demo_portal_accounts.status = 'rejected'")
    .bind(identity.subject, profile, name, identity.email, company, Date.now()).run()
  return result.meta.changes ? json(access(await lookup()), 201) : json({ error: 'Já existe um cadastro em análise ou aprovado para este perfil.' }, 409)
}

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname
    if (path === '/api/knowledge') {
      const profile = new URL(request.url).searchParams.get('profile')
      if (request.method !== 'GET') return json({ error: 'Método indisponível.' }, 405)
      if (profile !== 'cliente') return json({ error: 'Perfil indisponível.' }, 400)
      return json({ profile, articles: knowledgeBase[profile] })
    }
    if (path.startsWith('/api/')) {
      try {
        return path === '/api/tickets/summary' ? await ticketSummaryApi(request, env) : await permissionApi(request, env.DB, path)
      } catch {
        const operation = ['/api/access', '/api/access/accept', '/api/team/access', '/api/portal/account', '/api/team/accounts'].includes(path) ? path : 'outra-rota'
        console.error('Erro na API do portal', request.method, operation)
        return json({ error: 'Não foi possível concluir a solicitação. Tente novamente.' }, 503)
      }
    }
    const asset = assets[path === '/' ? '/index.html' : path]
    if (!asset || !['GET', 'HEAD'].includes(request.method)) return new Response('Não encontrado', { status: 404 })
    const body = Uint8Array.from(atob(asset.content), (byte) => byte.charCodeAt(0))
    return new Response(request.method === 'HEAD' ? null : body, { headers: {
      'Content-Type': asset.type ?? 'application/octet-stream',
      'Cache-Control': path.startsWith('/assets/') ? 'public, max-age=31536000, immutable' : 'no-cache',
      'X-Content-Type-Options': 'nosniff',
    } })
  },
}
