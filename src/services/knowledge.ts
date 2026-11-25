import { catalog } from '../demo'
import type { Profile, Topic } from '../types'

export type KnowledgeMode = 'servidor' | 'local' | 'contingencia'
const downloaded: Partial<Record<Profile, Topic[]>> = {}
const knowledgeModes: Partial<Record<Profile, KnowledgeMode>> = {}

export function catalogFor(profile: Profile) {
  return downloaded[profile] ?? catalog[profile]
}

export function knowledgeMode(profile: Profile): KnowledgeMode {
  return knowledgeModes[profile] ?? 'local'
}

function validTopic(value: Topic) {
  return typeof value?.id === 'string' && typeof value.title === 'string' &&
    typeof value.description === 'string' && typeof value.question === 'string' &&
    typeof value.code === 'string' && typeof value.revision === 'string' &&
    Array.isArray(value.keywords) && value.keywords.every((keyword) => typeof keyword === 'string') &&
    Array.isArray(value.steps) && value.steps.length > 0 && value.steps.every((step) => typeof step === 'string')
}

export async function loadKnowledge(profile: Profile, signal: AbortSignal) {
  if (import.meta.env.DEV || import.meta.env.MODE === 'pages') return
  try {
    const request = await fetch('/api/knowledge?profile=' + profile, {
      cache: 'no-store', signal: AbortSignal.any([signal, AbortSignal.timeout(2000)]),
    })
    if (!request.ok) throw new Error('Base indisponível')
    const snapshot: unknown = await request.json()
    if (signal.aborted) return
    if (!snapshot || typeof snapshot !== 'object' || !('profile' in snapshot) || snapshot.profile !== profile ||
        !('articles' in snapshot) || !Array.isArray(snapshot.articles) ||
        !snapshot.articles.length || !snapshot.articles.every(validTopic)) throw new Error('Resposta inválida')
    downloaded[profile] = snapshot.articles
    knowledgeModes[profile] = 'servidor'
  } catch {
    if (!signal.aborted) knowledgeModes[profile] = 'contingencia'
  }
}
