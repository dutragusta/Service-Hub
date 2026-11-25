import { catalogFor } from './knowledge'
import type { Profile, Topic } from '../types'

const knowledgeKey = 'service-hub-demo-knowledge-v1'
const sessionsKey = 'service-hub-demo-sessions-v1'

function readLocal<T>(key: string, fallback: T): T {
  try {
    const item = localStorage.getItem(key)
    return item ? JSON.parse(item) as T : fallback
  } catch {
    return fallback
  }
}

export function getTopics(profile: Profile) {
  const overrides = readLocal<Partial<Record<Profile, Record<string, Topic>>>>(knowledgeKey, {})
  return catalogFor(profile).map((topic) => ({ ...topic, ...overrides[profile]?.[topic.id] }))
}

export function saveTopic(profile: Profile, topic: Topic) {
  const overrides = readLocal<Partial<Record<Profile, Record<string, Topic>>>>(knowledgeKey, {})
  localStorage.setItem(knowledgeKey, JSON.stringify({
    ...overrides, [profile]: { ...overrides[profile], [topic.id]: topic },
  }))
}

type Outcome = 'resolved' | 'escalated'
type ServiceSession = { profile: Profile, source: 'Assistente' | 'Artigo', outcomes: Outcome[] }

export function recordSession(id: string, profile: Profile, source: ServiceSession['source'], outcome?: Outcome) {
  try {
    const sessions = readLocal<Record<string, ServiceSession>>(sessionsKey, {})
    const previous = sessions[id] ?? { profile, source, outcomes: [] }
    if (sessions[id] && (!outcome || previous.outcomes.includes(outcome))) return
    sessions[id] = outcome ? { ...previous, outcomes: [...previous.outcomes, outcome] } : previous
    localStorage.setItem(sessionsKey, JSON.stringify(sessions))
  } catch {
    // The browser may block persistence. The support flow can still be used.
  }
}

export function sessionMetrics() {
  const sessions = Object.values(readLocal<Record<string, ServiceSession>>(sessionsKey, {}))
  return {
    started: sessions.length,
    resolved: sessions.filter(({ outcomes }) => outcomes.includes('resolved')).length,
    escalated: sessions.filter(({ outcomes }) => outcomes.includes('escalated')).length,
  }
}

export function knowledgeReference({ id, title, code, revision }: Topic) {
  return { id, title, code, revision }
}
