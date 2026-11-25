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

export function canHandleTicket(ticket: Ticket, role: TeamRole, email?: string) {
  const responsible = ticket.routing?.responsible ?? []
  return role === 'admin' || responsible.length === 0 || (!!email && responsible.includes(email.trim().toLowerCase()))
}
