import type { Ticket, TicketEmailStatus } from '../types'

export async function notifyTicket(ticket: Ticket): Promise<TicketEmailStatus> {
  if (import.meta.env.DEV || import.meta.env.MODE === 'pages') return 'demo'

  try {
    const response = await fetch('/api/tickets/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        protocol: ticket.id, title: ticket.title, description: ticket.description,
        category: ticket.category, priority: ticket.priority, queue: ticket.routing?.queue,
        synopsis: ticket.summary?.synopsis ?? '',
      }),
      signal: AbortSignal.timeout(8000),
    })
    if (!response.ok) return 'failed'
    const { status } = await response.json()
    if (status === 'sent' || status === 'demo' || status === 'unconfigured') return status
  } catch {
    // O chamado já foi salvo e pode ser consultado pelo protocolo.
  }
  return 'failed'
}
