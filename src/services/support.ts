import { getTopics } from './operations'
import { seed } from '../demo'
import { ticketImageLimit } from './ticket-images'
import type { Profile, Status, Ticket, TicketEmailStatus, TicketImage, Topic } from '../types'

export function normalize(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export function searchTopics(profile: Profile, query: string) {
  const terms = normalize(query).trim().split(/\s+/)
  return getTopics(profile).filter((topic) => {
    const content = normalize([topic.title, topic.description, ...topic.keywords].join(' '))
    return terms.every((term) => content.includes(term))
  })
}

export function identifyTopic(profile: Profile, message: string): Topic | undefined {
  const words = ' ' + normalize(message).replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ') + ' '
  const normalizedWords = words.trim().split(' ').filter(Boolean)
  const onlyGeneric = new Set(['acesso', 'conta', 'entrar', 'falha', 'atendimento', 'suporte', 'servico', 'indisponivel'])
  const matches = getTopics(profile).map((topic) => ({
    topic,
    score: topic.keywords.reduce((sum, word) => sum + (words.includes(' ' + normalize(word) + ' ') ? (onlyGeneric.has(normalize(word)) ? 1 : word.length) : 0), 0),
  }))
  const [best, second] = matches.sort((a, b) => b.score - a.score)
  if (!best || !best.score || (second && best.score === second.score)) return
  if (best.score < 3 && normalizedWords.length > 1) return
  return best.topic
}

export function looksSensitive(message: string) {
  return /(?:senha|token|c[oó]digo)(?:\s*[=:]|\s+[eé]\s+)\s*\S+|\b\d{6,}\b/i.test(message)
}

const prefix = 'service-hub-demo-tickets-v1:'
export function readTickets(profile: Profile): Ticket[] {
  try {
    const raw = localStorage.getItem(prefix + profile)
    if (!raw) return seed[profile]
    const stored: Ticket[] = JSON.parse(raw)
    return stored.map((ticket) => ({ ...seed[profile].find((example) => example.id === ticket.id), ...ticket }))
  } catch {
    return seed[profile]
  }
}

export function saveTicket(profile: Profile, data: Omit<Ticket, 'id' | 'status' | 'date'>) {
  const number = crypto.getRandomValues(new Uint32Array(1))[0].toString(16).toUpperCase().padStart(8, '0')
  const ticket: Ticket = { ...data, id: 'SH-' + number, status: 'Aberto', date: new Date().toISOString() }
  localStorage.setItem(prefix + profile, JSON.stringify([ticket, ...readTickets(profile)]))
  return ticket
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(date))
}

export function formatDateTime(date: string) {
  return new Intl.DateTimeFormat('pt-BR', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Sao_Paulo' }).format(new Date(date))
}

export function isTicketComplete(status: Status) {
  return status === 'Resolvido' || status === 'Encerrado'
}

export function recordTicketEmail(profile: Profile, id: string, emailStatus: TicketEmailStatus) {
  const tickets = readTickets(profile)
  const updated = tickets.map((ticket) => ticket.id === id ? { ...ticket, emailStatus } : ticket)
  localStorage.setItem(prefix + profile, JSON.stringify(updated))
  return updated.find((ticket) => ticket.id === id)
}

export type TicketAction =
  | { kind: 'close' }
  | { kind: 'reopen' }
  | { kind: 'images', images: TicketImage[] }
  | { kind: 'claim' }
  | { kind: 'reply', text: string }
  | { kind: 'resolve', text: string }
  | { kind: 'note', text: string }
  | { kind: 'customer-reply', text: string }
  | { kind: 'rate', value: number }

const supportAgent = 'Equipe de suporte fictícia'

export function updateTicket(profile: Profile, id: string, action: TicketAction) {
  const tickets = readTickets(profile)
  const current = tickets.find((ticket) => ticket.id === id)
  if (!current) throw new Error('Chamado indisponível.')
  if (isTicketComplete(current.status) && action.kind !== 'rate' && action.kind !== 'reopen') throw new Error('Este chamado já foi concluído.')
  const at = new Date().toISOString()
  const events = [...(current.events ?? [])]
  const updated = { ...current, events }

  if (action.kind === 'close' || action.kind === 'reopen') {
    if (profile !== 'cliente') throw new Error('Ação disponível no portal do cliente.')
    if (action.kind === 'reopen' && !isTicketComplete(current.status)) throw new Error('Este chamado já está ativo.')
    updated.status = action.kind === 'close' ? 'Encerrado' : 'Aberto'
    events.push({ type: 'status', status: updated.status, by: 'cliente', at })
    if (action.kind === 'reopen') {
      delete updated.assignee
      delete updated.resolution
      delete updated.rating
      delete updated.dueAt
    }
  } else if (action.kind === 'images') {
    const count = events.filter((event) => event.type === 'image').length
    if (!action.images.length || count + action.images.length > ticketImageLimit) throw new Error('O chamado aceita até três imagens.')
    events.push(...action.images.map((image) => ({ ...image, type: 'image' as const, at })))
  } else if (action.kind === 'rate') {
    if (current.status !== 'Resolvido' || current.rating !== undefined || !Number.isInteger(action.value) || action.value < 1 || action.value > 5) {
      throw new Error('O chamado precisa estar resolvido e aceita uma avaliação de 1 a 5.')
    }
    updated.rating = action.value
  } else if (action.kind === 'claim') {
    if (current.status !== 'Aberto') throw new Error('Este chamado já está em atendimento.')
    updated.assignee = supportAgent
    updated.status = 'Em atendimento'
    events.push({ type: 'status', status: updated.status, at })
  } else {
    const message = action.text.trim()
    if (!message || message.length > 1200 || looksSensitive(message)) throw new Error('Informe um texto válido, sem credenciais, com até 1.200 caracteres.')
    if (action.kind === 'note') {
      updated.internalNotes = [...(current.internalNotes ?? []), { at, text: message }]
    } else if (action.kind === 'customer-reply') {
      events.push({ type: 'reply', sender: 'cliente', author: 'Cliente', text: message, at })
    } else {
      if (current.status !== 'Em atendimento') throw new Error('Assuma o chamado antes de responder.')
      events.push({ type: 'reply', author: current.assignee ?? supportAgent, text: message, at })
      if (action.kind === 'resolve') {
        updated.status = 'Resolvido'
        updated.resolution = message
        events.push({ type: 'status', status: updated.status, at })
      }
    }
  }
  localStorage.setItem(prefix + profile, JSON.stringify(tickets.map((ticket) => ticket.id === id ? updated : ticket)))
  return updated
}
