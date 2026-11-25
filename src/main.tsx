import { loadKnowledge } from './services/knowledge'
import { getTopics } from './services/operations'
import '@fontsource-variable/manrope/wght.css'
import './styles.css'
import { BarChart3, Bell, CircleHelp, BookOpen, Building2, Headphones, House, ClipboardList, Settings, Ticket } from 'lucide-react'
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
  return <div className="entry">
    <header className="entry-header"><Brand /><span className="demo-label">Demonstração</span></header>
    <main className="entry-main page-enter" id="main">
      <section className="entry-intro">
        <div className="entry-intro-copy">
          <span className="intro-label">Central de atendimento</span>
          <h1 tabIndex={-1}>Portal do Cliente</h1>
          <p>Consulte orientações, abra chamados e acompanhe suas solicitações.</p>
        </div>
        <div className="entry-graphic" aria-hidden>
          <svg viewBox="0 0 360 320" fill="none">
            <path d="M0 72h86v54h71m-157 56h63v60h112m-56-242v63h71v68m41-131v85h79v54h50M360 266h-67v-46h-68m-112 100v-48h77v-47m170-38h-65v-24h-60M0 295h56v-41h92" stroke="currentColor"/>
            <path d="M0 34h145v63h99v44M360 100h-23v-55h-74v63M360 298H242v-48h-23M0 211h96v-54h57" stroke="currentColor" strokeDasharray="3 7"/>
            <rect x="151" y="128" width="87" height="88" rx="21" fill="#961900" stroke="#E5DECF"/>
            <path d="M174 169l13 13 26-27" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
            <g fill="#CCC2AD"><circle cx="86" cy="72" r="3"/><circle cx="190" cy="63" r="3"/><circle cx="310" cy="85" r="3"/><circle cx="63" cy="242" r="3"/><circle cx="293" cy="266" r="3"/><circle cx="96" cy="157" r="3"/><circle cx="190" cy="272" r="3"/></g>
          </svg>
        </div>
      </section>
      <section className="entry-portals" aria-labelledby="profile-heading">
        <h2 id="profile-heading">Escolha seu acesso</h2>
        <div className="profile-card entry-client-card">
          <span className="icon-box"><Building2 size={23} aria-hidden /></span>
          <div className="entry-client-content">
            <h3>Sou cliente</h3>
            <p>Entre com sua conta ou faça um cadastro para acessar o portal.</p>
            <div className="actions entry-access-links">
              <Link className="button primary" to="/acesso/cliente">Entrar</Link>
              <Link className="button secondary" to="/acesso/cliente/cadastro">Cadastrar</Link>
            </div>
          </div>
        </div>
      </section>
    </main>
    <footer className="entry-footer"><span>Service Hub · Dados fictícios</span><Link to="/acesso/equipe">Acesso da equipe</Link></footer>
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
          <Route path="chamados/:id" element={<TicketDetail profile={profile} key={route[1]} id={route[1]} created={location.state?.created === true} />} />
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
