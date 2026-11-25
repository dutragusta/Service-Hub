import { getTopics, recordSession } from '../services/operations'
import { CheckCircle2, ClipboardList, Info, MessageSquare, Paperclip, Plus, TicketPlus } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Empty, Heading, KnowledgeSource, StatusLabel } from '../components/ui'
import { formatDate, formatDateTime, looksSensitive, readTickets, saveTicket } from '../services/support'
import { readCostCenters, routeInternalTicket } from '../services/routing'
import type { Profile, Ticket, TicketContext, TicketEvent } from '../types'

export function TicketList({ tickets, base }: { tickets: Ticket[], base: string }) {
  if (!tickets.length) return <Empty title="Nenhum chamado encontrado"><p>Novas solicitações aparecem aqui.</p></Empty>
  return <ul className="ticket-list" aria-label="Solicitações">{tickets.map((ticket) => <li key={ticket.id}><Link to={base + '/chamados/' + ticket.id}>
    <div><strong>{ticket.title}</strong><small>{ticket.id} · {ticket.category}</small></div><time dateTime={ticket.date}>{formatDate(ticket.date)}</time><StatusLabel status={ticket.status} />
  </Link></li>)}</ul>
}

export function Tickets({ profile }: { profile: Profile }) {
  const [filter, setFilter] = useState('')
  const base = '/' + profile
  const tickets = readTickets(profile).filter((ticket) => !filter || ticket.status === filter)
  return <><Heading title="Meus chamados" description="Acompanhe as solicitações registradas neste navegador." action={<Link className="button primary" to={base + '/chamados/novo'}><Plus size={18} aria-hidden /> Abrir chamado</Link>} />
  <div className="filter-bar"><label>Status<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">Todos os status</option><option>Aberto</option><option>Em atendimento</option><option>Resolvido</option></select></label></div>
  <TicketList tickets={tickets} base={base} /></>
}

export function NewTicket({ profile }: { profile: Profile }) {
  const [params] = useSearchParams()
  const routeContext = useLocation().state?.context as TicketContext | undefined
  const context = routeContext?.profile === profile ? routeContext : undefined
  const [includeContext, setIncludeContext] = useState(Boolean(context))
  const [description, setDescription] = useState(context?.report ?? '')
  const [outcome, setOutcome] = useState(context?.outcome ?? '')
  const topics = getTopics(profile)
  const selected = topics.find((topic) => topic.id === params.get('assunto'))
  const [errors, setErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()
  const base = '/' + profile
  const centers = profile === 'colaborador' ? readCostCenters() : []

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const fields = new FormData(form)
    const category = String(fields.get('category') ?? '')
    const title = String(fields.get('title') ?? '').trim()
    const description = String(fields.get('description') ?? '').trim()
    const selectedTopic = form.querySelector<HTMLSelectElement>('select[name=category]')?.selectedOptions[0]?.dataset.topic ?? 'other'
    const routing = profile === 'colaborador' ? routeInternalTicket(String(fields.get('costCenter') ?? ''), selectedTopic) : undefined
    const priority = fields.get('priority') === 'Alta' ? 'Alta' : 'Normal'
    const validation: Record<string, string> = {}
    if (!category) validation.category = 'Selecione uma categoria.'
    if (title.length < 5) validation.title = 'Insira um título com pelo menos 5 caracteres.'
    if (description.length < 15) validation.description = 'Descreva o problema em pelo menos 15 caracteres.'
    if (looksSensitive(title)) validation.title = 'Remova senhas, tokens ou códigos do título.'
    if (looksSensitive(description)) validation.description = 'Remova senhas, tokens ou códigos da descrição.'
    if (includeContext && looksSensitive(outcome)) validation.outcome = 'Remova senhas, tokens ou códigos do resultado.'
    setErrors(validation)
    const firstInvalid = Object.keys(validation)[0]
    if (firstInvalid) {
      const input = form.elements.namedItem(firstInvalid)
      if (input instanceof HTMLElement) input.focus()
      return
    }
    try {
      const ticket = saveTicket(profile, { category, title, description, priority, routing, context: includeContext && context ? { ...context, outcome: outcome.trim() || undefined } : undefined })
      if (context?.sessionId && context.sessionSource) recordSession(context.sessionId, profile, context.sessionSource, 'escalated')
      navigate(base + '/chamados/' + ticket.id, { replace: true, state: { created: true } })
    } catch {
      setErrors({ form: 'Não foi possível salvar. Verifique se o navegador permite armazenamento local e tente novamente.' })
    }
  }

  return <><Link className="back" to={base + '/chamados'}>Voltar aos chamados</Link>
    <Heading title="Abrir chamado" description="Informe o que aconteceu para a equipe de suporte entender o caso." />
    <div className="ticket-create-layout">
      <form className="card ticket-form" noValidate onSubmit={submit}>
        <header className="ticket-section-title"><span className="icon-box"><TicketPlus size={21} aria-hidden /></span><div><h2>Detalhes da solicitação</h2><p>Categoria, título e descrição são obrigatórios.</p></div></header>
        {errors.form && <p className="alert error" role="alert">{errors.form}</p>}
        <label>Categoria<select name="category" required defaultValue={selected?.title ?? ''} aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? 'category-error' : undefined}>
          <option value="">Selecione o assunto</option>{topics.map((topic) => <option key={topic.id} data-topic={topic.id}>{topic.title}</option>)}<option>Outro assunto</option>
        </select>{errors.category && <span className="field-error" id="category-error" role="alert">{errors.category}</span>}</label>
        {profile === 'colaborador' && <label>Centro de custo
          <select name="costCenter"><option value="">Sem centro informado</option>{centers.map(({ code, name }) => <option key={code} value={code}>{code} · {name}</option>)}</select>
          <small>Centros da demonstração. Chamados sem regra seguem para a triagem geral.</small>
        </label>}
        <label>Título<input name="title" required maxLength={90} placeholder="Resuma o problema em uma frase" defaultValue={selected ? 'Dificuldade com ' + selected.title : ''} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'title-error' : undefined} />
          {errors.title && <span className="field-error" id="title-error" role="alert">{errors.title}</span>}</label>
        <label>Descrição<textarea name="description" required rows={5} maxLength={1200} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Quando começou? O que você estava tentando fazer? Qual mensagem apareceu?" aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'description-error privacy' : 'privacy'} />
          {errors.description && <span className="field-error" id="description-error" role="alert">{errors.description}</span>}
          <span className="form-note"><small id="privacy">Evite senhas, tokens e códigos de autenticação.</small><small>{description.length}/1200</small></span></label>
        <fieldset className="priority-field"><legend>Qual é o impacto?</legend>
          <div className="priority-options">
            <label><input type="radio" name="priority" value="Normal" defaultChecked /><span>Normal<small>A atividade pode continuar.</small></span></label>
            <label><input type="radio" name="priority" value="Alta" /><span>Alto<small>Uma atividade essencial está parada.</small></span></label>
          </div>
        </fieldset>
        <div className="actions ticket-submit"><button className="button primary">Registrar chamado</button><Link className="button secondary" to={base + '/chamados'}>Cancelar</Link></div>
      </form>
      <aside className="card ticket-guide">
        {context ? <>
          <header className="ticket-section-title"><span className="icon-box"><ClipboardList size={20} aria-hidden /></span><h2>Contexto do atendimento</h2></header>
          <p>Revise o resumo e confirme quais testes foram feitos antes de registrar.</p>
          <ContextDetails context={{ ...context, outcome: undefined }} />
          <label>Resultado dos testes
            <textarea name="outcome" rows={3} maxLength={600} value={outcome} onChange={(event) => setOutcome(event.target.value)}
              disabled={!includeContext} placeholder="Ex.: testei em outro navegador e a falha continuou."
              aria-invalid={Boolean(errors.outcome)} aria-describedby={errors.outcome ? 'outcome-error' : undefined} />
            {errors.outcome && <span id="outcome-error" className="field-error" role="alert">{errors.outcome}</span>}
          </label>
          <label className="context-toggle"><input type="checkbox" checked={includeContext} onChange={(event) => setIncludeContext(event.target.checked)} /> Incluir contexto no chamado</label>
        </> : <>
          <header className="ticket-section-title"><span className="icon-box"><Info size={20} aria-hidden /></span><h2>O que incluir</h2></header>
          <ul className="ticket-guide-list"><li>Quando o problema começou.</li><li>A mensagem de erro e a atividade afetada.</li><li>O que você já tentou fazer.</li></ul>
          <p>Use dados fictícios. O chamado fica salvo neste navegador.</p>
        </>}
      </aside>
    </div>
  </>
}

export function ContextDetails({ context }: { context: TicketContext }) {
  return <div className="ticket-context">
    <p><strong>Origem:</strong> {context.source}</p>
    {context.report && <p className="preserve"><strong>Relato no autoatendimento:</strong> {context.report}</p>}
    {context.article && <KnowledgeSource profile={context.profile} article={context.article} />}
    {context.assessment && <p><strong>Triagem:</strong> {context.assessment}</p>}
    {context.guidance?.length ? <><h3>Orientações apresentadas</h3><ul>{context.guidance.map((item) => <li key={item}>{item}</li>)}</ul></> : null}
    {context.outcome && <p className="preserve"><strong>Resultado dos testes:</strong> {context.outcome}</p>}
  </div>
}

export function TicketDetail({ profile, id, created }: { profile: Profile, id?: string, created: boolean }) {
  const base = '/' + profile
  const ticket = readTickets(profile).find((entry) => entry.id === id)
  if (!ticket) return <Empty title="Chamado indisponível"><p>Verifique se o número pertence ao perfil atual.</p><Link to={base + '/chamados'}>Voltar aos chamados</Link></Empty>
  const resolved = ticket.status === 'Resolvido'
  const nextAction = resolved ? 'Atendimento concluído' : ticket.status === 'Aberto'
    ? ticket.routing ? 'Aguarde o atendimento na fila indicada.' : 'Aguarde a triagem da equipe de suporte.'
    : 'A equipe está analisando o caso. Acompanhe as atualizações na linha do tempo.'
  return <>
    <Link className="back" to={base + '/chamados'}>Voltar aos chamados</Link>
    <Heading title={ticket.title} description={ticket.id + ' · ' + ticket.category} />
    {created && <p className="alert success" role="status">Chamado de demonstração registrado neste navegador.</p>}
    <section className="card ticket-overview" aria-label="Andamento do chamado">
      <dl>
        <div><dt>Status</dt><dd><StatusLabel status={ticket.status} /></dd></div>
        <div><dt>Responsável</dt><dd>{ticket.assignee ?? 'Aguardando atribuição'}</dd></div>
        <div><dt>Prazo</dt><dd>{ticket.dueAt ? <time dateTime={ticket.dueAt}>{formatDateTime(ticket.dueAt)}</time> : resolved ? 'Encerrado' : 'A definir na triagem'}</dd></div>
      </dl>
      <div className={'ticket-next ' + (resolved ? 'ticket-solution' : '')}>
        {resolved ? <CheckCircle2 size={22} aria-hidden /> : <Info size={22} aria-hidden />}
        <div><h2>{resolved ? 'Solução' : 'Próxima ação'}</h2>
          <p>{resolved ? ticket.resolution ?? 'Atendimento concluído. A solução não foi registrada neste chamado.' : nextAction}</p></div>
      </div>
    </section>
    <div className="detail-grid">
      <section className="card"><h2>Descrição do chamado</h2><p className="preserve">{ticket.description}</p>
        <dl><dt>Prioridade</dt><dd>{ticket.priority}</dd>
          {ticket.routing && <><dt>Centro de custo</dt><dd>{ticket.routing.centerName ? ticket.routing.centerCode + ' · ' + ticket.routing.centerName : 'Sem centro informado'}</dd>
            <dt>Fila de atendimento</dt><dd>{ticket.routing.queue}</dd></>}
        </dl>
        {ticket.context && <div className="saved-context"><h3>Resumo do diagnóstico</h3><ContextDetails context={ticket.context} /></div>}
      </section>
      <TicketTimeline ticket={ticket} />
    </div>
  </>
}

export function TicketTimeline({ ticket }: { ticket: Ticket }) {
  const events = [...(ticket.events ?? [])].sort((a, b) => Date.parse(a.at) - Date.parse(b.at))
  return <section className="card"><h2>Linha do tempo</h2>
    <ol className="ticket-timeline">
      <li><strong>Chamado registrado</strong><time dateTime={ticket.date}>{formatDateTime(ticket.date)}</time>
        {ticket.context && <p>Resumo do diagnóstico incluído no registro.</p>}</li>
      {events.map((event, index) => <li key={event.at + ':' + index}><TicketUpdate event={event} /></li>)}
    </ol>
  </section>
}

function TicketUpdate({ event }: { event: TicketEvent }) {
  return <>
    <strong>{event.type === 'status' ? 'Status alterado para ' + event.status
      : event.type === 'reply' ? <><MessageSquare size={16} aria-hidden /> {event.author}</>
      : <><Paperclip size={16} aria-hidden /> Anexo adicionado</>}</strong>
    <time dateTime={event.at}>{formatDateTime(event.at)}</time>
    {event.type === 'reply' && <p className="preserve">{event.text}</p>}
    {event.type === 'attachment' && <a className="attachment-link" download={event.name} href={'data:text/plain;charset=utf-8,' + encodeURIComponent(event.text)}>{event.name}</a>}
  </>
}
