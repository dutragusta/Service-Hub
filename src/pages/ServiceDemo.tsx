import { ArrowRight, ClipboardList, Mail, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heading, KnowledgeSource } from '../components/ui'
import { getTopics, knowledgeReference } from '../services/operations'
import { SummaryDetails } from '../components/TicketSummary'
import { demoIncidents } from '../data/demo-incidents'
import { routeCustomerTicket } from '../services/routing'
import { summarizeTicket } from '../services/summarization'
import type { TicketSummary } from '../types'

type Stage = 'ready' | 'guidance' | 'queue' | 'review' | 'closed'
type Event = { title: string; detail: string }

const protocol = 'DEMO-1042'
const portalQueue = routeCustomerTicket('portal').queue
const emailIncident = demoIncidents.cliente[0]
const emailReport = 'Desde as 10h20, a página de login abre, mas aparece “Acesso indisponível para esta conta”. Preciso acompanhar uma solicitação antes das 12h.'
const states: Record<Exclude<Stage, 'ready'>, { label: string; next: string; statusClass: string }> = {
  guidance: { label: 'Aguardando confirmação', next: 'Cliente testa a orientação', statusClass: 'progress' },
  queue: { label: 'Na fila de suporte', next: 'Analista valida o encaminhamento', statusClass: 'open' },
  review: { label: 'Em atendimento', next: 'Analista registra a solução', statusClass: 'progress' },
  closed: { label: 'Encerrado', next: 'Cliente avalia o atendimento', statusClass: 'resolved' },
}

export function ServiceDemo() {
  const [stage, setStage] = useState<Stage>('ready')
  const [history, setHistory] = useState<Event[]>([])
  const [followUp, setFollowUp] = useState('')
  const [summary, setSummary] = useState<TicketSummary>()
  const [summarizing, setSummarizing] = useState(false)
  const [rating, setRating] = useState<number>()
  const topic = getTopics('cliente').find((item) => item.id === 'portal')
  const canAnswer = Boolean(topic?.steps.length)
  const outcome = states[stage === 'ready' ? 'guidance' : stage]
  const guidance = topic?.steps ?? []

  function advance(next: Stage, ...events: Event[]) {
    setHistory((previous) => [...previous, ...events])
    setStage(next)
  }

  async function generateSummary(detail: string) {
    setSummarizing(true)
    try {
      setSummary(await summarizeTicket({
        ...emailIncident, description: emailReport, profile: 'cliente', category: 'Acesso ao portal',
        channel: 'E-mail simulado', queue: portalQueue,
        tests: detail ? emailIncident.tests : undefined,
        article: detail && topic ? [topic.code, topic.title, topic.revision && 'Revisão ' + topic.revision].filter(Boolean).join(' · ') : undefined,
        guidance: detail ? guidance : undefined, outcome: detail || undefined,
      }))
    } finally {
      setSummarizing(false)
    }
  }

  function receiveEmail() {
    if (!canAnswer) void generateSummary('')
    advance(canAnswer ? 'guidance' : 'queue',
      { title: 'E-mail recebido', detail: `Chamado ${protocol} aberto na simulação.` },
      { title: 'Triagem automática', detail: canAnswer
        ? 'Categoria sugerida: Acesso ao portal. Prioridade: normal. Há uma orientação cadastrada para este cenário.'
        : 'Sem orientação cadastrada para este cenário. Encaminhamento sugerido: ' + portalQueue + '.' },
      ...(canAnswer ? [{ title: 'Orientação enviada', detail: 'A resposta usa a base do protótipo e aguarda a confirmação do cliente.' }] : []))
  }

  function escalate() {
    const detail = 'Às 10h45, o cliente confirmou a recuperação pelo portal. A nova tentativa em janela privativa exibiu a mesma recusa. O acesso continua indisponível.'
    setFollowUp(detail)
    void generateSummary(detail)
    advance('queue',
      { title: 'Cliente respondeu ao mesmo protocolo', detail },
      { title: 'Encaminhado para ' + portalQueue, detail: 'A categoria e a fila foram sugeridas. O analista recebe o relato e o resultado da orientação.' })
  }

  function reset() {
    setStage('ready')
    setHistory([])
    setFollowUp('')
    setRating(undefined)
    setSummary(undefined)
  }

  return <>
    <Link className="back" to="/cliente">Voltar ao portal do cliente</Link>
    <Heading title="Do e-mail à resolução" description="Demonstração guiada com dados fictícios. O e-mail, a triagem e o encaminhamento são simulados." />
    {stage === 'ready' ? <section className="card demo-intake" aria-labelledby="demo-intake-title">
      <span className="icon-box"><Mail size={21} aria-hidden /></span>
      <h2 id="demo-intake-title">E-mail de teste</h2>
      <p><strong>Assunto</strong> · Dificuldade de acesso ao portal</p>
      <blockquote>{emailReport}</blockquote>
      <div className="actions"><button className="button primary" type="button" onClick={receiveEmail}>Simular recebimento <ArrowRight size={17} aria-hidden /></button></div>
    </section> : <>
      <section className="card ticket-overview" aria-label="Resumo do chamado" aria-live="polite">
        <dl>
          <div><dt>Protocolo</dt><dd><strong>{protocol}</strong></dd></div>
          <div><dt>Canal</dt><dd>E-mail simulado</dd></div>
          <div><dt>Status</dt><dd><span className={`status ${outcome.statusClass}`}>{outcome.label}</span></dd></div>
          <div><dt>Próxima ação</dt><dd>{rating ? 'Atendimento avaliado' : outcome.next}</dd></div>
        </dl>
      </section>
      <div className="detail-grid demo-story">
        <section className="card" aria-labelledby="demo-action-title">
          {stage === 'guidance' && <>
            <h2 id="demo-action-title">Orientação ao cliente</h2>
            {topic && <KnowledgeSource profile="cliente" article={knowledgeReference(topic)} />}
            <ol className="steps">{guidance.map((step) => <li key={step}>{step}</li>)}</ol>
            <h3>Isso resolveu?</h3>
            <div className="actions">
              <button type="button" className="button primary" onClick={() => advance('closed', { title: 'Cliente confirmou a resolução', detail: 'O chamado foi encerrado após a confirmação do cliente.' })}>Sim, resolveu</button>
              <button type="button" className="button secondary" onClick={escalate}>Ainda preciso de ajuda</button>
            </div>
          </>}
          {(stage === 'queue' || stage === 'review') && <>
            <h2 id="demo-action-title">Simulação da visão do analista</h2>
            <dl className="demo-handoff">
              <dt>Categoria sugerida</dt><dd>Acesso ao portal</dd>
              <dt>Fila sugerida</dt><dd>{portalQueue}</dd>
              <dt>Relato original</dt><dd>{emailReport}</dd>
              <dt>Orientação enviada</dt><dd>{followUp ? guidance.join(' ') : 'Nenhuma orientação disponível para este cenário.'}</dd>
              {followUp && topic && <><dt>Artigo usado</dt><dd><KnowledgeSource profile="cliente" article={knowledgeReference(topic)} /></dd></>}
              <dt>Retorno do cliente</dt><dd>{followUp || 'Aguardando atendimento.'}</dd>
            </dl>
            {summarizing && <p role="status">Montando o resumo para o suporte…</p>}
            {summary && <SummaryDetails summary={summary} />}
            <div className="actions">{stage === 'queue'
              ? <button type="button" className="button primary" onClick={() => advance('review', { title: 'Analista validou e assumiu', detail: 'Categoria e fila confirmadas. O atendimento continua com o mesmo protocolo.' })}>Validar e assumir chamado</button>
              : <button type="button" className="button primary" onClick={() => advance('closed', { title: 'Analista registrou a solução', detail: 'Nesta simulação, a equipe regularizou a associação da conta do cliente. O cliente confirmou que voltou a acessar o portal.' })}>Registrar solução simulada</button>}</div>
          </>}
          {stage === 'closed' && <>
            <h2 id="demo-action-title">Pesquisa de satisfação</h2>
            {rating ? <p className="alert success" role="status">Avaliação registrada nesta simulação: {rating} de 5.</p> : <>
              <p>Como você avalia o atendimento deste chamado? Use 1 para ruim e 5 para ótimo.</p>
              <div className="actions" role="group" aria-label="Nota de satisfação">
                {[1, 2, 3, 4, 5].map((value) => <button type="button" className="button secondary" key={value} aria-label={`Avaliar com nota ${value}`} onClick={() => { setRating(value); setHistory((previous) => [...previous, { title: 'Atendimento avaliado', detail: `Nota registrada na demonstração: ${value} de 5.` }]) }}>{value}</button>)}
              </div>
            </>}
          </>}
        </section>
        <section className="card" aria-labelledby="demo-history-title">
          <h2 className="demo-icon-title" id="demo-history-title"><ClipboardList size={20} aria-hidden /> Histórico do chamado</h2>
          <ol className="ticket-timeline" aria-live="polite">{history.map((item) => <li key={item.title}><strong>{item.title}</strong><p>{item.detail}</p></li>)}</ol>
        </section>
      </div>
      <div className="actions"><button type="button" className="button secondary" onClick={reset} disabled={summarizing}><RotateCcw size={17} aria-hidden /> Reiniciar demonstração</button></div>
    </>}
  </>
}
