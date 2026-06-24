import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { site } from '../../data/site'

function NavLink({ href, label, onClick }: { href: string; label: string; onClick?: () => void }) {
  const location = useLocation()
  const isRoute = href.startsWith('/')
  const className = 'text-[11px] font-medium tracking-[0.15em] text-stone uppercase transition-colors hover:text-gold'

  if (isRoute) {
    const active = location.pathname === href
    return (
      <Link to={href} onClick={onClick} className={`${className} ${active ? 'text-gold' : ''}`}>
        {label}
      </Link>
    )
  }

  return (
    <a href={href} onClick={onClick} className={className}>
      {label}
    </a>
  )
}

export function Header() {
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)

  return (
    <header className="om-enter-header sticky top-0 z-50 border-b border-gold/20 bg-ivory/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Link to="/" className="group">
          <span className="font-display text-xl font-medium tracking-wide text-forest md:text-2xl">{site.name}</span>
          <span className="mt-0.5 block text-[10px] tracking-[0.25em] text-gold-muted uppercase">{site.title}</span>
        </Link>
        <nav className="hidden items-center gap-8 md:flex">
          {site.nav.map((item) => (
            <NavLink key={item.id} href={item.href} label={item.label} />
          ))}
        </nav>
        <div className="flex items-center gap-4">
          <a
            href="/#contact"
            className="om-btn hidden border border-gold/50 px-5 py-2 text-[10px] font-medium tracking-[0.2em] text-gold uppercase hover:bg-gold/10 sm:inline-block"
          >
            Консультация
          </a>
          <button
            type="button"
            onClick={() => setOpen(!open)}
            className="p-2 text-forest md:hidden"
            aria-label="Меню"
            aria-expanded={open}
          >
            <span className="text-lg">{open ? '✕' : '☰'}</span>
          </button>
        </div>
      </div>
      {open && (
        <nav className="border-t border-gold/15 px-6 py-5 md:hidden">
          <div className="flex flex-col gap-4">
            {site.nav.map((item) => (
              <NavLink key={item.id} href={item.href} label={item.label} onClick={close} />
            ))}
            <Link to="/admin" onClick={close} className="text-[11px] tracking-[0.15em] text-gold-muted uppercase">
              Админ
            </Link>
          </div>
        </nav>
      )}
    </header>
  )
}
