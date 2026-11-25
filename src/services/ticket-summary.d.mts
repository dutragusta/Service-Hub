import type { SummaryInput, TicketSummary } from '../types'
export function cleanSummaryInput(value: unknown): SummaryInput | null
export function createTicketSummary(input: SummaryInput, origin?: TicketSummary['origin']): TicketSummary
