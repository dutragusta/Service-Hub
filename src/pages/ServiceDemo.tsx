import { ArrowRight, ClipboardList, Mail, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Heading, KnowledgeSource } from '../components/ui'
import { getTopics, knowledgeReference } from '../services/operations'

type Stage = 'ready' | 'guidance' | 'queue' | 'review' | 'closed'
type Event = { title: string; detail: string }

const protocol = 'DEMO-1042'
const emailReport = 'A página de login abre, mas não consigo entrar no portal com a minha conta.'
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
  const [rating, setRating] = useState<number>()
  const topic = getTopics('cliente').find((item) => item.id === 'portal')
  const canAnswer = Boolean(topic?.steps.length)
  const outcome = states[stage === 'ready' ? 'guidance' : stage]
  const guidance = topic?.steps ?? []

  function advance(next: Stage, ...events: Event[]) {
    setHistory((previous) => [...previous, ...events])
    setStage(next)
  }

  function receiveEmail() {
    advance(canAnswer ? 'guidance' : 'queue',
      { title: 'E-mail recebido', detail: `Chamado ${protocol} aberto na simulação.` },
      { title: 'Triagem automática', detail: canAnswer
        ? 'Categoria sugerida: Acesso ao portal. Prioridade: normal. Há uma orientação cadastrada para este cenário.'
        : 'Sem orientação cadastrada para este cenário. Encaminhamento sugerido: Suporte ao cliente.' },
      ...(canAnswer ? [{ title: 'Orientação enviada', detail: 'A resposta usa a base do protótipo e aguarda a confirmação do cliente.' }] : []))
  }

  function escalate() {
    const detail = 'O cliente conferiu a conta e tentou a recuperação pelo portal, mas continua sem acesso.'
    setFollowUp(detail)
    advance('queue',
      { title: 'Cliente respondeu ao mesmo protocolo', detail },
      { title: 'Encaminhado para Suporte ao cliente', detail: 'A categoria e a fila foram sugeridas. O analista recebe o relato e o resultado da orientação.' })
  }

  function reset() {
    setStage('ready')
    setHistory([])
    setFollowUp('')
    setRating(undefined)
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
              <dt>Fila sugerida</dt><dd>Suporte ao cliente</dd>
              <dt>Relato original</dt><dd>{emailReport}</dd>
              <dt>Orientação enviada</dt><dd>{followUp ? guidance.join(' ') : 'Nenhuma orientação disponível para este cenário.'}</dd>
              {followUp && topic && <><dt>Artigo usado</dt><dd><KnowledgeSource profile="cliente" article={knowledgeReference(topic)} /></dd></>}
              <dt>Retorno do cliente</dt><dd>{followUp || 'Aguardando atendimento.'}</dd>
            </dl>
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
      <div className="actions"><button type="button" className="button secondary" onClick={reset}><RotateCcw size={17} aria-hidden /> Reiniciar demonstração</button></div>
    </>}
  </>
}
