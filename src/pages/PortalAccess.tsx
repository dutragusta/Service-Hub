import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Brand, Heading } from '../components/ui'
import { accessRequest, deskPath, useTeamIdentity } from '../services/access'
import { enterDemoCustomer } from '../services/demo-account'
import type { Profile } from '../types'

type ApplicationStatus = 'pending' | 'approved' | 'rejected'
type Account = { name: string; company: string; status: ApplicationStatus }
type Access = { account: Account | null; canEnter: boolean }
type ManagedAccount = Account & { subject: string; email: string }
const statusLabels = { pending: 'Em análise', approved: 'Aprovado', rejected: 'Recusado' }

export function PortalAccess({ registration = false }: { registration?: boolean }) {
  const { profile } = useParams()
  if (profile !== 'cliente') return <Navigate replace to="/cliente" />
  return <PortalAccessForm key={String(registration)} registration={registration} />
}

function PortalAccessForm({ registration }: { registration: boolean }) {
  const [feedback, setFeedback] = useState('')
  const [access, setAccess] = useState<Access>()
  const [check, setCheck] = useState<'loading' | 'ready' | 'signed-out' | 'failed' | 'demo'>(() => import.meta.env.MODE === 'pages' || import.meta.env.DEV ? 'demo' : 'loading')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [verified, setVerified] = useState(false)
  const navigate = useNavigate()
  const profile = 'cliente'
  const requestPath = '/api/portal/account?profile=cliente'
  const accessPath = '/acesso/cliente'
  const signIn = '/signin-with-chatgpt?return_to=' + encodeURIComponent('/#' + accessPath + (registration ? '/cadastro' : ''))

  useEffect(() => {
    if (import.meta.env.MODE === 'pages' || import.meta.env.DEV) return
    const controller = new AbortController()
    async function load() {
      try {
        const response = await fetch(requestPath, { cache: 'no-store', signal: controller.signal })
        if (response.status === 401) { setCheck('signed-out'); return }
        if (!response.ok || !response.headers.get('content-type')?.includes('application/json')) throw new Error()
        const result: Access & { demo?: boolean } = await response.json()
        if (result.demo) { setCheck('demo'); return }
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
    if ((check !== 'ready' && check !== 'demo') || saving) return
    const form = new FormData(event.currentTarget)
    const details = { profile, action: registration ? 'register' : 'verify', email: String(form.get('email') ?? '').trim() }
    const organization = { name: String(form.get('name') ?? '').trim(), company: String(form.get('company') ?? '').trim() }
    setError('')
    setFeedback('')
    setSaving(true)
    try {
      if (check === 'demo') {
        enterDemoCustomer(details.email, registration ? organization : undefined)
        if (registration) setFeedback('Cadastro fictício concluído. Entre com o mesmo e-mail.')
        else navigate('/cliente', { replace: true })
        return
      }
      const result = await accessRequest<Access>('/api/portal/account', registration ? { ...details, ...organization } : details)
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
  const demo = check === 'demo'
  const title = registration ? 'Criar conta' : 'Entrar'
  const description = registration
    ? demo ? 'Preencha os dados para criar sua conta de demonstração.' : 'Informe os dados da sua empresa para solicitar acesso.'
    : demo ? 'Use o e-mail que você cadastrou neste navegador.' : 'Informe o e-mail da sua conta para verificar o acesso.'

  return <main id="main" className="customer-access">
    <header className="customer-access-header">
      <Brand />
      <Link to="/"><ArrowLeft size={16} aria-hidden /> Voltar ao início</Link>
    </header>
    <section className="card customer-access-card" aria-labelledby="customer-access-title">
      <div className="customer-access-intro">
        <p>Portal do Cliente</p>
        <h1 id="customer-access-title" tabIndex={-1}>{title}</h1>
        <p>{description}</p>
      </div>
      {check === 'loading' && <p role="status">Verificando sua sessão…</p>}
      {check === 'signed-out' && <p className="alert">Entre com sua conta do ChatGPT para confirmar seu e-mail e continuar.</p>}
      {demo && <div className="customer-access-demo" id="customer-access-demo">
        <Info size={18} aria-hidden />
        <div><strong>Modo demonstração</strong>
          <p>{registration ? <>Use nome e empresa fictícios e um e-mail como <strong>cliente@example.test</strong>. O cadastro fica neste navegador.</>
            : <>Entre com um e-mail de demonstração como <strong>cliente@example.test</strong>.</>}</p>
        </div>
      </div>}
      {feedback && <p role="status" className="alert success">{feedback}</p>}
      {check === 'failed' && <p className="alert" role="status">A verificação requer uma sessão na versão hospedada. Na demonstração, use apenas dados fictícios.</p>}
      {account && account.status !== 'approved' && <p className="alert" role="status">Cadastro {statusLabels[account.status].toLowerCase()}{account.status === 'pending' ? '. Aguarde a revisão pela equipe responsável.' : '.'}</p>}
      {verified && !account && <p className="alert" role="status">E-mail confirmado. Solicite seu cadastro para continuar.</p>}
      {registration && account?.status === 'approved' ? <Link className="button primary customer-access-submit" to={accessPath}>Ir para entrada</Link> :
        <form className="ticket-form" onSubmit={submit}>
          {registration && <label>Nome completo<input autoComplete="name" name="name" required maxLength={100} /></label>}
          <label>{demo ? 'E-mail' : 'E-mail profissional'}<input type="email" autoComplete="email" name="email" required maxLength={254} aria-describedby={demo ? 'customer-access-demo' : undefined} /></label>
          {registration && <label>Empresa<input autoComplete="organization" name="company" required maxLength={120} /></label>}
          {check === 'ready' && <p className="muted">Use o mesmo e-mail verificado pela sua sessão.</p>}
          {error && <p className="alert error" role="alert">{error}</p>}
          {check === 'signed-out' ? <a className="button primary customer-access-submit" href={signIn} target="_top">Entrar com ChatGPT <ArrowRight size={18} aria-hidden /></a> :
            <button className="button primary customer-access-submit" disabled={(check !== 'ready' && !demo) || saving || (registration && account?.status === 'pending')} type="submit">
              {saving ? 'Verificando…' : registration ? 'Enviar cadastro' : demo ? 'Entrar' : 'Verificar e-mail'}
              <ArrowRight size={18} aria-hidden />
            </button>}
        </form>}
      {registration && account?.status !== 'approved' && <p className="customer-access-switch">Já tem conta? <Link to={accessPath}>Entrar</Link></p>}
      {!registration && !access?.canEnter && <p className="customer-access-switch">Ainda não tem conta? <Link to={accessPath + '/cadastro'}>{demo ? 'Criar conta' : 'Solicitar cadastro'}</Link></p>}
    </section>
    <Link className="customer-access-explore" to={'/' + profile}>Explorar demonstração <ArrowRight size={16} aria-hidden /></Link>
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
  const identity = useTeamIdentity(true)
  const role = identity?.role
  const signIn = '/signin-with-chatgpt?return_to=' + encodeURIComponent('/#/acesso/equipe')
  return <main id="main" className="workspace account-workspace">
    <Link className="back" to="/">Voltar à tela inicial</Link>
    <div className="account-brand"><Brand /></div>
    <Heading title="Acesso da equipe" description="Entrada para administradores e equipe de suporte." />
    <section className="card team-editor" aria-label="Acesso da equipe">
      {role === undefined ? <p role="status">Verificando acesso…</p> : role ? (
        <div><Link className="button primary" to={deskPath}>{identity?.demo ? 'Abrir central de atendimento · simulação local' : 'Abrir central de atendimento'}</Link></div>
      ) : import.meta.env.MODE === 'pages' ? <p>A fila do analista está disponível no pacote local e no ambiente autenticado.</p> : <>
        <p>Entre com a conta autorizada. Para ativar um novo cadastro de equipe, use o link de convite fornecido pelo administrador.</p>
        <div><a className="button primary" href={signIn} target="_top">Entrar com ChatGPT</a></div>
      </>}
    </section>
  </main>
}
