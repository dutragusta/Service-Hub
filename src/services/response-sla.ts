import { isTicketComplete } from './support'
import type { Ticket } from '../types'

const hour = 60 * 60 * 1000
export const slaLabels = {
  pending: 'No prazo',
  near: 'Vence em até 2h',
  late: 'Vencido',
  met: 'Respondido no prazo',
  missed: 'Respondido em atraso',
  unknown: 'Sem resposta registrada',
} as const
export type SlaStatus = keyof typeof slaLabels

export function responseSla(ticket: Ticket, now = Date.now()): { status: SlaStatus, deadline: string } {
  const deadline = Date.parse(ticket.date) + (ticket.priority === 'Alta' ? 4 : 24) * hour
  const response = (ticket.events ?? [])
    .filter((event) => event.type === 'reply' && event.sender !== 'cliente')
    .map((event) => Date.parse(event.at))
    .sort((a, b) => a - b)[0]
  const remaining = deadline - now
  const status = response !== undefined ? (response <= deadline ? 'met' : 'missed')
    : isTicketComplete(ticket.status) ? 'unknown'
    : remaining <= 0 ? 'late' : remaining <= 2 * hour ? 'near' : 'pending'
  return { status, deadline: new Date(deadline).toISOString() }
}
