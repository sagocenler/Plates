import { NavLink, Outlet } from 'react-router'
import StatusBanners from '@/components/StatusBanners'

const TABS = [
  { to: '/library', label: 'Library' },
  { to: '/map', label: 'Map' },
  { to: '/log', label: 'Log' },
  { to: '/lists', label: 'Lists' },
] as const

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-accent focus:px-4 focus:py-2 focus:text-accent-ink">
        Skip to content
      </a>
      <StatusBanners />
      <main id="main" tabIndex={-1} className="flex-1 px-5 pb-28 pt-8 outline-none">
        <Outlet />
      </main>
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-10 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur"
      >
        <ul className="mx-auto flex max-w-2xl">
          {TABS.map((t) => (
            <li key={t.to} className="flex-1">
              <NavLink
                to={t.to}
                className={({ isActive }) =>
                  `block py-4 text-center text-sm ${isActive ? 'font-semibold text-accent' : 'text-muted'}`
                }
              >
                {t.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
