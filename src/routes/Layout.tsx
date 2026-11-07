import { NavLink, Outlet } from 'react-router'

const TABS = [
  { to: '/library', label: 'Library' },
  { to: '/map', label: 'Map' },
  { to: '/log', label: 'Log' },
  { to: '/lists', label: 'Lists' },
] as const

export default function Layout() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-2xl flex-col">
      <main className="flex-1 px-5 pb-28 pt-8">
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
