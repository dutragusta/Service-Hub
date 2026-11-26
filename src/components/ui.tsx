import { BookOpen, Building2, Headphones, KeyRound, MessagesSquare, ShieldCheck, Ticket as TicketIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import serviceHubLogo from '../assets/service-hub.png'
import type { KnowledgeReference, Profile, Status, TicketContext, Topic } from '../types'

const topicIcons = { vpn: ShieldCheck, conectividade: ShieldCheck, login: KeyRound, teams: MessagesSquare, portal: Building2, documentos: BookOpen, servicos: Headphones }

export function TopicIcon({ id }: { id: string }) {
  const Icon = topicIcons[id as keyof typeof topicIcons] ?? TicketIcon
  return <span className="icon-box"><Icon size={21} aria-hidden /></span>
}

export function Brand() {
  return <span className="brand"><img className="brand-logo" src={serviceHubLogo} alt="Service Hub" width={2048} height={682} /></span>
}

export function Heading({ title, description, action }: { title: string, description?: string, action?: ReactNode }) {
  return <div className="page-heading"><div><h1 tabIndex={-1}>{title}</h1>{description && <p>{description}</p>}</div>{action}</div>
}

export function TopicCards({ topics, url }: { topics: Topic[], url: (id: string) => string }) {
  return <div className="topic-grid">{topics.map((topic) => <Link className="topic-card" key={topic.id} to={url(topic.id)}>
    <TopicIcon id={topic.id} /><strong>{topic.title}</strong><span>{topic.description}</span>
  </Link>)}</div>
}

export function StatusLabel({ status }: { status: Status }) {
  return <span className={'status ' + (status === 'Resolvido' || status === 'Encerrado' ? 'resolved' : status === 'Aberto' ? 'open' : 'progress')}>{status}</span>
}

export function Empty({ title, children }: { title: string, children?: ReactNode }) {
  return <div className="empty"><h2>{title}</h2>{children}</div>
}

export function KnowledgeSource({ article, profile, context }: { article: KnowledgeReference, profile: Profile, context?: TicketContext }) {
  return <div className="knowledge-source">
    <BookOpen size={16} aria-hidden />
    <div><small>{article.code ? `Fonte · ${article.code} · Rev. ${article.revision}` : 'Fonte · Base de demonstração'}</small>
      <Link to={'/' + profile + '/conhecimento/' + encodeURIComponent(article.id)} state={context ? { context } : undefined}>{article.title}</Link>
    </div>
  </div>
}
