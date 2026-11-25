import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Brand, Empty, Heading } from '../components/ui'
import { accessRequest, queuePath, settingsPath, useTeamRole } from '../services/access'
import type { Profile } from '../types'

type ApplicationStatus = 'pending' | 'approved' | 'rejected'
type Account = { name: string; company: string; status: ApplicationStatus }
type Access = { account: Account | null; canEnter: boolean }
type ManagedAccount = Account & { subject: string; email: string }
const statusLabels = { pending: 'Em análise', approved: 'Aprovado', rejected: 'Recusado' }

export function PortalAccess({ registration = false }: { registration?: boolean }) {
  const { profile } = useParams()
  if (profile !== 'cliente' && profile !== 'colaborador') return <main id="main" className="workspace"><Empty title="Perfil indisponível"><Link to="/">Escolher perfil</Link></Empty></main>
  if (registration && profile === 'colaborador') return <Navigate replace to="/acesso/colaborador" />
  return <PortalAccessForm key={profile + registration} profile={profile} registration={registration} />
}

function PortalAccessForm({ profile, registration }: { profile: Profile; registration: boolean }) {
  const [access, setAccess] = useState<Access>()
  const [check, setCheck] = useState<'loading' | 'ready' | 'signed-out' | 'failed'>('loading')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)
  const navigate = useNavigate()
  const requestPath = '/api/portal/account?profile=' + profile
  const accessPath = '/acesso/' + profile
  const employee = profile === 'colaborador'
  const audience = employee ? 'Colaborador' : 'Cliente'
  const signIn = '/signin-with-chatgpt?return_to=' + encodeURIComponent('/#' + accessPath + (registration ? '/cadastro' : ''))

  useEffect(() => {
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch(requestPath, { cache: 'no-store', signal: controller.signal })
        if (response.status === 401) { setCheck('signed-out'); return }
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error()
        const result: Access = await response.json()
        setAccess(result)
        setCheck('ready')
      } catch {
        if (!controller.signal.aborted) setCheck('failed')
      }
    }
    void load()
    return () => controller.abort()
  }, [requestPath])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (check !== 'ready' || saving) return
    const form = new FormData(event.currentTarget)
    const details = { profile, action: registration ? 'register' : 'verify', email: String(form.get('email') ?? '').trim() }
    setError('')
    setSaving(true)
    try {
      const result = await accessRequest<Access>('/api/portal/account', registration ? {
        ...details, name: String(form.get('name') ?? '').trim(), company: String(form.get('company') ?? '').trim(),
      } : details)
      if (result.canEnter) { navigate('/' + profile); return }
      setAccess(result)
      setVerified(true)
    } catch (failure) {
      setVerified(false)
      setError(failure instanceof Error ? failure.message : 'Não foi possível concluir a verificação.')
    } finally {
      setSaving(false)
    }
  }

  const account = access?.account
  return <main id="main" className="workspace account-workspace">
    <Link className="back" to="/">Escolher perfil</Link>
    <div className="account-brand"><Brand /></div>
    <Heading title={registration ? 'Cadastro · Cliente' : 'Entrar · ' + audience}
      description={registration ? 'Informe os dados da sua empresa para solicitar acesso.' : 'Informe o e-mail da sua conta para verificar o acesso.'} />
    <section className="card team-editor" aria-label={registration ? 'Cadastro' : 'Acesso ao portal'}>
      {check === 'loading' && <p role="status">Verificando sua sessão…</p>}
      {check === 'signed-out' && <p className="alert">Entre com sua conta do ChatGPT para confirmar seu e-mail e continuar.</p>}
      {check === 'failed' && <p className="alert" role="status">A verificação requer uma sessão na versão hospedada. Na demonstração, use apenas dados fictícios.</p>}
      {account && account.status !== 'approved' && <p className="alert" role="status">Cadastro {statusLabels[account.status].toLowerCase()}{account.status === 'pending' ? '. Aguarde a revisão pela equipe responsável.' : '.'}</p>}
      {verified && !account && !employee && <p className="alert" role="status">E-mail confirmado. Solicite seu cadastro para continuar.</p>}
      {registration && account?.status === 'approved' ? <div><Link className="button primary" to={accessPath}>Ir para entrada</Link></div> :
        <form className="ticket-form" onSubmit={submit}>
          {registration && <label>Nome completo<input autoComplete="name" name="name" required maxLength={100} /></label>}
          <label>{employee ? 'E-mail corporativo' : 'E-mail profissional'}<input type="email" autoComplete="email" name="email" required maxLength={254} /></label>
          {registration && <label>Empresa<input autoComplete="organization" name="company" required maxLength={120} /></label>}
          <p className="muted">Use o mesmo e-mail verificado pela sua sessão. Para testes, use apenas contas e dados autorizados.</p>
          {error && <p className="alert error" role="alert">{error}</p>}
          <div>{check === 'signed-out' ? <a className="button primary" href={signIn} target="_top">Entrar com ChatGPT</a> :
            <button className="button primary" disabled={check !== 'ready' || saving || (registration && account?.status === 'pending')} type="submit">{saving ? 'Verificando…' : registration ? 'Enviar cadastro' : 'Verificar e-mail'}</button>}</div>
        </form>}
      <div className="actions">
        {!employee && !registration && !access?.canEnter && <Link to={accessPath + '/cadastro'}>Solicitar cadastro</Link>}
        {registration && account?.status !== 'approved' && <Link to={accessPath}>Voltar para entrada</Link>}
        <Link to={'/' + profile}>Explorar demonstração</Link>
      </div>
    </section>
  </main>
}

export function PortalAccounts({ profile }: { profile: Profile }) {
  const [entries, setEntries] = useState<ManagedAccount[]>()
  const [busy, setBusy] = useState(false)
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  const path = '/api/team/accounts'
  const title = profile === 'colaborador' ? 'Colaboradores' : 'Clientes'
  useEffect(() => {
    let active = true
    void accessRequest<{ entries: ManagedAccount[] }>(path + '?profile=' + profile)
      .then(({ entries: result }) => { if (active) setEntries(result) })
      .catch((failure: Error) => { if (active) setError(failure.message) })
    return () => { active = false }
  }, [profile])

  async function review(subject: string, status: 'approved' | 'rejected') {
    setBusy(true)
    setError('')
    setFeedback('')
    try {
      await accessRequest(path, { subject, profile, status })
      setEntries((current) => current?.map((entry) => entry.subject === subject ? { ...entry, status } : entry))
      setFeedback(status === 'approved' ? 'Cadastro aprovado.' : 'Cadastro recusado.')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível revisar o cadastro.')
    } finally {
      setBusy(false)
    }
  }

  return <section className="card team-editor" aria-label={title}>
    <header><h2>{title}</h2><p>Acompanhe e revise as solicitações de cadastro deste perfil.</p></header>
    {feedback && <p className="alert success" role="status">{feedback}</p>}
    {error && <p className="alert error" role="alert">{error}</p>}
    {entries ? (entries.length ? <ul className="permission-list settings-records">{entries.map((entry) => <li key={entry.subject}>
      <div><strong>{entry.name}</strong><small>{entry.email}{entry.company && ' · ' + entry.company} · {statusLabels[entry.status]}</small></div>
      {entry.status === 'pending' && <div className="actions">
        <button className="button primary" type="button" disabled={busy} aria-label={'Aprovar ' + entry.name} onClick={() => void review(entry.subject, 'approved')}>Aprovar</button>
        <button className="button secondary" type="button" disabled={busy} aria-label={'Recusar ' + entry.name} onClick={() => void review(entry.subject, 'rejected')}>Recusar</button>
      </div>}
    </li>)}</ul> : <p>Nenhum cadastro recebido.</p>) : !error && <p role="status">Carregando cadastros…</p>}
  </section>
}


export function StaffAccess() {
  const role = useTeamRole(true)
  const signIn = '/signin-with-chatgpt?return_to=' + encodeURIComponent('/#/acesso/equipe')
  return <main id="main" className="workspace account-workspace">
    <Link className="back" to="/">Escolher perfil</Link>
    <div className="account-brand"><Brand /></div>
    <Heading title="Acesso da equipe" description="Entrada para administradores e equipe de suporte." />
    <section className="card team-editor" aria-label="Acesso da equipe">
      {role === undefined ? <p role="status">Verificando acesso…</p> : role ? (
        <div><Link className="button primary" to={role === 'admin' ? settingsPath : queuePath}>Entrar como {role === 'admin' ? 'administrador' : 'suporte'}</Link></div>
      ) : <>
        <p>Entre com a conta autorizada. Para ativar um novo cadastro de equipe, use o link de convite fornecido pelo administrador.</p>
        <div><a className="button primary" href={signIn} target="_top">Entrar com ChatGPT</a></div>
      </>}
    </section>
  </main>
}
