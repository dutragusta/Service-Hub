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
