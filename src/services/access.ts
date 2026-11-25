import { useEffect, useState } from 'react'

export const settingsPath = '/equipe/configuracoes'
export const queuePath = '/equipe/fila'

export type TeamRole = 'admin' | 'support'
export type TeamIdentity = { role: TeamRole | null, email?: string, demo?: boolean }
export type Permission = { email: string, role: TeamRole, expires_at: number | null }

export async function accessRequest<T>(path: string, body?: object): Promise<T> {
  const response = await fetch(path, body ? {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  } : { cache: 'no-store' })
  const result = await response.json()
  if (!response.ok) throw new Error(result.error ?? 'Não foi possível verificar o acesso.')
  return result
}

export function useTeamRole(enabled: boolean) {
  return useTeamIdentity(enabled)?.role
}

export function useTeamIdentity(enabled: boolean, singleCheck = false) {
  const [verified, setVerified] = useState<TeamIdentity>()
  useEffect(() => {
    if (!enabled) {
      setVerified(undefined)
      return
    }
    let active = true
    let requestId = 0
    async function refresh() {
      const sequence = ++requestId
      const identity = await accessRequest<TeamIdentity>('/api/access').catch(() => ({ role: null }))
      if (active && sequence === requestId) setVerified(identity)
    }
    void refresh()
    if (singleCheck) return () => { active = false }
    window.addEventListener('focus', refresh)
    const timer = window.setInterval(refresh, 15000)
    return () => { active = false; window.removeEventListener('focus', refresh); window.clearInterval(timer) }
  }, [enabled, singleCheck])
  return enabled ? verified : undefined
}

export async function requireTeamRole(admin = false) {
  const identity = await accessRequest<TeamIdentity>('/api/access')
  if (!identity.role || (admin && identity.role !== 'admin')) throw new Error('Sua conta não tem permissão para esta ação.')
  return identity
}
