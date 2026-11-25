import { UserRound } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { Link, useLocation } from 'react-router-dom'

export function ProfileMenu({ profilePath }: { profilePath: string }) {
  const menu = useRef<HTMLDetailsElement>(null)
  const location = useLocation()

  useEffect(() => {
    if (menu.current) menu.current.open = false
  }, [location.key])

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      const panel = menu.current
      if (panel?.open && event.target instanceof Node && !panel.contains(event.target)) panel.open = false
    }
    document.addEventListener('pointerdown', closeOutside)
    return () => document.removeEventListener('pointerdown', closeOutside)
  }, [])

  return <details className="profile-menu profile-menu-avatar" ref={menu} onKeyDown={(event) => {
    if (event.key === 'Escape' && event.currentTarget.open) {
      event.preventDefault()
      event.currentTarget.open = false
      event.currentTarget.querySelector('summary')?.focus()
    }
  }}>
    <summary aria-label="Menu do perfil"><UserRound size={24} aria-hidden /></summary>
    <div className="profile-menu-actions">
      <Link to={profilePath}><UserRound size={18} aria-hidden /> Meu perfil</Link>
    </div>
  </details>
}
