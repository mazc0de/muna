import { supabase } from '../lib/supabase'
import { IconLogout } from './icons'

export function LogoutButton() {
  return (
    <button
      type="button"
      onClick={() => supabase.auth.signOut()}
      className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-stone-500 hover:bg-stone-200 hover:text-stone-800 dark:text-stone-400 dark:hover:bg-stone-800 dark:hover:text-stone-100"
    >
      <IconLogout className="size-4" />
      Keluar
    </button>
  )
}
