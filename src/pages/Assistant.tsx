import { demoIncidents } from '../data/demo-incidents'
import { knowledgeMode } from '../services/knowledge'
import PromptBar from '../components/PromptBar'
import { getTopics, knowledgeReference, recordSession } from '../services/operations'
import { Check, Headphones, RotateCcw, TicketPlus } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Empty, Heading, KnowledgeSource, TopicIcon } from '../components/ui'
import { profiles } from '../demo'
import { advance, conversationContext, initialConversation, type Conversation } from '../services/conversation'
import { looksSensitive } from '../services/support'
import type { Profile, TicketContext } from '../types'

export { initialConversation, type Conversation } from '../services/conversation'

export function Assistant({ profile, conversation, update }: { profile: Profile, conversation: Conversation, update: (conversation: Conversation) => void }) {
  const [error, setError] = useState('')
  const log = useRef<HTMLDivElement>(null)
  const base = '/' + profile
  const { topic, stage, messages } = conversation
  const context = conversationContext(profile, conversation)
  const ticketUrl = base + '/chamados/novo' + (topic ? '?assunto=' + topic.id : '')
  useEffect(() => {
    if (messages.length > 1) recordSession(conversation.sessionId, profile, 'Assistente')
  }, [conversation.sessionId, profile, messages.length])
  useEffect(() => { if (log.current) log.current.scrollTop = log.current.scrollHeight }, [messages])

  function send(text: string, topicId?: string, exampleId?: string) {
    if (!text.trim()) return false
    if (looksSensitive(text)) {
      setError('Remova senhas, tokens ou códigos antes de enviar a mensagem.')
      return false
    }
    setError('')
    const active = exampleId ? initialConversation() : conversation
    const next = advance(active, profile, text.trim(), topicId)
    if (exampleId) next.exampleId = exampleId
    if (topicId) next.exampleId = undefined
    recordSession(next.sessionId, profile, 'Assistente', next.stage === 'resolved' && stage !== 'resolved' ? 'resolved' : undefined)
    update(next)
    return true
  }

  return <><Heading title="Assistente virtual" description="Encontre orientações e encaminhe o atendimento com o contexto da conversa." />
    <div className="chat-layout assistant-layout">
      <section className="chat-card" aria-label="Atendimento virtual">
        <header className="chat-header"><span className="icon-box"><Headphones size={21} aria-hidden /></span>
          <div><strong>{topic?.title ?? 'Atendimento Service Hub'}</strong><small>{profiles[profile].portal} · {knowledgeMode(profile) === 'servidor' ? 'Base consultada via API' : knowledgeMode(profile) === 'contingencia' ? 'Base de contingência' : 'Base fictícia local'}</small></div>
          <button className="text-button chat-reset" onClick={() => { update(initialConversation()); setError('') }}><RotateCcw size={15} aria-hidden /> Nova conversa</button>
        </header>
        <div className="chat-log" ref={log} role="log" aria-label="Mensagens da conversa" tabIndex={0}>
          {messages.map((message, i) => <div className={'message ' + message.author} key={i}>
            <small>{message.author === 'user' ? 'Você' : 'Assistente Service Hub'}</small><p>{message.text}</p>
            {message.source && <KnowledgeSource article={message.source} profile={profile} context={message.source.id === topic?.id ? context : undefined} />}
          </div>)}
        </div>
        <div className="chat-controls">
          {stage === 'question' && <div className="actions quick-replies">{['Sim', 'Não', 'Não sei'].map((choice) => <button key={choice} className="button secondary" onClick={() => send(choice)}>{choice}</button>)}</div>}
          {stage === 'answer' && <div className="actions quick-replies"><button className="button secondary" onClick={() => send('Sim, resolveu')}>Sim, resolveu</button><button className="button secondary" onClick={() => send('Não, continua')}>Continuo com o problema</button></div>}
          {stage === 'escalate' && <div className="actions quick-replies"><Link className="button secondary" to={ticketUrl} state={{ context }}><TicketPlus size={17} aria-hidden /> Revisar e abrir chamado</Link></div>}
          {stage === 'resolved' && <p className="alert success"><Check size={18} aria-hidden /> Problema marcado como resolvido</p>}
          {error && <p className="alert error" id="chat-error" role="alert">{error}</p>}
          <PromptBar key={conversation.sessionId} describedBy={error ? 'chat-error chat-hint' : 'chat-hint'} onSend={send} />
          <small id="chat-hint">Use dados fictícios. Evite senhas, tokens e códigos de autenticação.</small>
        </div>
      </section>
      <aside className="chat-aside card" aria-label="Opções para a conversa"><h2>Assuntos deste portal</h2>
        <div className="topic-options">{getTopics(profile).map((item) => <button key={item.id} className="rail-link" aria-pressed={topic?.id === item.id} onClick={() => send(item.title, item.id)}><TopicIcon id={item.id} />{item.title}</button>)}</div>
        {stage === 'initial' && <><h3>Testar um caso fictício</h3>
          <div className="topic-options">{demoIncidents[profile].map(({ id, title, opening }) =>
            <button key={id} className="rail-link" onClick={() => send(opening, undefined, id)}>{title}</button>)}</div>
        </>}
        {topic && <Link className="button secondary" to={base + '/diagnostico/' + topic.id} state={{ context }}>Diagnóstico guiado</Link>}
        <Link className="button secondary" to={ticketUrl} state={{ context }}><TicketPlus size={17} aria-hidden /> Falar com suporte</Link>
      </aside>
    </div>
  </>
}

export function Diagnosis({ profile, id }: { profile: Profile, id?: string }) {
  const topic = getTopics(profile).find((item) => item.id === id)
  const base = '/' + profile
  const previousContext = useLocation().state?.context as TicketContext | undefined
  const [sessionId] = useState(() => previousContext?.profile === profile && previousContext.sessionId ? previousContext.sessionId : crypto.randomUUID())
  const sessionSource = previousContext?.profile === profile ? previousContext.sessionSource ?? 'Artigo' : 'Artigo'
  const [step, setStep] = useState(0)
  const [answer, setAnswer] = useState('')
  const [resolved, setResolved] = useState<boolean | null>(null)
  const heading = useRef<HTMLHeadingElement>(null)
  useEffect(() => { if (step > 0) heading.current?.focus() }, [step, resolved])
  if (!topic) return <Empty title="Diagnóstico indisponível"><Link to={base + '/conhecimento'}>Consultar orientações</Link></Empty>
  const steps = answer !== 'Sim' ? topic.alternate ?? topic.steps : topic.steps
  return <><Link className="back" to={base + '/assistente'}>Voltar ao assistente</Link><Heading title="Diagnóstico guiado" description={topic.title} />
    <section className="card narrow diagnosis"><TopicIcon id={topic.id} />
      <div className="progress-bar"><label htmlFor="diagnostic-progress">Etapa {step + 1} de 3</label><progress id="diagnostic-progress" max={3} value={step + 1} /></div>
      <div className="diagnosis-step" key={step + ":" + resolved}>
      {step === 0 && <><h2 tabIndex={-1} ref={heading}>{topic.question}</h2><div className="actions">{['Sim', 'Não', 'Não sei'].map((answer) => <button className="button secondary" key={answer} onClick={() => { recordSession(sessionId, profile, sessionSource); setAnswer(answer); setStep(1) }}>{answer}</button>)}</div></>}
      {step === 1 && <><h2 tabIndex={-1} ref={heading}>Teste estas orientações</h2><ol className="steps">{steps.map((item) => <li key={item}>{item}</li>)}</ol><KnowledgeSource profile={profile} article={knowledgeReference(topic)} /><div className="actions"><button className="button primary" onClick={() => setStep(2)}>Continuar</button><button className="button secondary" onClick={() => { setStep(0); requestAnimationFrame(() => heading.current?.focus()) }}>Voltar</button></div></>}
      {step === 2 && (resolved === null
        ? <><h2 tabIndex={-1} ref={heading}>O problema foi resolvido?</h2><div className="actions"><button className="button primary" onClick={() => { recordSession(sessionId, profile, sessionSource, 'resolved'); setResolved(true) }}>Sim, resolveu</button><button className="button secondary" onClick={() => setResolved(false)}>Ainda preciso de suporte</button><button className="button secondary" onClick={() => setStep(1)}>Voltar</button></div></>
        : <><h2 tabIndex={-1} ref={heading}>{resolved ? 'Diagnóstico concluído' : 'Encaminhar ao suporte'}</h2><p>{resolved ? 'O problema foi marcado como resolvido nesta demonstração.' : 'Registre o chamado com a categoria sugerida e descreva o resultado dos testes.'}</p>
          <Link className="button primary" to={resolved ? base : base + '/chamados/novo?assunto=' + topic.id} state={resolved ? undefined : { context: { profile, source: 'Diagnóstico guiado', article: knowledgeReference(topic), report: previousContext?.profile === profile ? previousContext.report : undefined, exampleId: previousContext?.profile === profile ? previousContext.exampleId : undefined, sessionId, sessionSource, assessment: topic.question + ' ' + answer, guidance: steps, outcome: 'O problema persistiu após o diagnóstico guiado.' } }}>{resolved ? 'Voltar ao início' : 'Abrir chamado'}</Link></>)}
      </div>
    </section>
  </>
}
