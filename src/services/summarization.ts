import { cleanSummaryInput, createTicketSummary } from './ticket-summary.mjs'
import type { SummaryInput, TicketSummary } from '../types'

export async function summarizeTicket(input: SummaryInput): Promise<TicketSummary | undefined> {
  const clean = cleanSummaryInput(input)
  if (!clean) return
  const local = createTicketSummary(clean)
  if (import.meta.env.DEV || import.meta.env.MODE === 'pages') return local

  try {
    const response = await fetch('/api/tickets/summary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clean),
      signal: AbortSignal.timeout(8500),
    })
    if (!response.ok || !response.headers.get('Content-Type')?.includes('application/json')) return local
    const generated: TicketSummary = await response.json()
    if (generated.origin === 'regras' || generated.origin === 'modelo') return generated
  } catch {
    // A indisponibilidade do resumo no servidor não impede o registro.
  }
  return local
}
