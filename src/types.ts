export type Profile = 'colaborador' | 'cliente'
export type Priority = 'Normal' | 'Alta'
export type Status = 'Aberto' | 'Em atendimento' | 'Resolvido'
export type Topic = {
  id: string
  title: string
  description: string
  keywords: string[]
  question: string
  steps: string[]
  alternate?: string[]
}
export type RoutingRule = { topic: string; queue: string; responsible: string[] }
export type CostCenter = { code: string; name: string; rules: RoutingRule[] }
export type TicketRouting = { centerCode?: string; centerName?: string; queue: string; responsible: string[] }

export type Ticket = {
  id: string
  title: string
  category: string
  description: string
  priority: Priority
  status: Status
  date: string
  context?: TicketContext
  summary?: TicketSummary
  routing?: TicketRouting
  assignee?: string
  dueAt?: string
  resolution?: string
  events?: TicketEvent[]
}

export type KnowledgeReference = Pick<Topic, 'id' | 'title'>

export type TicketContext = {
  profile: Profile
  source: 'Assistente virtual' | 'Diagnóstico guiado' | 'Artigo da base de conhecimento'
  article?: KnowledgeReference
  report?: string
  assessment?: string
  guidance?: string[]
  outcome?: string
  sessionId?: string
  sessionSource?: 'Assistente' | 'Artigo'
}

export type TicketEvent = { at: string } & (
  { type: 'status', status: Status } |
  { type: 'reply', author: string, text: string } |
  { type: 'attachment', name: string, text: string }
)

export type IncidentDetails = {
  startedAt?: string
  environment?: string
  scope?: string
  impact?: string
  errorMessage?: string
  tests?: string
}

export type SummaryInput = IncidentDetails & {
  profile: Profile
  title: string
  description: string
  category: string
  priority: Priority
  channel?: string
  queue?: string
  center?: string
  report?: string
  assessment?: string
  article?: string
  guidance?: string[]
  outcome?: string
}

export type TicketSummary = {
  origin: 'local' | 'regras' | 'modelo'
  synopsis: string
  conditions: [string, string][]
  executedTests: string
  assessment?: string
  guidance: string[]
  article?: string
  handoff: string
  destination: string
  gaps: string[]
  nextAction: string
}
