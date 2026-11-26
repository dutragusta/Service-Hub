import { getTopics, knowledgeReference } from './operations'
import { identifyTopic, normalize } from './support'
import { customerReviewCategory } from './routing'
import type { KnowledgeReference, Profile, TicketContext, Topic } from '../types'

type Message = { author: 'user' | 'assistant', text: string, source?: KnowledgeReference }
export type Conversation = {
  sessionId: string
  exampleId?: string
  topic?: Topic
  stage: 'initial' | 'clarify' | 'question' | 'answer' | 'escalate' | 'resolved'
  messages: Message[]
  report?: string
  assessment?: string
  guidance?: string[]
  outcome?: string
}

export function initialConversation(topic?: Topic): Conversation {
  const greeting: Message = { author: 'assistant', text: 'Olá! Conte o que aconteceu ou escolha um assunto para começar.' }
  if (!topic) return { sessionId: crypto.randomUUID(), stage: 'initial', messages: [greeting] }
  return { sessionId: crypto.randomUUID(), topic, stage: 'question', messages: [greeting, { author: 'user', text: topic.title }, { author: 'assistant', text: topic.question, source: knowledgeReference(topic) }] }
}

const humanOnly = /\b(auditoria|declaracao assinada|documento assinado|liberar permissao|alterar permissao)\b/
function answerKind(text: string) {
  const words = normalize(text).replace(/[,.!?]/g, ' ').replace(/\s+/g, ' ').trim()
  if (/\b(nao sei|nao testei|ainda nao testei|nao tenho certeza)\b/.test(words)) return 'unsure'
  if (/\b(nao|persiste|continua|so eu|apenas comigo|ninguem|da erro)\b/.test(words)) return 'no'
  if (/\b(sim|resolveu|funcionou|resolvido|consegui|abre normalmente|funciona normalmente|outras pessoas|mais pessoas|outros usuarios|todo mundo|tambem acontece)\b/.test(words)) return 'yes'
}

export function advance(conversation: Conversation, profile: Profile, text: string, topicId?: string): Conversation {
  const reply = (response: string, change: Partial<Conversation>, source?: KnowledgeReference): Conversation => ({
    ...conversation, ...change,
    messages: [...conversation.messages, { author: 'user', text }, { author: 'assistant', text: response, source }],
  })
  const normalized = normalize(text)
  const selected = topicId ? getTopics(profile).find((topic) => topic.id === topicId) : identifyTopic(profile, text)
  const answer = answerKind(text)
  const { stage, topic } = conversation
  if (/\b(abrir (um )?chamado|falar com (o )?suporte|atendente humano)\b/.test(normalized)) {
    return reply('Você pode abrir um chamado agora. Vou levar um resumo editável do que já foi informado.', { stage: 'escalate' })
  }
  const review = profile === 'cliente' && !topicId && (stage === 'initial' || stage === 'clarify' || stage === 'resolved')
    ? customerReviewCategory(text)
    : undefined
  if (review) {
    return reply('Esse pedido precisa de análise da equipe responsável. Abra um chamado para encaminhar seu relato à fila “' + review.queue + '”.', {
      topic: undefined, stage: 'escalate', report: stage === 'clarify' ? [conversation.report, text].filter(Boolean).join('\n') : text,
      assessment: undefined, guidance: undefined, outcome: undefined, exampleId: undefined,
    })
  }
  if (!topicId && humanOnly.test(normalized)) {
    return reply('Esse pedido exige validação humana. A base do portal pode orientar consultas, mas a equipe precisa analisar a autorização e o procedimento aplicável. Você pode encaminhar o relato para o suporte.', {
      topic: undefined, stage: 'escalate', report: [conversation.report, text].filter(Boolean).join('\n'),
      assessment: undefined, guidance: undefined, outcome: 'Encaminhado para validação humana por envolver autorização ou documentação formal.',
    })
  }
  if (selected && (topicId || ((!topic || selected.id !== topic.id) && (!answer || (stage !== 'question' && stage !== 'answer'))))) {
    return reply('Encontrei o procedimento “' + selected.title + '”. ' + selected.question, {
      topic: selected, stage: 'question',
      report: topicId ? (topic ? undefined : conversation.report) : [!topic ? conversation.report : undefined, text].filter(Boolean).join('\n'),
      assessment: undefined, guidance: undefined, outcome: undefined,
    }, knowledgeReference(selected))
  }
  if (topic && stage === 'question') {
    if (!answer) return reply('Vou levar esse detalhe em conta no chamado. ' + topic.question, {
      report: [conversation.report, text].filter(Boolean).join('\n'),
    }, knowledgeReference(topic))
    const guidance = answer === 'yes' ? topic.steps : topic.alternate ?? topic.steps
    return reply(guidance.map((step, i) => (i + 1) + '. ' + step).join('\n') + '\n\nConseguiu resolver?', {
      stage: 'answer', assessment: topic.question + ' ' + text, guidance,
    }, knowledgeReference(topic))
  }
  if (stage === 'answer') {
    if (answer === 'yes') return reply('Que bom! Marquei este atendimento como resolvido.', { stage: 'resolved', outcome: 'O usuário informou que o problema foi resolvido.' })
    if (answer === 'no') return reply('Abra um chamado para continuar com o suporte. O relato e as orientações já oferecidas vão com você.', {
      stage: 'escalate',
      outcome: text === 'Não, continua' ? 'O problema persistiu após as orientações.' : text,
    })
    return reply('Você já conseguiu testar as orientações? Se precisar de ajuda agora, abra um chamado.', {
      report: answer === 'unsure' ? conversation.report : [conversation.report, text].filter(Boolean).join('\n'),
    })
  }
  if (selected) return reply('Encontrei o procedimento “' + selected.title + '”. ' + selected.question, { topic: selected, stage: 'question', report: text, assessment: undefined, guidance: undefined, outcome: undefined }, knowledgeReference(selected))
  if (stage === 'initial' || stage === 'resolved') return reply('Qual serviço ou aplicativo apresentou o problema? Se puder, diga o que você estava tentando fazer e o que apareceu na tela.', { stage: 'clarify', report: text, topic: undefined, assessment: undefined, guidance: undefined, outcome: undefined })
  return reply('Não encontrei um procedimento adequado na base deste portal. Você pode usar os assuntos sugeridos ou abrir um chamado levando o que já relatou.', {
    stage: 'escalate', report: [conversation.report, text].filter(Boolean).join('\n'),
  })
}

export function conversationContext(profile: Profile, conversation: Conversation): TicketContext | undefined {
  const { report, assessment, guidance, outcome, topic } = conversation
  if (!report && !assessment && !guidance) return
  return { profile, source: 'Assistente virtual', article: guidance?.length && topic ? knowledgeReference(topic) : undefined, sessionId: conversation.sessionId, exampleId: conversation.exampleId, sessionSource: 'Assistente', report: report?.slice(0, 500), assessment, guidance, outcome }
}
