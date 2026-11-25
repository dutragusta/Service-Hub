import { loadKnowledge } from './services/knowledge'
import { getTopics } from './services/operations'
import '@fontsource-variable/manrope/wght.css'
import './styles.css'
import { Bell, CircleHelp, BookOpen, Building2, Headphones, House, ClipboardList, Settings, Ticket, UserRound } from 'lucide-react'
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
import { queuePath, settingsPath, useTeamIdentity } from './services/access'
import { ServiceDemo } from './pages/ServiceDemo'
import { TeamQueue, TeamSettings } from './pages/Team'
import { NewTicket, TicketDetail, Tickets } from './pages/Tickets'
import type { Profile } from './types'

const navItems = [
  { label: 'Início', route: '', icon: House },
  { label: 'Assistente', route: '/assistente', icon: Headphones },
  { label: 'Meus chamados', route: '/chamados', icon: Ticket },
  { label: 'Base de conhecimento', route: '/conhecimento', icon: BookOpen },
]

const introCopy = {
  default: { label: 'Central de atendimento', title: 'Como podemos ajudar?', details: 'Encontre orientações, resolva problemas e acompanhe suas solicitações de suporte.' },
  colaborador: { label: 'Portal do colaborador', title: 'Suporte no trabalho', details: 'Resolva problemas de acesso à VPN, contas corporativas e Microsoft Teams.' },
  cliente: { label: 'Portal do cliente', title: 'Suporte ao cliente', details: 'Receba ajuda com o portal, consulte documentação e solicite suporte para serviços contratados.' },
}

function Entry() {
  const [hovered, setHovered] = useState<Profile | null>(null)
  const [focused, setFocused] = useState<Profile | null>(null)
  const preview = hovered ?? focused ?? 'default'
  const analyst = useTeamIdentity(true, true)
  return <div className="entry">
    <header className="entry-header"><Brand /><div className="header-actions"><span className="demo-label">Demonstração</span><ProfileMenu /></div></header>
    <main className="entry-main page-enter" id="main">
      <section className="entry-intro" data-preview={preview}>
        <div className="entry-intro-copy">
          {Object.entries(introCopy).map(([key, intro]) => (
            <div className="entry-intro-content" key={key} data-current={key === preview} aria-hidden={key !== preview}>
              <span className="intro-label">{intro.label}</span>
              <h1 tabIndex={key === preview ? -1 : undefined}>{intro.title}</h1>
              <p>{intro.details}</p>
            </div>
          ))}
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
        <h2 id="profile-heading">Escolha seu perfil</h2>
        <div className="profile-grid">{(['colaborador', 'cliente'] as const).map((profile) => {
          const Icon = profile === 'colaborador' ? UserRound : Building2
          return <Link key={profile} className="profile-card" to={'/acesso/' + profile} data-previewed={preview === profile}
            onPointerEnter={(event) => { if (event.pointerType === 'mouse') setHovered(profile) }}
            onPointerLeave={() => setHovered(null)}
            onFocus={(event) => { if (event.currentTarget.matches(':focus-visible')) setFocused(profile) }}
            onBlur={() => setFocused(null)}>
            <span className="icon-box"><Icon size={23} aria-hidden /></span><strong>Sou {profile}</strong><p>{profiles[profile].description}</p><span className="profile-action">{profile === 'colaborador' ? 'Verificar e-mail' : 'Entrar ou solicitar cadastro'}</span>
          </Link>
        })}</div>
        <div className="actions entry-access-links">{analyst?.demo
          ? <Link to={queuePath}>Abrir fila do analista · simulação local</Link>
          : <Link to="/acesso/equipe">Acesso da equipe</Link>}</div>
      </section>
    </main>
    <footer className="entry-footer"><span>Service Hub</span><span>Protótipo com dados fictícios</span></footer>
  </div>
}

type ConversationRecord = Partial<Record<Profile, Conversation>>

function PortalShell({ conversations, update }: { conversations: ConversationRecord, update: (profile: Profile, conversation: Conversation) => void }) {
  const { profile: candidate, '*': remainder = '' } = useParams()
  const location = useLocation()
  const identity = useTeamIdentity(candidate === 'colaborador')
  const role = identity?.role
  const [knowledgeReady, setKnowledgeReady] = useState<string>()
  useEffect(() => {
    if (candidate !== 'cliente' && candidate !== 'colaborador') return
    const controller = new AbortController()
    void loadKnowledge(candidate, controller.signal).then(() => {
      if (!controller.signal.aborted) setKnowledgeReady(candidate)
    })
    return () => controller.abort()
  }, [candidate])
  const updateProfile = useCallback((conversation: Conversation) => {
    if (candidate === 'colaborador' || candidate === 'cliente') update(candidate, conversation)
  }, [candidate, update])
  if (candidate !== 'colaborador' && candidate !== 'cliente') return <main id="main" className="workspace"><Empty title="Portal indisponível"><Link to="/">Escolher perfil</Link></Empty></main>
  if (knowledgeReady !== candidate) return <main id="main" className="workspace"><p role="status">Consultando a base de conhecimento…</p></main>
  const profile = candidate
  const base = '/' + profile
  const route = remainder.split('/')
  const selected = getTopics(profile).find((item) => item.id === new URLSearchParams(location.search).get('assunto'))
  return <div className="shell">
    <aside className="sidebar">
      <Link to={base} className="sidebar-brand" aria-label={profiles[profile].portal + ' — início'}><Brand /></Link>
      <div className="sidebar-profile">{profiles[profile].portal}</div>
      <nav aria-label="Navegação principal">
        {navItems.map(({ label, route, icon: Icon }) => <NavLink key={label} to={base + route} end={!route}><Icon size={19} aria-hidden /><span>{label}</span></NavLink>)}
        {profile === 'colaborador' && role && <NavLink to={queuePath}><ClipboardList size={19} aria-hidden /><span>Fila de suporte</span></NavLink>}
      </nav>
    </aside>
    <header className="topbar">
      <span className="topbar-title">Central de atendimento</span><Link className="topbar-brand" to={base}><Brand /></Link>
      <div className="header-actions topbar-actions">
        {profile === 'colaborador' && role === 'admin' && <NavLink className="header-icon" to={settingsPath} aria-label="Configurações" title="Configurações"><Settings size={21} aria-hidden /></NavLink>}
        <NavLink className="header-icon" to={base + '/notificacoes'} aria-label="Notificações" title="Notificações"><Bell size={21} aria-hidden /></NavLink>
        <NavLink className="header-icon" to={base + '/conhecimento'} aria-label="Ajuda" title="Ajuda"><CircleHelp size={22} aria-hidden /></NavLink>
        <ProfileMenu profilePath={base + '/perfil'} />
      </div>
    </header>
    <div className="shell-content">
      <main id="main" className="workspace page-enter" key={location.pathname}>
        <Routes>
          <Route index element={<Portal profile={profile} />} />
          <Route path="perfil" element={<MyProfile profile={profile} role={role} />} />
          <Route path="notificacoes" element={<Notifications profile={profile} />} />
          {profile === 'colaborador' && <Route path="configuracoes/*" element={<TeamSettings role={role} />} />}
          {profile === 'colaborador' && <Route path="fila-suporte/*" element={<TeamQueue identity={identity} />} />}
          {profile === 'cliente' && <Route path="demonstracao" element={<ServiceDemo />} />}
          <Route path="assistente" element={<ConversationPage key={location.key} profile={profile} topic={selected} conversation={conversations[profile]} update={updateProfile} />} />
          <Route path="diagnostico/:id" element={<Diagnosis key={route[1]} profile={profile} id={route[1]} />} />
          <Route path="chamados" element={<Tickets profile={profile} />} />
          <Route path="chamados/novo" element={<NewTicket key={location.search} profile={profile} />} />
          <Route path="chamados/:id" element={<TicketDetail profile={profile} id={route[1]} created={location.state?.created === true} />} />
          <Route path="conhecimento" element={<Knowledge profile={profile} />} />
          <Route path="conhecimento/:id" element={<Knowledge profile={profile} article={route[1]} />} />
          <Route path="*" element={<Empty title="Página indisponível"><Link to={base}>Voltar ao início</Link></Empty>} />
        </Routes>
      </main>
      <footer className="workspace-footer">Service Hub · Dados fictícios</footer>
    </div>
  </div>
}

function ConversationPage({ profile, topic, conversation, update }: { profile: Profile, topic?: Conversation['topic'], conversation?: Conversation, update: (conversation: Conversation) => void }) {
  const [initial] = useState(() => topic && topic.id !== conversation?.topic?.id ? initialConversation(topic) : conversation ?? initialConversation())
  const [active, setActive] = useState(initial)
  useEffect(() => { update(initial) }, [initial, update])
  return <Assistant profile={profile} conversation={active} update={(next) => { setActive(next); update(next) }} />
}

function LegacySupportTicket() {
  const { audience, ticketId } = useParams()
  const target = (audience === 'colaborador' || audience === 'cliente') && ticketId
    ? `${queuePath}/${audience}/${encodeURIComponent(ticketId)}`
    : queuePath
  return <Navigate replace to={target} />
}

function App() {
  const { pathname } = useLocation()
  const [conversations, setConversations] = useState<ConversationRecord>({})
  const update = useCallback((profile: Profile, conversation: Conversation) => {
    setConversations((current) => current[profile] === conversation ? current : { ...current, [profile]: conversation })
  }, [])
  useEffect(() => {
    window.scrollTo(0, 0)
    document.querySelector<HTMLElement>('main h1[tabindex="-1"]')?.focus({ preventScroll: true })
  }, [pathname])
  return <><a className="skip" href="#main" onClick={(event) => { event.preventDefault(); const main = document.getElementById('main'); main?.setAttribute('tabindex', '-1'); main?.focus() }}>Pular para o conteúdo</a>
    <Routes><Route path="/" element={<Entry />} />
      <Route path="/acesso/equipe" element={<StaffAccess />} />
      <Route path="/acesso/:profile" element={<PortalAccess />} />
      <Route path="/acesso/:profile/cadastro" element={<PortalAccess registration />} /><Route path="/convite/:token" element={<AcceptInvite />} /><Route path="/equipe/admin" element={<Navigate replace to={settingsPath} />} />
      <Route path="/equipe/fila/:audience/:ticketId" element={<LegacySupportTicket />} />
      <Route path="/equipe/fila" element={<Navigate replace to={queuePath} />} /><Route path="/:profile/*" element={<PortalShell conversations={conversations} update={update} />} /></Routes>
  </>
}

createRoot(document.getElementById('root')!).render(<HashRouter><App /></HashRouter>)
