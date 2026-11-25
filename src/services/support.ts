import { getTopics } from './operations'
import { seed } from '../demo'
import type { Profile, Ticket, Topic } from '../types'

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
  const matches = getTopics(profile).map((topic) => ({
    topic,
    score: topic.keywords.reduce((sum, word) => sum + (words.includes(' ' + normalize(word) + ' ') ? word.length : 0), 0),
  }))
  return matches.filter((match) => match.score > 0).sort((a, b) => b.score - a.score)[0]?.topic
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

type TicketAction =
  | { kind: 'claim' }
  | { kind: 'reply', text: string }
  | { kind: 'resolve', text: string }

const supportAgent = 'Equipe de suporte fictícia'

export function updateTicket(profile: Profile, id: string, action: TicketAction) {
  const tickets = readTickets(profile)
  const current = tickets.find((ticket) => ticket.id === id)
  if (!current || current.status === 'Resolvido') throw new Error('Este chamado já foi concluído ou está indisponível.')
  const at = new Date().toISOString()
  const events = [...(current.events ?? [])]
  const updated = { ...current, events }

  if (action.kind === 'claim') {
    if (current.status !== 'Aberto') throw new Error('Este chamado já está em atendimento.')
    updated.assignee = supportAgent
    updated.status = 'Em atendimento'
    events.push({ type: 'status', status: updated.status, at })
  } else {
    if (current.status !== 'Em atendimento') throw new Error('Assuma o chamado antes de responder.')
    const message = action.text.trim()
    if (!message || message.length > 1200 || looksSensitive(message)) throw new Error('Informe um texto válido, sem credenciais, com até 1.200 caracteres.')
    events.push({ type: 'reply', author: current.assignee ?? supportAgent, text: message, at })
    if (action.kind === 'resolve') {
      updated.status = 'Resolvido'
      updated.resolution = message
      events.push({ type: 'status', status: updated.status, at })
    }
  }
  localStorage.setItem(prefix + profile, JSON.stringify(tickets.map((ticket) => ticket.id === id ? updated : ticket)))
  return updated
}
