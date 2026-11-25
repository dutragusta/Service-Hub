import { knowledgeMode } from '../services/knowledge'
import { getTopics, knowledgeReference, recordSession } from '../services/operations'
import { BookOpen, Headphones, Mail, Plus, Search } from 'lucide-react'
import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import { Empty, Heading, TopicCards, TopicIcon } from '../components/ui'
import { profiles } from '../demo'
import { readTickets, searchTopics } from '../services/support'
import type { Profile, TicketContext, Topic } from '../types'
import { TicketList } from './Tickets'

export function Portal({ profile }: { profile: Profile }) {
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState<string | null>(null)
  const base = '/' + profile
  const topics = search === null ? getTopics(profile) : searchTopics(profile, search)
  return <>
    <section className="hero">
      <div className="hero-copy"><h1 tabIndex={-1}>Como podemos ajudar?</h1><p>{profiles[profile].hero}</p>
      <form className="search" role="search" onSubmit={(event) => { event.preventDefault(); setSearch(query.trim() || null) }}>
        <Search className="search-icon" size={18} aria-hidden /><label className="sr-only" htmlFor="portal-search">Buscar por assunto</label>
        <input id="portal-search" type="search" value={query} onChange={(event) => { setQuery(event.target.value); if (!event.target.value) setSearch(null) }} placeholder="Buscar por assunto" />
        <button className="button primary">Buscar</button>
      </form></div>
      <div className="hero-art" aria-hidden><svg viewBox="0 0 330 235" fill="none"><path d="M35 223V151h61V82h88V25h117M115 223v-55h120v-64h66M274 223v-37h27M32 111h32V50h120M187 166v57" stroke="currentColor"/><path d="M32 195h95v-70h111V57h63M125 82V25h59" stroke="currentColor" strokeDasharray="4 6"/><g fill="currentColor"><circle cx="96" cy="151" r="4"/><circle cx="184" cy="82" r="4"/><circle cx="235" cy="168" r="4"/><circle cx="64" cy="50" r="4"/><circle cx="274" cy="186" r="4"/><circle cx="238" cy="57" r="4"/></g></svg></div>
    </section>
    <div className="portal-columns">
      <div>
        <section aria-labelledby="topics-title"><div className="section-heading"><h2 id="topics-title">{search === null ? 'Assuntos frequentes' : 'Resultados da busca'}</h2>{search !== null && <button className="text-button" onClick={() => { setSearch(null); setQuery('') }}>Limpar busca</button>}</div>
        {search !== null && <p className="search-summary" role="status">{knowledgeMode(profile) === 'servidor' ? 'Base fictícia consultada via API' : knowledgeMode(profile) === 'contingencia' ? 'Cópia de contingência' : 'Base fictícia local'} · {topics.length} {topics.length === 1 ? 'resultado' : 'resultados'} para “{search}”</p>}
        {topics.length ? <TopicCards topics={topics} url={(id) => base + '/assistente?assunto=' + id} /> : <Empty title="Nenhuma orientação encontrada"><p>Tente outro termo ou descreva o problema ao assistente.</p><Link className="button secondary" to={base + '/assistente'}>Abrir assistente</Link></Empty>}
        </section>
        <section className="recent" aria-labelledby="recent-title"><div className="section-heading"><h2 id="recent-title">Chamados recentes</h2><Link className="text-button" to={base + '/chamados'}>Ver todos</Link></div>
          <TicketList base={base} tickets={readTickets(profile).slice(0, 3)} />
        </section>
      </div>
      <aside aria-label="Opções de suporte" className="support-rail">
        <div className="assistant-card"><span className="icon-box"><Headphones size={22} aria-hidden /></span><h2>Assistente virtual</h2><p>Descreva sua dificuldade e receba orientações passo a passo.</p><Link className="button primary" to={base + '/assistente'}>Iniciar conversa</Link></div>
        <Link className="rail-link" to={base + '/chamados/novo'}><Plus size={18} aria-hidden /> Abrir chamado</Link>
        {profile === 'cliente' && <Link className="rail-link" to={base + '/demonstracao'}><Mail size={18} aria-hidden /> Ver demonstração por e-mail</Link>}
        <Link className="rail-link" to={base + '/conhecimento'}><BookOpen size={18} aria-hidden /> Base de conhecimento</Link>
      </aside>
    </div>
  </>
}

export function Knowledge({ profile, article }: { profile: Profile, article?: string }) {
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const category = params.get('categoria') ?? ''
  const base = '/' + profile
  const selected = getTopics(profile).find((topic) => topic.id === article)
  if (article) {
    if (!selected) return <Empty title="Artigo indisponível"><Link to={base + '/conhecimento'}>Voltar à base de conhecimento</Link></Empty>
    return <><Link className="back" to={base + '/conhecimento'}>Voltar à base de conhecimento</Link><Heading title={selected.title} description={selected.description} />
      <KnowledgeArticle key={profile + selected.id} profile={profile} topic={selected} /></>
  }
  const topics = searchTopics(profile, query).filter((topic) => !category || topic.id === category)
  return <><Heading title="Base de conhecimento" description="Consulte orientações disponíveis para o seu perfil." />
    <div className="filter-bar"><label>Buscar artigos<input type="search" value={query} placeholder="Nome ou assunto" onChange={(event) => setParams({ q: event.target.value, categoria: category }, { replace: true })} /></label><label>Categoria<select value={category} onChange={(event) => setParams({ q: query, categoria: event.target.value }, { replace: true })}><option value="">Todas as categorias</option>{getTopics(profile).map((topic) => <option key={topic.id} value={topic.id}>{topic.title}</option>)}</select></label></div>
    <p className="search-summary" role="status">{knowledgeMode(profile) === 'servidor' ? 'Base fictícia consultada via API' : knowledgeMode(profile) === 'contingencia' ? 'Cópia de contingência' : 'Base fictícia local'} · {topics.length} {topics.length === 1 ? 'artigo' : 'artigos'}</p>
    {topics.length ? <TopicCards topics={topics} url={(id) => base + '/conhecimento/' + id} /> : <Empty title="Nenhum artigo encontrado"><button className="button secondary" onClick={() => setParams({})}>Limpar filtros</button></Empty>}
  </>
}

function KnowledgeArticle({ profile, topic }: { profile: Profile, topic: Topic }) {
  const previous = useLocation().state?.context as TicketContext | undefined
  const inherited = previous?.profile === profile ? previous : undefined
  const [sessionId] = useState(() => inherited?.sessionId ?? crypto.randomUUID())
  const [feedback, setFeedback] = useState<'yes' | 'no'>()
  const base = '/' + profile
  const source = inherited?.sessionSource ?? 'Artigo'
  const context: TicketContext = {
    ...inherited, profile, source: 'Artigo da base de conhecimento', article: knowledgeReference(topic), sessionId, sessionSource: source,
    guidance: topic.steps,
    outcome: 'O usuário informou que a orientação do artigo não resolveu.',
  }

  function answer(result: 'yes' | 'no') {
    recordSession(sessionId, profile, source, result === 'yes' ? 'resolved' : undefined)
    setFeedback(result)
  }

  return <article className="card narrow">
    <TopicIcon id={topic.id} /><h2>Como verificar o problema</h2><p>{topic.question}</p>
    <dl className="knowledge-metadata">
      {topic.code && <><dt>Referência</dt><dd>{topic.code} · Revisão {topic.revision}</dd></>}
      {topic.owner && <><dt>Equipe responsável</dt><dd>{topic.owner}</dd></>}
      {topic.reviewedOn && <><dt>Revisado em</dt><dd><time dateTime={topic.reviewedOn}>{topic.reviewedOn.split('-').reverse().join('/')}</time></dd></>}
    </dl>
    <ol className="steps">{topic.steps.map((step) => <li key={step}>{step}</li>)}</ol>
    {topic.escalation && <p className="alert">{topic.escalation}</p>}
    <Link className="button secondary" to={base + '/diagnostico/' + topic.id} state={{ context }}>Iniciar diagnóstico</Link>
    <section className="article-feedback" aria-labelledby="article-feedback-title">
      <h2 id="article-feedback-title">Isso resolveu o problema?</h2>
      {feedback === 'yes' ? <p role="status" className="alert success">Resolução registrada.</p> : <>
        <div className="actions"><button className="button primary" onClick={() => answer('yes')}>Sim, resolveu</button><button className="button secondary" aria-pressed={feedback === 'no'} onClick={() => answer('no')}>Ainda preciso de ajuda</button></div>
        {feedback === 'no' && <Link className="button secondary" to={base + '/chamados/novo?assunto=' + topic.id} state={{ context }}>Abrir chamado com contexto</Link>}
      </>}
    </section>
  </article>
}
