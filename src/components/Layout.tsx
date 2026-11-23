import type { ReactNode } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router'
import { paths } from '../paths'
import { IconBack, IconCart, IconPlus, IconTag } from './icons'

/** Main tab layout: content + floating "+ Belanja" button + bottom nav. */
export function TabLayout() {
  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-[calc(5rem+env(safe-area-inset-bottom))]">
      <Outlet />

      <Link
        to={paths.newTrip}
        className="fixed right-4 bottom-[calc(5rem+env(safe-area-inset-bottom))] z-20 flex items-center gap-1.5 rounded-full bg-emerald-700 py-3 pr-5 pl-4 font-semibold text-white shadow-lg shadow-emerald-900/25 transition active:scale-95 hover:bg-emerald-800 sm:right-[max(1rem,calc(50vw-21rem))] dark:bg-emerald-600 dark:hover:bg-emerald-500"
      >
        <IconPlus className="size-5" />
        Belanja
      </Link>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-stone-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur dark:border-stone-800 dark:bg-stone-900/95">
        <div className="mx-auto flex max-w-2xl">
          <TabLink to={paths.items} icon={<IconTag />} label="Barang" />
          <TabLink to={paths.trips} icon={<IconCart />} label="Belanja" />
        </div>
      </nav>
    </div>
  )
}

function TabLink({ to, icon, label }: { to: string; icon: ReactNode; label: string }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs font-medium ${
          isActive
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-stone-500 hover:text-stone-700 dark:text-stone-400 dark:hover:text-stone-200'
        }`
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

/** Detail page layout: no bottom nav. */
export function DetailLayout() {
  return (
    <div className="mx-auto min-h-dvh max-w-2xl pb-[env(safe-area-inset-bottom)]">
      <Outlet />
    </div>
  )
}

/** back: fallback route when the page was opened directly (no history). */
type HeaderProps = { title: ReactNode; back?: string; right?: ReactNode }

export function PageHeader({ title, back, right }: HeaderProps) {
  const navigate = useNavigate()
  const location = useLocation()
  return (
    <header className="sticky top-0 z-10 flex min-h-14 items-center gap-1 border-b border-stone-200 bg-stone-100/95 px-2 pt-[env(safe-area-inset-top)] backdrop-blur dark:border-stone-800 dark:bg-stone-950/95">
      {back && (
        <button
          type="button"
          aria-label="Kembali"
          onClick={() => {
            if (location.key !== 'default') navigate(-1)
            else navigate(back)
          }}
          className="rounded-full p-2 text-stone-600 hover:bg-stone-200 dark:text-stone-300 dark:hover:bg-stone-800"
        >
          <IconBack />
        </button>
      )}
      <h1 className={`min-w-0 flex-1 truncate text-lg font-bold ${back ? '' : 'pl-2'}`}>{title}</h1>
      {right}
    </header>
  )
}
