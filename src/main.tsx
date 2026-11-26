import { loadKnowledge } from './services/knowledge'
import { getTopics } from './services/operations'
import '@fontsource-variable/manrope/wght.css'
import './styles.css'
import { BarChart3, Bell, CircleHelp, BookOpen, ExternalLink, Headphones, House, ClipboardList, Info, Settings, Ticket, UserRound } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Link, Navigate, NavLink, Route, Routes, useLocation, useParams } from 'react-router-dom'
import { Brand, Empty } from './components/ui'
import { ProfileMenu } from './components/ProfileMenu'
import { PortalAccess, StaffAccess } from './pages/PortalAccess'
import { MyProfile, Notifications } from './pages/Account'
import { profiles } from './demo'
import { Assistant, Diagnosis, initialConversation, type Conversation } from './pages/Assistant'
import { Knowledge, Portal } from './pages/Portal'
import { AcceptInvite } from './pages/Permissions'
import { deskPath, queuePath, settingsPath, useTeamIdentity } from './services/access'
import { ServiceDemo } from './pages/ServiceDemo'
import { TeamDashboard, TeamQueue, TeamSettings } from './pages/Team'
import { NewTicket, TicketDetail, Tickets } from './pages/Tickets'
import type { Profile } from './types'

const navItems = [
  { label: 'Início', route: '', icon: House },
  { label: 'Assistente', route: '/assistente', icon: Headphones },
  { label: 'Meus chamados', route: '/chamados', icon: Ticket },
  { label: 'Base de conhecimento', route: '/conhecimento', icon: BookOpen },
]

const profile = 'cliente' as const

function Entry() {
  const supportPath = '/cliente/chamados/novo'

  return <div className="entry">
    <header className="entry-header">
      <div className="entry-header-content">
        <div className="entry-identity">
          <Brand />
          <span className="entry-name">Portal de Triagem</span>
          <span className="demo-label">Modo demonstração</span>
        </div>
        <Link className="button secondary entry-header-action" to={supportPath}>
          <Headphones size={16} aria-hidden /> Solicitar atendimento
        </Link>
      </div>
    </header>
    <main className="entry-main page-enter" id="main">
      <section className="entry-card" aria-labelledby="entry-title">
        <div className="entry-intro">
          <span className="entry-avatar"><UserRound size={28} aria-hidden /></span>
          <div>
            <h1 id="entry-title" tabIndex={-1}>Ambiente de Demonstração</h1>
            <p>Simule a triagem de uma solicitação de cliente e acompanhe o encaminhamento para a equipe de suporte.</p>
          </div>
        </div>
        <div className="entry-notice">
          <span><Info size={20} aria-hidden /></span>
          <p>Use dados fictícios. Os chamados ficam neste navegador e o envio de e-mails é simulado.</p>
        </div>
        <div className="entry-start">
          <h2>Como você quer começar?</h2>
          <div className="actions entry-actions">
            <Link className="button primary" to="/cliente/assistente"><ExternalLink size={20} aria-hidden /> Abrir Portal de Triagem</Link>
            <Link className="button secondary" to={supportPath}><Headphones size={20} aria-hidden /> Solicitar atendimento</Link>
          </div>
        </div>
        <div className="entry-card-note">
          <Info size={18} aria-hidden />
          <p>Use o protocolo para acompanhar o atendimento em Meus chamados.</p>
        </div>
      </section>
      <nav className="entry-footer" aria-label="Acesso à conta">
        <Link to="/acesso/cliente">Entrar</Link>
        <Link to="/acesso/cliente/cadastro">Cadastrar</Link>
        <Link to="/acesso/equipe">Acesso da equipe</Link>
      </nav>
    </main>
  </div>
}

function PortalShell({ conversation, update }: { conversation?: Conversation, update: (conversation: Conversation) => void }) {
  const { '*': remainder = '' } = useParams()
  const location = useLocation()
  const [knowledgeReady, setKnowledgeReady] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    void loadKnowledge(profile, controller.signal).then(() => {
      if (!controller.signal.aborted) setKnowledgeReady(true)
    })
    return () => controller.abort()
  }, [])
  if (!knowledgeReady) return <main id="main" className="workspace"><p role="status">Consultando a base de conhecimento…</p></main>
  const base = '/cliente'
  const route = remainder.split('/')
  const selected = getTopics(profile).find((item) => item.id === new URLSearchParams(location.search).get('assunto'))
  return <div className="shell">
    <aside className="sidebar">
      <Link to={base} className="sidebar-brand" aria-label={profiles[profile].portal + ' — início'}><Brand /></Link>
      <div className="sidebar-profile">{profiles[profile].portal}</div>
      <nav aria-label="Navegação principal">
        {navItems.map(({ label, route, icon: Icon }) => <NavLink key={label} to={base + route} end={!route}><Icon size={19} aria-hidden /><span>{label}</span></NavLink>)}
      </nav>
    </aside>
    <header className="topbar">
      <span className="topbar-title">Central de atendimento</span><Link className="topbar-brand" to={base}><Brand /></Link>
      <div className="header-actions topbar-actions">
        <NavLink className="header-icon" to={base + '/notificacoes'} aria-label="Notificações" title="Notificações"><Bell size={21} aria-hidden /></NavLink>
        <NavLink className="header-icon" to={base + '/conhecimento'} aria-label="Ajuda" title="Ajuda"><CircleHelp size={22} aria-hidden /></NavLink>
        <div className="customer-account-links" aria-label="Conta do cliente">
          <Link className="button secondary" to="/acesso/cliente">Entrar</Link>
          <Link className="button primary" to="/acesso/cliente/cadastro">Cadastrar</Link>
        </div>
        <ProfileMenu profilePath={base + '/perfil'} />
      </div>
    </header>
    <div className="shell-content">
      <main id="main" className="workspace page-enter" key={location.pathname}>
        <Routes>
          <Route index element={<Portal profile={profile} />} />
          <Route path="perfil" element={<MyProfile profile={profile} role={null} />} />
          <Route path="notificacoes" element={<Notifications profile={profile} />} />
          <Route path="demonstracao" element={<ServiceDemo />} />
          <Route path="assistente" element={<ConversationPage key={location.key} profile={profile} topic={selected} conversation={conversation} update={update} />} />
          <Route path="diagnostico/:id" element={<Diagnosis key={route[1]} profile={profile} id={route[1]} />} />
          <Route path="chamados" element={<Tickets profile={profile} />} />
          <Route path="chamados/novo" element={<NewTicket key={location.search} profile={profile} />} />
          <Route path="chamados/:id" element={<TicketDetail profile={profile} key={route[1]} id={route[1]} created={location.state?.created === true} initialEmailStatus={location.state?.emailStatus} />} />
          <Route path="conhecimento" element={<Knowledge profile={profile} />} />
          <Route path="conhecimento/:id" element={<Knowledge profile={profile} article={route[1]} />} />
          <Route path="*" element={<Empty title="Página indisponível"><Link to={base}>Voltar ao início</Link></Empty>} />
        </Routes>
      </main>
      <footer className="workspace-footer team-footer"><span>Service Hub · Dados fictícios</span><Link to="/acesso/equipe">Acesso da equipe</Link></footer>
    </div>
  </div>
}

function ConversationPage({ profile, topic, conversation, update }: { profile: Profile, topic?: Conversation['topic'], conversation?: Conversation, update: (conversation: Conversation) => void }) {
  const [initial] = useState(() => topic && topic.id !== conversation?.topic?.id ? initialConversation(topic) : conversation ?? initialConversation())
  const [active, setActive] = useState(initial)
  useEffect(() => { update(initial) }, [initial, update])
  return <Assistant profile={profile} conversation={active} update={(next) => { setActive(next); update(next) }} />
}

function TeamArea() {
  const identity = useTeamIdentity(true)
  const location = useLocation()
  return <div className="shell">
    <aside className="sidebar">
      <Link to={queuePath} className="sidebar-brand" aria-label="Fila de suporte"><Brand /></Link>
      <div className="sidebar-profile">Central do analista</div>
      <nav aria-label="Navegação da equipe">
        <NavLink to={deskPath}><BarChart3 size={19} aria-hidden /> Painel de atendimento</NavLink>
        <NavLink to={queuePath}><ClipboardList size={19} aria-hidden /> Fila de suporte</NavLink>
        {identity?.role === 'admin' && <NavLink to={settingsPath}><Settings size={19} aria-hidden /> Configurações</NavLink>}
      </nav>
    </aside>
    <header className="topbar">
      <span className="topbar-title">Área da equipe</span><Link className="topbar-brand" to={queuePath}><Brand /></Link>
      <Link to="/cliente" className="button secondary">Portal do cliente</Link>
    </header>
    <div className="shell-content">
      <main id="main" className="workspace page-enter" key={location.pathname}>
        <Routes>
          <Route path="painel" element={<TeamDashboard identity={identity} />} />
          <Route path="fila/*" element={<TeamQueue identity={identity} />} />
          <Route path="configuracoes/*" element={<TeamSettings role={identity?.role} />} />
          <Route path="*" element={<Navigate replace to={deskPath} />} />
        </Routes>
      </main>
      <footer className="workspace-footer">Service Hub · Área da equipe</footer>
    </div>
  </div>
}

function LegacyTeamRoute({ target }: { target: string }) {
  const params = useParams()
  const remaining = params['*']
  // Rotas de configurações e chamados antigos seguem para a área interna.
  return <Navigate replace to={target + (remaining ? '/' + remaining : '')} />
}

function App() {
  const { pathname } = useLocation()
  const [conversation, setConversation] = useState<Conversation>()
  const update = useCallback((value: Conversation) => setConversation(value), [])
  useEffect(() => {
    window.scrollTo(0, 0)
    document.querySelector<HTMLElement>('main h1[tabindex="-1"]')?.focus({ preventScroll: true })
  }, [pathname])
  return <><a className="skip" href="#main" onClick={(event) => { event.preventDefault(); const main = document.getElementById('main'); main?.setAttribute('tabindex', '-1'); main?.focus() }}>Pular para o conteúdo</a>
    <Routes>
      <Route path="/" element={<Entry />} />
      <Route path="/cliente/*" element={<PortalShell conversation={conversation} update={update} />} />
      <Route path="/acesso/equipe" element={<StaffAccess />} />
      <Route path="/acesso/:profile" element={<PortalAccess />} />
      <Route path="/acesso/:profile/cadastro" element={<PortalAccess registration />} />
      <Route path="/convite/:token" element={<AcceptInvite />} />
      <Route path="/colaborador/fila-suporte/*" element={<LegacyTeamRoute target={queuePath} />} />
      <Route path="/colaborador/configuracoes/*" element={<LegacyTeamRoute target={settingsPath} />} />
      <Route path="/equipe/admin" element={<Navigate replace to={settingsPath} />} />
      <Route path="/equipe/*" element={<TeamArea />} />
      <Route path="*" element={<Navigate replace to="/cliente" />} />
    </Routes>
  </>
}

createRoot(document.getElementById('root')!).render(<HashRouter><App /></HashRouter>)
