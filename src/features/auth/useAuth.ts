import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRepos } from '@/data/provider'
import { seedIfEmpty } from '@/data/seed/seed'

export function useAuth() {
  const repos = useRepos()
  const { auth } = repos
  const qc = useQueryClient()
  const user = useQuery({ queryKey: ['user'], queryFn: () => auth.getUser() })
  const signIn = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => auth.signIn(email, password),
    onSuccess: (u) => {
      qc.setQueryData(['user'], u)
      // Dev convenience: a fresh local store gets ~30 NYC entries so the app looks alive.
      // Not awaited, so sign-in stays instant; lists refresh when seeding finishes.
      if (import.meta.env.DEV && auth.mode === 'local') {
        void seedIfEmpty(repos).then((n) =>
          n > 0 ? Promise.all([qc.invalidateQueries({ queryKey: ['visits'] }), qc.invalidateQueries({ queryKey: ['places'] })]) : undefined,
        )
      }
    },
  })
  const signUp = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) => auth.signUp(email, password),
    onSuccess: (u) => {
      qc.setQueryData(['user'], u)
      if (u && import.meta.env.DEV && auth.mode === 'local') void seedIfEmpty(repos)
    },
  })
  const signOut = useMutation({
    mutationFn: () => auth.signOut(),
    onSuccess: () => {
      qc.clear() // never leave one account's data in memory for the next
      qc.setQueryData(['user'], null)
    },
  })
  return { user: user.data ?? null, loading: user.isLoading, mode: auth.mode, signIn, signUp, signOut }
}
