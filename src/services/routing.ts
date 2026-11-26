import { demoCostCenters } from '../data/cost-centers'
import type { CostCenter, RoutingRule, Ticket, TicketRouting } from '../types'
import type { TeamRole } from './access'

const key = 'service-hub-demo-cost-centers-v1'
export const triageQueue = 'Triagem geral'

export function readCostCenters(): CostCenter[] {
  try {
    const raw = localStorage.getItem(key)
    const stored = raw === null ? null : JSON.parse(raw)
    return Array.isArray(stored) ? stored : demoCostCenters
  } catch {
    return demoCostCenters
  }
}

export function saveCenter(code: string, name: string, existing: boolean) {
  const centers = readCostCenters()
  const found = centers.find((center) => center.code === code)
  if (existing !== Boolean(found)) throw new Error('O código já existe ou o centro foi alterado. Atualize a página.')
  const next = found ? centers.map((center) => center.code === code ? { ...center, name } : center) : [...centers, { code, name, rules: [] }]
  localStorage.setItem(key, JSON.stringify(next))
  return next
}

export function saveRule(code: string, topic: string, rule?: RoutingRule) {
  const centers = readCostCenters()
  if (!centers.some((center) => center.code === code)) throw new Error('Centro de custo indisponível.')
  const next = centers.map((center) => center.code === code ? {
    ...center, rules: [...center.rules.filter((item) => item.topic !== topic), ...(rule ? [rule] : [])],
  } : center)
  localStorage.setItem(key, JSON.stringify(next))
  return next
}

export function routeInternalTicket(code: string, topic: string): TicketRouting {
  const center = readCostCenters().find((item) => item.code === code)
  const rule = center?.rules.find((item) => item.topic === topic) ?? center?.rules.find((item) => item.topic === '*')
  return {
    centerCode: center?.code,
    centerName: center?.name,
    queue: rule?.queue ?? triageQueue,
    responsible: rule?.responsible ?? [],
  }
}

export const customerReviewCategories = [
  { id: 'boleto', title: 'Boleto', queue: 'Financeiro', terms: /\bboletos?\b/ },
  { id: 'nota-fiscal', title: 'Nota fiscal', queue: 'Faturamento', terms: /\b(nota fiscal|notas fiscais|nf-e|danfe)\b/ },
  { id: 'contrato', title: 'Contrato', queue: 'Contratos', terms: /\b(contratos?|aditivo contratual|rescisao contratual)\b/ },
  { id: 'financeiro', title: 'Financeiro', queue: 'Financeiro', terms: /\b(cobranca em duplicidade|cobranca duplicada|estorno|cobranca indevida)\b/ },
]

export function customerReviewCategory(report: string) {
  const text = report.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
  return customerReviewCategories.find(({ terms }) => terms.test(text))
}

export function routeCustomerTicket(topic: string): TicketRouting {
  const queues: Record<string, string> = {
    portal: 'Acesso ao portal',
    documentos: 'Documentação de serviços',
    servicos: 'Suporte a serviços',
    conectividade: 'Conectividade',
  }
  const review = customerReviewCategories.find(({ id }) => id === topic)
  return { queue: review?.queue ?? queues[topic] ?? triageQueue, responsible: [] }
}

export function canHandleTicket(ticket: Ticket, role: TeamRole, email?: string) {
  const responsible = ticket.routing?.responsible ?? []
  return role === 'admin' || responsible.length === 0 || (!!email && responsible.includes(email.trim().toLowerCase()))
}
