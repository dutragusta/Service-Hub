import { Permissions } from './Permissions'
import { PortalAccounts } from './PortalAccess'
import { CostCenters } from './CostCenters'
import { canHandleTicket, triageQueue } from '../services/routing'
import { queuePath, requireTeamRole, settingsPath, type TeamIdentity, type TeamRole } from '../services/access'
import { BarChart3, BookOpen, Building2, ContactRound, Network, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useParams } from 'react-router-dom'
import { Empty, Heading, StatusLabel, TopicIcon } from '../components/ui'
import { getTopics, saveTopic, sessionMetrics } from '../services/operations'
import { readTickets, updateTicket } from '../services/support'
import type { Profile, Topic } from '../types'
import { ContextDetails, TicketTimeline } from './Tickets'

const audiences = ['colaborador', 'cliente'] as const
const statuses = ['Aberto', 'Em atendimento', 'Resolvido'] as const
const audienceLabel = { colaborador: 'Colaborador', cliente: 'Cliente' }

function Restricted() {
  return <Empty title="Acesso restrito"><Link to="/colaborador">Voltar ao portal do colaborador</Link></Empty>
}

export function TeamSettings({ role }: { role?: TeamRole | null }) {
  if (role === undefined) return <p role="status">Verificando acesso…</p>
  if (role !== 'admin') return <Restricted />

  return <>
    <Heading title="Configurações" description="Gerencie o acesso da equipe e as configurações do Service Hub." />
    <div className="settings-layout">
      <nav className="settings-nav" aria-label="Navegação de configurações">
        <NavLink to={settingsPath} end><Users size={18} aria-hidden /> Usuários</NavLink>
        <NavLink to={settingsPath + '/colaboradores'}><ContactRound size={18} aria-hidden /> Colaboradores</NavLink>
        <NavLink to={settingsPath + '/clientes'}><Building2 size={18} aria-hidden /> Clientes</NavLink>
        <NavLink to={settingsPath + '/centros-de-custo'}><Network size={18} aria-hidden /> Centros de custo</NavLink>
        <NavLink to={settingsPath + '/visao-geral'}><BarChart3 size={18} aria-hidden /> Visão geral</NavLink>
      </nav>
      <div className="settings-content">
        <Routes>
          <Route index element={<Permissions />} />
          <Route path="colaboradores" element={<PortalAccounts key="colaborador" profile="colaborador" />} />
          <Route path="clientes" element={<PortalAccounts key="cliente" profile="cliente" />} />
          <Route path="permissoes" element={<Navigate replace to={settingsPath} />} />
          <Route path="centros-de-custo" element={<CostCenters />} />
          <Route path="visao-geral" element={<Administration />} />
          <Route path="*" element={<Empty title="Seção indisponível"><Link to={settingsPath}>Voltar a configurações</Link></Empty>} />
        </Routes>
      </div>
    </div>
  </>
}

export function TeamQueue({ identity }: { identity?: TeamIdentity }) {
  if (identity === undefined) return <p role="status">Verificando acesso…</p>
  if (!identity.role) return <Restricted />
  return <Routes>
    <Route index element={<SupportQueue identity={identity} />} />
    <Route path=":audience/:ticketId" element={<SupportTicket identity={identity} />} />
    <Route path="*" element={<Empty title="Seção indisponível"><Link to={queuePath}>Voltar à fila</Link></Empty>} />
  </Routes>
}

function SettingsHeading({ title, description }: { title: string, description: string }) {
  return <div className="settings-heading"><h2>{title}</h2><p>{description}</p></div>
}

function SupportQueue({ identity }: { identity: TeamIdentity }) {
  const [status, setStatus] = useState('')
  const [impact, setImpact] = useState('')
  const [queue, setQueue] = useState('')
  const [previewEmail, setPreviewEmail] = useState('')
  const assigned = audiences.flatMap((profile) => readTickets(profile).map((ticket) => ({ profile, ticket })))
    .filter(({ ticket }) => identity.role && canHandleTicket(ticket, identity.role, identity.email))
  const queues = [...new Set(assigned.map(({ ticket }) => ticket.routing?.queue ?? triageQueue))].sort()
  const analysts = [...new Set(assigned.flatMap(({ ticket }) => ticket.routing?.responsible ?? []))].sort()

  const tickets = assigned.filter(({ ticket }) => (!status || ticket.status === status) && (!impact || ticket.priority === impact)
    && (!queue || (ticket.routing?.queue ?? triageQueue) === queue)
    && (identity.role !== 'admin' || !previewEmail || canHandleTicket(ticket, 'support', previewEmail)))
    .sort((a, b) => Number(b.ticket.priority === 'Alta') - Number(a.ticket.priority === 'Alta') || Date.parse(b.ticket.date) - Date.parse(a.ticket.date))
  return <>
    <Heading title="Fila de suporte" description="Assuma um chamado, consulte o diagnóstico e registre a solução." />
    <div className="filter-bar">
      <label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Todos os status</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Impacto<select value={impact} onChange={(event) => setImpact(event.target.value)}><option value="">Todos os impactos</option><option value="Normal">Normal</option><option value="Alta">Alto</option></select></label>
      <label>Fila<select value={queue} onChange={(event) => setQueue(event.target.value)}><option value="">Todas as filas</option>{queues.map((item) => <option key={item}>{item}</option>)}</select></label>
      {identity.role === 'admin' && <label>Simular responsável (demo)<select value={previewEmail} onChange={(event) => setPreviewEmail(event.target.value)}><option value="">Todos os responsáveis</option>{analysts.map((email) => <option key={email}>{email}</option>)}</select></label>}
    </div>
    <p className="search-summary" role="status">{tickets.length} {tickets.length === 1 ? 'chamado encontrado' : 'chamados encontrados'}</p>
    {tickets.length ? <ul className="ticket-list" aria-label="Fila de chamados">
      {tickets.map(({ profile, ticket }) => <li key={profile + ticket.id}>
        <Link to={queuePath + '/' + profile + '/' + ticket.id}>
          <div><strong>{ticket.title}</strong><small>{ticket.id} · {audienceLabel[profile]} · {ticket.routing?.queue ?? triageQueue} · {ticket.assignee ?? 'Sem responsável'}</small></div>
          <small>Impacto {ticket.priority === 'Alta' ? 'alto' : 'normal'}</small><StatusLabel status={ticket.status} />
        </Link>
      </li>)}
    </ul> : <Empty title="Nenhum chamado com esses filtros" />}
  </>
}

function SupportTicket({ identity }: { identity: TeamIdentity }) {
  const { audience: profile, ticketId } = useParams()
  if (profile !== 'cliente' && profile !== 'colaborador') return <Empty title="Chamado indisponível"><Link to={queuePath}>Voltar à fila</Link></Empty>
  return <SupportTicketForm key={profile + ticketId} profile={profile} ticketId={ticketId ?? ''} identity={identity} />
}

function SupportTicketForm({ profile, ticketId, identity }: { profile: Profile, ticketId: string, identity: TeamIdentity }) {
  const [pending, setPending] = useState(false)
  const [ticket, setTicket] = useState(() => readTickets(profile).find(({ id }) => id === ticketId))
  const [message, setMessage] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  if (!ticket || !identity.role || !canHandleTicket(ticket, identity.role, identity.email)) return <Empty title="Chamado indisponível"><Link to={queuePath}>Voltar à fila</Link></Empty>

  async function apply(kind: 'claim' | 'reply' | 'resolve') {
    setError('')
    setFeedback('')
    setPending(true)
    try {
      const current = await requireTeamRole()
      const savedTicket = readTickets(profile).find(({ id }) => id === ticketId)
      if (!savedTicket || !current.role || !canHandleTicket(savedTicket, current.role, current.email)) {
        throw new Error('Sua conta não tem acesso a este chamado.')
      }
      setTicket(updateTicket(profile, ticketId, kind === 'claim' ? { kind } : { kind, text: message }))
      setMessage('')
      setFeedback(kind === 'claim' ? 'Chamado assumido.' : kind === 'reply' ? 'Resposta publicada na linha do tempo.' : 'Solução registrada e chamado resolvido.')
    } catch (failure) {
      setError(failure instanceof Error ? failure.message : 'Não foi possível atualizar o chamado.')
      setTicket(readTickets(profile).find(({ id }) => id === ticketId))
    } finally {
      setPending(false)
    }
  }

  return <>
    <Link className="back" to={queuePath}>Voltar à fila</Link>
    <Heading title={ticket.title} description={ticket.id + ' · ' + audienceLabel[profile] + ' · ' + ticket.category} />
    <div className="detail-grid">
      <section className="card team-ticket">
        <div className="section-heading"><h2>Atendimento</h2><StatusLabel status={ticket.status} /></div>
        <p className="preserve">{ticket.description}</p>
        <dl><dt>Responsável</dt><dd>{ticket.assignee ?? 'Sem responsável'}</dd>
          {ticket.routing && <><dt>Centro de custo</dt><dd>{ticket.routing.centerName ?? 'Sem centro informado'}</dd><dt>Fila</dt><dd>{ticket.routing.queue}</dd></>}
        </dl>
        {ticket.context && <><h3>Resumo do diagnóstico</h3><ContextDetails context={ticket.context} /></>}
        {ticket.status === 'Aberto' && <button className="button primary" disabled={pending} onClick={() => void apply('claim')}>Assumir chamado</button>}
        {ticket.status === 'Em atendimento' && <div className="team-editor">
          <label>Resposta ou solução<textarea value={message} rows={4} maxLength={1200} onChange={(event) => setMessage(event.target.value)} /></label>
          <div className="actions"><button className="button secondary" disabled={pending || !message.trim()} onClick={() => void apply('reply')}>Publicar resposta</button><button className="button primary" disabled={pending || !message.trim()} onClick={() => void apply('resolve')}>Registrar solução e resolver</button></div>
        </div>}
        {ticket.resolution && <><h3>Solução registrada</h3><p className="preserve">{ticket.resolution}</p></>}
        {error && <p role="alert" className="alert error">{error}</p>}
        {feedback && <p role="status" className="alert success">{feedback}</p>}
        <Link className="back" to={'/' + profile + '/chamados/' + ticket.id}>Ver como solicitante</Link>
      </section>
      <TicketTimeline ticket={ticket} />
    </div>
  </>
}

function Administration() {
  const [profile, setProfile] = useState<Profile>('colaborador')
  const [article, setArticle] = useState('')
  const topics = getTopics(profile)
  const selected = topics.find(({ id }) => id === article)
  const indicators = sessionMetrics()
  const metrics = [
    { label: 'Autoatendimentos iniciados', value: indicators.started },
    { label: 'Resoluções confirmadas', value: indicators.resolved },
    { label: 'Sessões com chamado registrado', value: indicators.escalated },
  ]
  return <>
    <SettingsHeading title="Painel administrativo" description="Acompanhe os resultados da demonstração e mantenha as orientações dos portais." />
    <dl className="metric-grid">{metrics.map(({ label, value }) => <div className="card" key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
    <p className="search-summary">Indicadores deste navegador. Uma sessão pode registrar mais de um desfecho.</p>
    <section className="card admin-knowledge" aria-labelledby="admin-knowledge">
      <header className="ticket-section-title"><span className="icon-box"><BookOpen size={20} aria-hidden /></span><div><h2 id="admin-knowledge">Base de conhecimento</h2><p>As edições são usadas pela busca, pelos artigos e pelo assistente neste navegador.</p></div></header>
      <div className="filter-bar">
        <label>Portal<select value={profile} onChange={(event) => { setProfile(event.target.value as Profile); setArticle('') }}>{audiences.map((item) => <option key={item} value={item}>{audienceLabel[item]}</option>)}</select></label>
        <label>Artigo<select value={article} onChange={(event) => setArticle(event.target.value)}><option value="">Selecione um artigo</option>{topics.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label>
      </div>
      {selected && <ArticleEditor key={profile + selected.id} profile={profile} topic={selected} />}
    </section>
  </>
}

function ArticleEditor({ profile, topic }: { profile: Profile, topic: Topic }) {
  const [feedback, setFeedback] = useState<{ text: string, error: boolean }>()
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const fields = new FormData(event.currentTarget)
    const value = (key: string) => String(fields.get(key) ?? '').trim()
    const lines = (key: string) => value(key).split('\n').map((line) => line.trim()).filter(Boolean)
    const title = value('title')
    const description = value('description')
    const question = value('question')
    const steps = lines('steps')
    const keywords = value('keywords').split(',').map((word) => word.trim()).filter(Boolean)
    const alternate = lines('alternate')
    if (!title || !description || !question || !steps.length || !keywords.length) {
      setFeedback({ text: 'Preencha título, descrição, palavras-chave, pergunta e orientações.', error: true })
      return
    }
    try {
      await requireTeamRole(true)
      saveTopic(profile, { ...topic, title, description, question, steps, keywords, alternate: alternate.length ? alternate : undefined })
      setFeedback({ text: 'Artigo atualizado neste navegador.', error: false })
    } catch {
      setFeedback({ text: 'O navegador não conseguiu salvar o artigo.', error: true })
    }
  }
  return <form className="ticket-form team-editor" onSubmit={submit}>
    <div className="ticket-section-title"><TopicIcon id={topic.id} /><h3>Editar artigo</h3></div>
    <label>Título<input name="title" required maxLength={90} defaultValue={topic.title} /></label>
    <label>Descrição<input name="description" required maxLength={180} defaultValue={topic.description} /></label>
    <label>Palavras-chave separadas por vírgula<input name="keywords" required maxLength={500} defaultValue={topic.keywords.join(', ')} /></label>
    <label>Pergunta de triagem<input name="question" required maxLength={200} defaultValue={topic.question} /></label>
    <label>Orientações, uma por linha<textarea name="steps" required rows={4} maxLength={1600} defaultValue={topic.steps.join('\n')} /></label>
    <label>Orientações para resposta negativa, uma por linha<textarea name="alternate" rows={4} maxLength={1600} defaultValue={topic.alternate?.join('\n')} /></label>
    {feedback && <p className={'alert ' + (feedback.error ? 'error' : 'success')} role={feedback.error ? 'alert' : 'status'}>{feedback.text}</p>}
    <div className="actions"><button className="button primary">Salvar artigo</button><Link className="button secondary" to={'/' + profile + '/conhecimento/' + topic.id}>Consultar no portal</Link></div>
  </form>
}
