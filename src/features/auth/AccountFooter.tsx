import { useAuth } from './useAuth'

export default function AccountFooter() {
  const { user, signOut } = useAuth()
  if (!user) return null
  return (
    <footer className="mt-12 flex items-center justify-between gap-3 border-t border-line pt-4 text-sm">
      <span className="min-w-0 truncate text-muted">Signed in as {user.displayName || 'you'}</span>
      <button type="button" onClick={() => signOut.mutate()} className="min-h-11 shrink-0 px-2 underline">
        Sign out
      </button>
    </footer>
  )
}
