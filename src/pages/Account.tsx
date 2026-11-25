import { useState } from 'react'
import { currentDemoCustomer, leaveDemoCustomer } from '../services/demo-account'
import { Link } from 'react-router-dom'
import { Empty, Heading } from '../components/ui'
import { profiles } from '../demo'
import type { TeamRole } from '../services/access'
import { formatDateTime, readTickets } from '../services/support'
import type { Profile, TicketEvent } from '../types'

export function MyProfile({ profile, role }: { profile: Profile; role?: TeamRole | null }) {
  const [demoCustomer, setDemoCustomer] = useState(currentDemoCustomer)
  const access = role === 'admin' ? 'Administrador' : role === 'support' ? 'Suporte' : profiles[profile].title
  return <>
    <Heading title="Meu perfil" description="Consulte o portal e o perfil de acesso em uso." />
    <section className="card narrow" aria-label="Perfil em uso">
      <dl><dt>Portal</dt><dd>{profiles[profile].portal}</dd><dt>Perfil</dt><dd>{access}</dd>{demoCustomer && <>
        <dt>Nome fictício</dt><dd>{demoCustomer.name}</dd><dt>Empresa fictícia</dt><dd>{demoCustomer.company}</dd><dt>E-mail de demonstração</dt><dd>{demoCustomer.email}</dd>
      </>}</dl>
      <div className="actions">
        <Link className="button secondary" to="/cliente">Voltar ao portal</Link>
        {demoCustomer && <button type="button" className="button secondary" onClick={() => { leaveDemoCustomer(); setDemoCustomer(undefined) }}>Sair da conta de demonstração</button>}
      </div>
    </section>
  </>
}

function activityLabel(event: TicketEvent) {
  switch (event.type) {
    case 'status': return 'Status alterado para ' + event.status
    case 'reply': return 'Resposta de ' + event.author
    case 'attachment': return 'Anexo adicionado'
  }
}

export function Notifications({ profile }: { profile: Profile }) {
  const activity = readTickets(profile).flatMap((ticket) => (ticket.events ?? []).map((event, index) => ({ ticket, event, index })))
    .sort((a, b) => Date.parse(b.event.at) - Date.parse(a.event.at))
    .slice(0, 20)
  const base = '/' + profile + '/chamados'
  return <>
    <Heading title="Notificações" description="Veja a atividade recente dos seus chamados de demonstração." />
    {activity.length ? <ul className="ticket-list" aria-label="Atividade dos chamados">
      {activity.map(({ ticket, event, index }) => <li key={ticket.id + '-' + index}>
        <Link to={base + '/' + ticket.id}>
          <div><strong>{activityLabel(event)}</strong><small>{ticket.id} · {ticket.title}</small></div>
          <time dateTime={event.at}>{formatDateTime(event.at)}</time>
        </Link>
      </li>)}
    </ul> : <Empty title="Nenhuma atualização recente"><Link className="button secondary" to={base}>Ver meus chamados</Link></Empty>}
  </>
}
