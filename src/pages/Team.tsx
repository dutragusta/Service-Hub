import { responseSla, slaLabels } from '../services/response-sla'
import { SummaryDetails } from '../components/TicketSummary'
import { Permissions } from './Permissions'
import { PortalAccounts } from './PortalAccess'
import { canHandleTicket, triageQueue } from '../services/routing'
import { deskPath, queuePath, requireTeamRole, settingsPath, type TeamIdentity, type TeamRole } from '../services/access'
import { BarChart3, BookOpen, Building2, Users } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, Navigate, NavLink, Route, Routes, useParams, useSearchParams } from 'react-router-dom'
import { Empty, Heading, StatusLabel, TopicIcon } from '../components/ui'
import { getTopics, saveTopic, sessionMetrics } from '../services/operations'
import { formatDateTime, normalize, readTickets, updateTicket } from '../services/support'
import type { Profile, Topic } from '../types'
import { ContextDetails, TicketTimeline } from './Tickets'

const statuses = ['Aberto', 'Em atendimento', 'Resolvido'] as const
const audienceLabel = { colaborador: 'Colaborador', cliente: 'Cliente' }

function Restricted() {
  return <Empty title="Acesso restrito"><Link to="/acesso/equipe">Ir para o acesso da equipe</Link></Empty>
}

export function TeamSettings({ role }: { role?: TeamRole | null }) {
  if (role === undefined) return <p role="status">Verificando acesso…</p>
  if (role !== 'admin') return <Restricted />

  return <>
    <Heading title="Configurações" description="Gerencie o acesso da equipe e as configurações do Service Hub." />
    <div className="settings-layout">
      <nav className="settings-nav" aria-label="Navegação de configurações">
        <NavLink to={settingsPath} end><Users size={18} aria-hidden /> Usuários</NavLink>
        <NavLink to={settingsPath + '/clientes'}><Building2 size={18} aria-hidden /> Clientes</NavLink>
        <NavLink to={settingsPath + '/visao-geral'}><BarChart3 size={18} aria-hidden /> Visão geral</NavLink>
      </nav>
      <div className="settings-content">
        <Routes>
          <Route index element={<Permissions />} />
          <Route path="clientes" element={<PortalAccounts key="cliente" profile="cliente" />} />
          <Route path="permissoes" element={<Navigate replace to={settingsPath} />} />
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

function accessibleTickets(identity: TeamIdentity) {
  return readTickets('cliente').filter((ticket) => identity.role && (identity.demo || canHandleTicket(ticket, identity.role, identity.email)))
}

export function TeamDashboard({ identity }: { identity?: TeamIdentity }) {
  if (identity === undefined) return <p role="status">Verificando acesso…</p>
  if (!identity.role) return <Restricted />
  const tickets = accessibleTickets(identity)
  const now = Date.now()
  const pending = tickets.filter((ticket) => ticket.status !== 'Resolvido')
  const atRisk = pending.filter((ticket) => ['near', 'late'].includes(responseSla(ticket, now).status))
  const evaluations = tickets.flatMap((ticket) => ticket.rating === undefined ? [] : [ticket.rating])
  const average = evaluations.length ? new Intl.NumberFormat('pt-BR', { maximumFractionDigits: 1 }).format(evaluations.reduce((sum, rating) => sum + rating, 0) / evaluations.length) + ' / 5' : 'Sem avaliações'
  return <>
    <Heading title="Painel de atendimento" description="Acompanhe os chamados dos clientes e as metas de primeira resposta." />
    {identity.demo && <p className="alert">Demonstração local. Indicadores calculados com os chamados deste navegador.</p>}
    <dl className="metric-grid desk-metrics">
      <div className="card"><dt>Chamados ativos</dt><dd>{pending.length}</dd><Link to={queuePath + '?status=ativos'}>Ver ativos</Link></div>
      <div className="card"><dt>Prazo próximo ou vencido</dt><dd>{atRisk.length}</dd><Link to={queuePath + '?sla=atencao'}>Ver prioridades</Link></div>
      <div className="card"><dt>Resolvidos</dt><dd>{tickets.length - pending.length}</dd><Link to={queuePath + '?status=Resolvido'}>Ver resolvidos</Link></div>
      <div className="card"><dt>Satisfação</dt><dd>{average}</dd><small>{evaluations.length} {evaluations.length === 1 ? 'avaliação' : 'avaliações'}</small></div>
    </dl>
    <section className="card saved-context">
      <h2>Metas da demonstração</h2>
      <p>O prazo da primeira resposta é de 4 horas corridas para impacto alto e 24 horas corridas para impacto normal. Mensagens do cliente e notas internas ficam fora dessa contagem.</p>
      <Link className="button primary" to={queuePath}>Abrir fila de suporte</Link>
    </section>
  </>
}

function SupportQueue({ identity }: { identity: TeamIdentity }) {
  const [params, setParams] = useSearchParams()
  const status = params.get('status') ?? ''
  const slaFilter = params.get('sla') ?? ''
  const [impact, setImpact] = useState('')
  const [queue, setQueue] = useState('')
  const [query, setQuery] = useState('')
  const assigned = accessibleTickets(identity)
  const queues = [...new Set(assigned.map((ticket) => ticket.routing?.queue ?? triageQueue))].sort()
  const now = Date.now()
  const tickets = assigned.map((ticket) => ({ ticket, sla: responseSla(ticket, now) }))
    .filter(({ ticket, sla }) => (!status || (status === 'ativos' ? ticket.status !== 'Resolvido' : ticket.status === status))
      && (!impact || ticket.priority === impact) && (!queue || (ticket.routing?.queue ?? triageQueue) === queue)
      && (!slaFilter || (slaFilter === 'atencao' ? ['near', 'late'].includes(sla.status) : sla.status === slaFilter))
      && normalize(ticket.id + ' ' + ticket.title).includes(normalize(query.trim())))
    .sort((a, b) => Number(['near', 'late'].includes(b.sla.status)) - Number(['near', 'late'].includes(a.sla.status))
      || Number(b.ticket.priority === 'Alta') - Number(a.ticket.priority === 'Alta') || Date.parse(b.ticket.date) - Date.parse(a.ticket.date))
  function setFilter(key: string, value: string) {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { replace: true })
  }
  return <>
    <Link className="back" to={deskPath}>Voltar ao painel</Link>
    <Heading title="Fila de suporte" description="Assuma um chamado, consulte o diagnóstico e registre a solução." />
    {identity.demo && <p className="alert" role="status">Modo local de apresentação. A conta fictícia pode atender os chamados deste navegador.</p>}
    <div className="filter-bar">
      <label>Status<select value={status} onChange={(event) => setFilter('status', event.target.value)}><option value="">Todos os status</option><option value="ativos">Chamados ativos</option>{statuses.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Impacto<select value={impact} onChange={(event) => setImpact(event.target.value)}><option value="">Todos os impactos</option><option value="Normal">Normal</option><option value="Alta">Alto</option></select></label>
      <label>Fila<select value={queue} onChange={(event) => setQueue(event.target.value)}><option value="">Todas as filas</option>{queues.map((item) => <option key={item}>{item}</option>)}</select></label>
      <label>Primeira resposta<select value={slaFilter} onChange={(event) => setFilter('sla', event.target.value)}>
        <option value="">Todos os prazos</option><option value="atencao">Prazo próximo ou vencido</option><option value="near">Vence em até 2h</option><option value="late">Vencido</option>
      </select></label>
      <label>Buscar chamado<input type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Título ou protocolo" /></label>
    </div>
    <p className="search-summary" role="status">{tickets.length} {tickets.length === 1 ? 'chamado encontrado' : 'chamados encontrados'}</p>
    {tickets.length ? <ul className="ticket-list" aria-label="Fila de chamados">
      {tickets.map(({ ticket, sla }) => <li key={ticket.id}>
        <Link to={queuePath + '/cliente/' + ticket.id}>
          <div><strong>{ticket.title}</strong><small>{ticket.id} · {ticket.routing?.queue ?? triageQueue} · {ticket.assignee ?? 'Sem responsável'}</small></div>
          <small>Impacto {ticket.priority === 'Alta' ? 'alto' : 'normal'}<br />{slaLabels[sla.status]}</small><StatusLabel status={ticket.status} />
        </Link>
      </li>)}
    </ul> : <Empty title="Nenhum chamado com esses filtros" />}
  </>
}

function SupportTicket({ identity }: { identity: TeamIdentity }) {
  const { audience: profile, ticketId } = useParams()
  if (profile !== 'cliente') return <Empty title="Chamado indisponível"><Link to={queuePath}>Voltar à fila</Link></Empty>
  return <SupportTicketForm key={profile + ticketId} profile={profile} ticketId={ticketId ?? ''} identity={identity} />
}

function SupportTicketForm({ profile, ticketId, identity }: { profile: Profile, ticketId: string, identity: TeamIdentity }) {
  const [pending, setPending] = useState(false)
  const [ticket, setTicket] = useState(() => readTickets(profile).find(({ id }) => id === ticketId))
  const [message, setMessage] = useState('')
  const [note, setNote] = useState('')
  const [feedback, setFeedback] = useState('')
  const [error, setError] = useState('')
  if (!ticket || !identity.role || (!identity.demo && !canHandleTicket(ticket, identity.role, identity.email))) return <Empty title="Chamado indisponível"><Link to={queuePath}>Voltar à fila</Link></Empty>

  async function apply(kind: 'claim' | 'reply' | 'resolve' | 'note') {
    setError('')
    setFeedback('')
    setPending(true)
    try {
      const current = await requireTeamRole()
      const savedTicket = readTickets(profile).find(({ id }) => id === ticketId)
      if (!savedTicket || !current.role || (!current.demo && !canHandleTicket(savedTicket, current.role, current.email))) {
        throw new Error('Sua conta não tem acesso a este chamado.')
      }
      setTicket(updateTicket(profile, ticketId, kind === 'claim' ? { kind } : { kind, text: kind === 'note' ? note : message }))
      if (kind === 'note') setNote('')
      else setMessage('')
      setFeedback(kind === 'claim' ? 'Chamado assumido.' : kind === 'reply' ? 'Resposta publicada na linha do tempo.' : kind === 'note' ? 'Nota interna registrada.' : 'Solução registrada e chamado resolvido.')
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
          {ticket.routing && <><dt>Fila</dt><dd>{ticket.routing.queue}</dd></>}
        </dl>
        {ticket.summary && <SummaryDetails summary={ticket.summary} />}
        {ticket.context && <><h3>Resumo do diagnóstico</h3><ContextDetails context={ticket.context} /></>}
        {ticket.status === 'Aberto' && <button className="button primary" disabled={pending} onClick={() => void apply('claim')}>Assumir chamado</button>}
        {ticket.status === 'Em atendimento' && <div className="team-editor">
          <label>Resposta rápida<select value="" onChange={(event) => { if (event.target.value) setMessage(message ? message + '\n\n' + event.target.value : event.target.value) }}>
            <option value="">Selecionar modelo</option>
            <option value="Recebemos sua solicitação e estamos analisando o relato e os testes já realizados.">Confirmar recebimento</option>
            <option value="Pode informar quando o erro ocorreu e qual mensagem apareceu? Evite compartilhar senhas ou códigos.">Pedir evidências</option>
          </select></label>
          <label>Resposta ou solução<textarea value={message} rows={4} maxLength={1200} onChange={(event) => setMessage(event.target.value)} /></label>
          <div className="actions"><button className="button secondary" disabled={pending || !message.trim()} onClick={() => void apply('reply')}>Publicar resposta</button><button className="button primary" disabled={pending || !message.trim()} onClick={() => void apply('resolve')}>Registrar solução e resolver</button></div>
        </div>}
        <section className="saved-context team-editor">
          <h3>Notas internas</h3>
          <p>Visíveis na área da equipe na demonstração.</p>
          {(ticket.internalNotes ?? []).map(({ at, text }, index) => <div key={at + index}><small>{formatDateTime(at)}</small><p className="preserve">{text}</p></div>)}
          {ticket.status !== 'Resolvido' && <>
            <label>Nova nota interna<textarea value={note} onChange={(event) => setNote(event.target.value)} rows={3} maxLength={1200} /></label>
            <div><button className="button secondary" type="button" disabled={pending || !note.trim()} onClick={() => void apply('note')}>Salvar nota interna</button></div>
          </>}
        </section>
        {ticket.rating !== undefined && <p>Avaliação do cliente: {ticket.rating} de 5.</p>}
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
  const profile = 'cliente' as const
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
