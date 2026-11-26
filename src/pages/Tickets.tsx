import { responseSla, slaLabels } from '../services/response-sla'
import { getTopics, recordSession } from '../services/operations'
import { CheckCircle2, ClipboardList, Info, MessageSquare, Paperclip, Plus, TicketPlus } from 'lucide-react'
import { useRef, useState, type FormEvent } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { Empty, Heading, KnowledgeSource, StatusLabel } from '../components/ui'
import { formatDate, formatDateTime, isTicketComplete, looksSensitive, readTickets, recordTicketEmail, saveTicket, updateTicket, type TicketAction } from '../services/support'
import { customerReviewCategories, customerReviewCategory, readCostCenters, routeCustomerTicket, routeInternalTicket } from '../services/routing'
import { SummaryDetails } from '../components/TicketSummary'
import { TicketImages } from '../components/TicketImages'
import { notifyTicket } from '../services/ticket-email'
import { ticketImageLimit } from '../services/ticket-images'
import { demoIncidents } from '../data/demo-incidents'
import { summarizeTicket } from '../services/summarization'
import { cleanSummaryInput } from '../services/ticket-summary.mjs'
import type { IncidentDetails, Priority, Profile, Ticket, TicketContext, TicketEmailStatus, TicketEvent, TicketImage } from '../types'

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
  <div className="filter-bar"><label>Status<select value={filter} onChange={(event) => setFilter(event.target.value)}><option value="">Todos os status</option><option>Aberto</option><option>Em atendimento</option><option>Resolvido</option><option>Encerrado</option></select></label></div>
  <TicketList tickets={tickets} base={base} /></>
}

const incidentFields = [
  ['startedAt', 'Quando começou e com que frequência?'],
  ['environment', 'Em qual dispositivo, aplicativo ou rede?'],
  ['scope', 'Quem mais foi afetado?'],
  ['impact', 'Qual atividade foi afetada?'],
  ['errorMessage', 'Qual mensagem apareceu?'],
  ['tests', 'Quais testes você executou e o que aconteceu?'],
] as const

export function NewTicket({ profile }: { profile: Profile }) {
  const [params] = useSearchParams()
  const routeContext = useLocation().state?.context as TicketContext | undefined
  const context = routeContext?.profile === profile ? routeContext : undefined
  const [includeContext, setIncludeContext] = useState(Boolean(context))
  const [description, setDescription] = useState(context?.report ?? '')
  const [outcome, setOutcome] = useState(context?.outcome ?? '')
  const topics = getTopics(profile)
  const selected = topics.find((topic) => topic.id === params.get('assunto'))
  const reviewCategories = profile === 'cliente' ? customerReviewCategories : []
  const example = demoIncidents[profile].find((item) => item.id === context?.exampleId && (selected ? item.topic === selected.id : item.topic === 'outro' || reviewCategories.some(({ id }) => id === item.topic)))
  const review = profile === 'cliente' && !selected && context?.report ? customerReviewCategory(context.report) : undefined
  const [category, setCategory] = useState(selected?.title ?? review?.title ?? (example ? 'Outro assunto' : ''))
  const [title, setTitle] = useState(example?.title ?? (selected ? 'Dificuldade com ' + selected.title : ''))
  const [center, setCenter] = useState(example?.center ?? '')
  const [priority, setPriority] = useState<Priority>(example?.priority ?? 'Normal')
  const [details, setDetails] = useState<IncidentDetails>({})
  const [showDetails, setShowDetails] = useState(false)
  const [caseLoaded, setCaseLoaded] = useState('')
  const [saving, setSaving] = useState(false)
  const [images, setImages] = useState<TicketImage[]>([])
  const [readingImages, setReadingImages] = useState(false)
  const pending = useRef(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const navigate = useNavigate()
  const base = '/' + profile
  const centers = profile === 'colaborador' ? readCostCenters() : []

  function loadExampleDetails() {
    if (!example) return
    setDetails(example)
    setShowDetails(true)
  }

  function loadExample(id: string) {
    const example = demoIncidents[profile].find((item) => item.id === id)
    if (!example) return
    setCategory(topics.find((topic) => topic.id === example.topic)?.title ?? reviewCategories.find(({ id }) => id === example.topic)?.title ?? 'Outro assunto')
    setCenter(centers.find(({ code }) => code === example.center)?.code ?? '')
    setTitle(example.title)
    setDescription(example.description)
    setPriority(example.priority)
    setDetails(example)
    setCaseLoaded(id)
    setShowDetails(true)
    setErrors({})
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (pending.current || readingImages) return
    const form = event.currentTarget
    const fields = new FormData(form)
    const category = String(fields.get('category') ?? '')
    const title = String(fields.get('title') ?? '').trim()
    const description = String(fields.get('description') ?? '').trim()
    const selectedTopic = form.querySelector<HTMLSelectElement>('select[name=category]')?.selectedOptions[0]?.dataset.topic ?? 'other'
    const routing = profile === 'colaborador' ? routeInternalTicket(String(fields.get('costCenter') ?? ''), selectedTopic) : routeCustomerTicket(selectedTopic)
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
    const savedContext = includeContext && context ? { ...context, outcome: outcome.trim() || undefined } : undefined
    const input = cleanSummaryInput({
      ...details, profile, category, title, description, priority,
      channel: 'Portal ' + (profile === 'cliente' ? 'do cliente' : 'do colaborador'),
      queue: routing.queue,
      center: routing?.centerName,
      report: savedContext?.report, assessment: savedContext?.assessment,
      article: savedContext?.article ? [savedContext.article.code, savedContext.article.title, savedContext.article.revision && 'Revisão ' + savedContext.article.revision].filter(Boolean).join(' · ') : undefined, guidance: savedContext?.guidance, outcome: savedContext?.outcome,
    })
    if (!input) {
      setErrors({ form: 'Revise o texto do chamado. Use dados fictícios e remova e-mails, senhas, tokens ou códigos de autenticação.' })
      return
    }
    pending.current = true
    setSaving(true)
    try {
      const summary = await summarizeTicket(input)
      const at = new Date().toISOString()
      const events = images.map((image) => ({ ...image, type: 'image' as const, at }))
      const ticket = saveTicket(profile, { category, title, description, priority, routing, context: savedContext, summary, events })
      const emailStatus = profile === 'cliente' ? await notifyTicket(ticket) : undefined
      if (emailStatus) {
        try { recordTicketEmail(profile, ticket.id, emailStatus) } catch { /* O registro original permanece salvo. */ }
      }
      if (context?.sessionId && context.sessionSource) recordSession(context.sessionId, profile, context.sessionSource, 'escalated')
      navigate(base + '/chamados/' + ticket.id, { replace: true, state: { created: true, emailStatus } })
    } catch {
      setErrors({ form: 'Não foi possível salvar. Verifique se o navegador permite armazenamento local e tente novamente.' })
    } finally {
      pending.current = false
      setSaving(false)
    }
  }

  return <><Link className="back" to={base + '/chamados'}>Voltar aos chamados</Link>
    <Heading title="Abrir chamado" description="Informe o que aconteceu para a equipe de suporte entender o caso." />
    <div className="ticket-create-layout">
      <form id="new-ticket-form" className="card ticket-form" noValidate onSubmit={submit}>
        <header className="ticket-section-title"><span className="icon-box"><TicketPlus size={21} aria-hidden /></span><div><h2>Detalhes da solicitação</h2><p>Categoria, título e descrição são obrigatórios.</p></div></header>
        {errors.form && <p className="alert error" role="alert">{errors.form}</p>}
        <fieldset disabled={saving} className="incident-fields">
        {!context && <label>Preencher com caso fictício
          <select value={caseLoaded} onChange={(event) => { if (event.target.value) loadExample(event.target.value); else setCaseLoaded('') }}>
            <option value="">Escolher exemplo</option>
            {demoIncidents[profile].map(({ id, title }) => <option key={id} value={id}>{title}</option>)}
          </select>
        </label>}
        <label>Categoria<select name="category" required value={category} onChange={(event) => setCategory(event.target.value)} aria-invalid={Boolean(errors.category)} aria-describedby={errors.category ? 'category-error' : undefined}>
          <option value="">Selecione o assunto</option>{[...topics, ...reviewCategories].map(({ id, title }) => <option key={id} data-topic={id}>{title}</option>)}<option>Outro assunto</option>
        </select>{errors.category && <span className="field-error" id="category-error" role="alert">{errors.category}</span>}</label>
        {profile === 'colaborador' && <label>Centro de custo
          <select name="costCenter" value={center} onChange={(event) => setCenter(event.target.value)}><option value="">Sem centro informado</option>{centers.map(({ code, name }) => <option key={code} value={code}>{code} · {name}</option>)}</select>
          <small>Centros da demonstração. Chamados sem regra seguem para a triagem geral.</small>
        </label>}
        <label>Título<input name="title" required maxLength={90} placeholder="Resuma o problema em uma frase" value={title} onChange={(event) => setTitle(event.target.value)} aria-invalid={Boolean(errors.title)} aria-describedby={errors.title ? 'title-error' : undefined} />
          {errors.title && <span className="field-error" id="title-error" role="alert">{errors.title}</span>}</label>
        <label>Descrição<textarea name="description" required rows={5} maxLength={1200} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Quando começou? O que você estava tentando fazer? Qual mensagem apareceu?" aria-invalid={Boolean(errors.description)} aria-describedby={errors.description ? 'description-error privacy' : 'privacy'} />
          {errors.description && <span className="field-error" id="description-error" role="alert">{errors.description}</span>}
          <span className="form-note"><small id="privacy">Evite senhas, tokens e códigos de autenticação.</small><small>{description.length}/1200</small></span></label>
        <fieldset className="priority-field"><legend>Qual é o impacto?</legend>
          <div className="priority-options">
            <label><input type="radio" name="priority" value="Normal" checked={priority === 'Normal'} onChange={() => setPriority('Normal')} /><span>Normal<small>A atividade pode continuar.</small></span></label>
            <label><input type="radio" name="priority" value="Alta" checked={priority === 'Alta'} onChange={() => setPriority('Alta')} /><span>Alto<small>Uma atividade essencial está parada.</small></span></label>
          </div>
        </fieldset>
        {example && <button type="button" className="button secondary" onClick={loadExampleDetails}>Preencher evidências fictícias</button>}
        <button type="button" className="button secondary" aria-expanded={showDetails} aria-controls="incident-details" onClick={() => setShowDetails(!showDetails)}>{showDetails ? 'Recolher condições do incidente' : 'Adicionar condições do incidente'}</button>
        <div id="incident-details" className="incident-fields" hidden={!showDetails}>
          {incidentFields.map(([field, label]) => <label key={field}>{label}<textarea rows={field === 'tests' ? 3 : 2} maxLength={600} value={details[field] ?? ''} onChange={(event) => setDetails({ ...details, [field]: event.target.value })} /></label>)}
        </div>
        {profile === 'cliente' && <TicketImages images={images} onChange={setImages} onReading={setReadingImages} />}
        </fieldset>
        {saving && <p role="status">Preparando o chamado e as notificações…</p>}
        <div className="actions ticket-submit"><button className="button primary" disabled={saving || readingImages}>Registrar chamado</button>{!saving && <Link className="button secondary" to={base + '/chamados'}>Cancelar</Link>}</div>
      </form>
      <aside className="card ticket-guide">
        {context ? <>
          <header className="ticket-section-title"><span className="icon-box"><ClipboardList size={20} aria-hidden /></span><h2>Contexto do atendimento</h2></header>
          <p>Revise o resumo e confirme quais testes foram feitos antes de registrar.</p>
          <ContextDetails context={{ ...context, outcome: undefined }} />
          <label>Resultado dos testes
            <textarea form="new-ticket-form" name="outcome" rows={3} maxLength={600} value={outcome} onChange={(event) => setOutcome(event.target.value)}
              disabled={!includeContext || saving} placeholder="Ex.: testei em outro navegador e a falha continuou."
              aria-invalid={Boolean(errors.outcome)} aria-describedby={errors.outcome ? 'outcome-error' : undefined} />
            {errors.outcome && <span id="outcome-error" className="field-error" role="alert">{errors.outcome}</span>}
          </label>
          <label className="context-toggle"><input type="checkbox" checked={includeContext} disabled={saving} onChange={(event) => setIncludeContext(event.target.checked)} /> Incluir contexto no chamado</label>
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

const emailMessages: Record<TicketEmailStatus, string> = {
  sent: 'E-mails com o protocolo e a solicitação encaminhados ao cliente e ao suporte.',
  demo: 'Demonstração. O cliente e o suporte receberiam o protocolo e a solicitação por e-mail.',
  unconfigured: 'Chamado registrado. O envio por e-mail precisa ser configurado neste ambiente.',
  failed: 'Chamado registrado. Não foi possível confirmar o envio dos e-mails.',
}

export function TicketDetail({ profile, id, created, initialEmailStatus }: {
  profile: Profile, id?: string, created: boolean, initialEmailStatus?: TicketEmailStatus
}) {
  const base = '/' + profile
  const [ticket, setTicket] = useState(() => readTickets(profile).find((entry) => entry.id === id))
  const [message, setMessage] = useState('')
  const [feedback, setFeedback] = useState<{ text: string, error: boolean }>()
  const [images, setImages] = useState<TicketImage[]>([])
  const [readingImages, setReadingImages] = useState(false)
  const [confirmClose, setConfirmClose] = useState(false)
  if (!ticket) return <Empty title="Chamado indisponível"><p>Verifique se o número pertence ao perfil atual.</p><Link to={base + '/chamados'}>Voltar aos chamados</Link></Empty>
  const resolved = ticket.status === 'Resolvido'
  const complete = isTicketComplete(ticket.status)
  const emailStatus = ticket.emailStatus ?? initialEmailStatus
  const existingImages = ticket.events?.filter((event) => event.type === 'image').length ?? 0
  const sla = responseSla(ticket)
  function send(action: TicketAction) {
    if (!id) return
    try {
      setTicket(updateTicket(profile, id, action))
      if (action.kind === 'customer-reply') setMessage('')
      if (action.kind === 'images' || action.kind === 'close') setImages([])
      setConfirmClose(false)
      const messages: Partial<Record<TicketAction['kind'], string>> = {
        rate: 'Avaliação registrada.',
        close: 'Chamado encerrado.',
        reopen: 'Chamado reaberto com o mesmo protocolo.',
        images: 'Imagens adicionadas ao chamado.',
      }
      setFeedback({ text: messages[action.kind] ?? 'Atualização adicionada à linha do tempo.', error: false })
    } catch (error) {
      setFeedback({ text: error instanceof Error ? error.message : 'Não foi possível salvar.', error: true })
    }
  }
  const nextAction = complete ? 'Chamado encerrado pelo cliente. Reabra se ainda precisar de ajuda.' : ticket.status === 'Aberto'
    ? ticket.routing ? 'Aguarde o atendimento na fila indicada.' : 'Aguarde a triagem da equipe de suporte.'
    : 'A equipe está analisando o caso. Acompanhe as atualizações na linha do tempo.'
  return <>
    <Link className="back" to={base + '/chamados'}>Voltar aos chamados</Link>
    <Heading title={ticket.title} description={ticket.id + ' · ' + ticket.category} />
    {created && <p className="alert success" role="status">Chamado de demonstração registrado neste navegador.</p>}
    {emailStatus && <p className={'alert ' + (emailStatus === 'sent' ? 'success' : '')} role="status">{emailMessages[emailStatus]}</p>}
    <section className="card ticket-overview" aria-label="Andamento do chamado">
      <dl>
        <div><dt>Status</dt><dd><StatusLabel status={ticket.status} /></dd></div>
        <div><dt>Responsável</dt><dd>{ticket.assignee ?? 'Aguardando atribuição'}</dd></div>
        {ticket.dueAt && <div><dt>Prazo informado</dt><dd><time dateTime={ticket.dueAt}>{formatDateTime(ticket.dueAt)}</time></dd></div>}
        <div><dt>Primeira resposta · meta</dt><dd><time dateTime={sla.deadline}>{formatDateTime(sla.deadline)}</time><br />{slaLabels[sla.status]}</dd></div>
      </dl>
      <div className={'ticket-next ' + (resolved ? 'ticket-solution' : '')}>
        {resolved ? <CheckCircle2 size={22} aria-hidden /> : <Info size={22} aria-hidden />}
        <div><h2>{resolved ? 'Solução' : 'Próxima ação'}</h2>
          <p>{resolved ? ticket.resolution ?? 'Atendimento concluído. A solução não foi registrada neste chamado.' : nextAction}</p></div>
      </div>
      {profile === 'cliente' && <div className="saved-context incident-fields">
        {complete ? <div><button type="button" className="button secondary" onClick={() => send({ kind: 'reopen' })}>Reabrir chamado</button></div>
          : confirmClose ? <>
            <p>Encerrar o atendimento agora? Você pode reabrir o chamado com o mesmo protocolo.</p>
            <div className="actions">
              <button type="button" className="button primary" onClick={() => send({ kind: 'close' })}>Confirmar encerramento</button>
              <button type="button" className="button secondary" onClick={() => setConfirmClose(false)}>Cancelar</button>
            </div>
          </> : <div><button type="button" className="button secondary" disabled={readingImages} onClick={() => setConfirmClose(true)}>Encerrar chamado</button></div>}
      </div>}
    </section>
    <div className="detail-grid">
      <section className="card"><h2>Descrição do chamado</h2><p className="preserve">{ticket.description}</p>
        <dl><dt>Prioridade</dt><dd>{ticket.priority}</dd>
          {ticket.routing && <>
            {profile === 'colaborador' && <><dt>Centro de custo</dt><dd>{ticket.routing.centerName ? ticket.routing.centerCode + ' · ' + ticket.routing.centerName : 'Sem centro informado'}</dd></>}
            <dt>Fila de atendimento</dt><dd>{ticket.routing.queue}</dd></>}
        </dl>
        {ticket.summary && <SummaryDetails summary={ticket.summary} />}
        {ticket.context && <div className="saved-context"><h3>Resumo do diagnóstico</h3><ContextDetails context={ticket.context} /></div>}
        <div className="saved-context team-editor">
          {resolved ? <>
            <h2>Avaliar atendimento</h2>
            {ticket.rating !== undefined ? <p>Nota registrada: {ticket.rating} de 5.</p> : <div className="actions">
              {[1, 2, 3, 4, 5].map((value) => <button key={value} type="button" className="button secondary" aria-label={`Avaliar com nota ${value}`} onClick={() => send({ kind: 'rate', value })}>{value}</button>)}
            </div>}
          </> : !complete && <form className="team-editor" onSubmit={(event) => { event.preventDefault(); send({ kind: 'customer-reply', text: message }) }}>
            <h2>Complementar chamado</h2>
            <label>Mensagem para o suporte<textarea value={message} onChange={(event) => setMessage(event.target.value)} rows={3} maxLength={1200} required /></label>
            <div><button className="button primary" type="submit" disabled={!message.trim()}>Enviar atualização</button></div>
          </form>}
          {profile === 'cliente' && !complete && existingImages < ticketImageLimit && <div className="incident-fields">
            <TicketImages images={images} onChange={setImages} existing={existingImages} onReading={setReadingImages} />
            {images.length > 0 && <div><button className="button secondary" type="button" disabled={readingImages}
              onClick={() => send({ kind: 'images', images })}>Adicionar imagens</button></div>}
          </div>}
          {feedback && <p role={feedback.error ? 'alert' : 'status'} className={feedback.error ? 'alert error' : 'alert success'}>{feedback.text}</p>}
        </div>
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
        {(ticket.summary || ticket.context) && <p>Resumo para o suporte incluído no registro.</p>}</li>
      {events.map((event, index) => <li key={event.at + ':' + index}><TicketUpdate event={event} /></li>)}
    </ol>
  </section>
}

function TicketUpdate({ event }: { event: TicketEvent }) {
  return <>
    <strong>{event.type === 'status' ? event.by === 'cliente' ? (event.status === 'Encerrado' ? 'Chamado encerrado pelo cliente' : 'Chamado reaberto pelo cliente') : 'Status alterado para ' + event.status
      : event.type === 'reply' ? <><MessageSquare size={16} aria-hidden /> {event.author}</>
      : <><Paperclip size={16} aria-hidden /> Anexo adicionado</>}</strong>
    <time dateTime={event.at}>{formatDateTime(event.at)}</time>
    {event.type === 'reply' && <p className="preserve">{event.text}</p>}
    {event.type === 'image' && /^data:image\/webp;base64,[\w+/=]+$/.test(event.dataUrl) &&
      <a className="attachment-link" download={event.name} href={event.dataUrl}>
        <img className="ticket-image-preview" src={event.dataUrl} alt="" /> {event.name}
      </a>}
    {event.type === 'attachment' && <a className="attachment-link" download={event.name} href={'data:text/plain;charset=utf-8,' + encodeURIComponent(event.text)}>{event.name}</a>}
  </>
}
