import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Heading } from '../components/ui'
import { accessRequest, queuePath, type Permission, type TeamRole } from '../services/access'
import { formatDateTime } from '../services/support'

export function Permissions() {
  const [entries, setEntries] = useState<Permission[]>([])
  const [busy, setBusy] = useState(false)
  const [status, setStatus] = useState('')
  const [error, setError] = useState('')
  const [link, setLink] = useState('')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState<'active' | 'invited'>('active')
  const [confirmEmail, setConfirmEmail] = useState('')

  async function refresh() {
    const result = await accessRequest<{ entries: Permission[] }>('/api/team/access')
    setEntries(result.entries)
  }

  useEffect(() => {
    void refresh().catch((failure: Error) => setError(failure.message))
  }, [])

  async function change(email: string, action: 'grant' | 'invite' | 'remove', role?: TeamRole) {
    setBusy(true)
    setError('')
    setStatus('')
    setLink('')
    try {
      const result = await accessRequest<{ token?: string }>('/api/team/access', { email, action, role })
      if (result.token) setLink(window.location.origin + '/#/convite/' + result.token)
      setStatus(action === 'remove' ? 'Acesso ou convite removido.' : result.token ? 'Convite gerado para a conta informada.' : 'Perfil atualizado.')
      setConfirmEmail('')
      setQuery('')
      setFilter(action === 'invite' ? 'invited' : action === 'grant' ? 'active' : filter)
      await refresh()
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível atualizar o acesso.')
    } finally {
      setBusy(false)
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const data = new FormData(event.currentTarget)
    const action = data.get('action') === 'grant' ? 'grant' : 'invite'
    void change(String(data.get('email')), action, data.get('role') === 'admin' ? 'admin' : 'support')
  }

  const visibleEntries = entries.filter(({ email, expires_at }) =>
    (filter === 'active' ? expires_at === null : expires_at !== null) && email.includes(query.trim().toLowerCase()))

  return <section className="card team-editor" aria-labelledby="permissions-title">
    <header><h2 id="permissions-title">Usuários</h2><p>Suporte acessa a fila. Administradores acessam a fila e o painel.</p></header>
    <p>O acesso interno vale para contas que já podem entrar no site privado. O convite é pessoal, de uso único e expira em 48 horas.</p>
    <form className="permission-form" onSubmit={submit}>
      <label>E-mail da conta<input name="email" type="email" required maxLength={254} /></label>
      <label>Perfil<select name="role"><option value="support">Suporte</option><option value="admin">Administrador</option></select></label>
      <label>Ação<select name="action"><option value="invite">Gerar link de convite</option><option value="grant">Conceder acesso</option></select></label>
      <button className="button primary" disabled={busy}>Aplicar</button>
    </form>
    {status && <p className="alert success" role="status">{status}</p>}
    {error && <p className="alert error" role="alert">{error}</p>}
    {link && <div className="team-editor"><label>Link de convite<input readOnly value={link} onFocus={(event) => event.target.select()} /></label>
      <div><button className="button secondary" type="button" onClick={() => void navigator.clipboard.writeText(link).then(() => setStatus('Link copiado.')).catch(() => setError('Selecione e copie o link manualmente.'))}>Copiar link</button></div>
    </div>}
    <div className="actions" role="group" aria-label="Tipo de acesso">
      <button type="button" className="button secondary" aria-pressed={filter === 'active'} onClick={() => setFilter('active')}>Acessos ativos</button>
      <button type="button" className="button secondary" aria-pressed={filter === 'invited'} onClick={() => setFilter('invited')}>Convites</button>
    </div>
    <label>Buscar por e-mail<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} /></label>
    {visibleEntries.length ? <ul className="permission-list">{visibleEntries.map((entry) => <li key={entry.email}>
      <div><strong>{entry.email}</strong><small>{entry.role === 'admin' ? 'Administrador' : 'Suporte'} · {entry.expires_at ? entry.expires_at > Date.now() ? 'Pendente até ' + formatDateTime(new Date(entry.expires_at).toISOString()) : 'Expirado' : 'Ativo'}</small></div>
      {confirmEmail === entry.email ? <div className="actions"><button className="button primary" disabled={busy} onClick={() => void change(entry.email, 'remove')}>Confirmar remoção</button><button className="button secondary" onClick={() => setConfirmEmail('')}>Cancelar</button></div>
        : <button className="button secondary" disabled={busy} onClick={() => setConfirmEmail(entry.email)}>Remover</button>}
    </li>)}</ul> : <p>Nenhum registro encontrado para este filtro.</p>}
  </section>
}

export function AcceptInvite() {
  const { token } = useParams()
  const navigate = useNavigate()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  async function accept() {
    setBusy(true)
    setError('')
    try {
      await accessRequest('/api/access/accept', { token })
      navigate(queuePath, { replace: true })
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível aceitar o convite.')
    } finally {
      setBusy(false)
    }
  }
  return <main id="main" className="workspace">
    <Heading title="Convite para a equipe" description="Use a conta indicada no convite para ativar o acesso ao Service Hub." />
    {error && <p className="alert error" role="alert">{error}</p>}
    <div className="actions"><button className="button primary" disabled={busy} onClick={() => void accept()}>Aceitar convite</button><Link to="/">Voltar ao início</Link></div>
  </main>
}
