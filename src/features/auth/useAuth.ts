import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useRepos } from '@/data/provider'
import { seedIfEmpty } from '@/data/seed/seed'

export function useAuth() {
  const repos = useRepos()
  const { auth } = repos
  const qc = useQueryClient()
  const user = useQuery({ queryKey: ['user'], queryFn: () => auth.getUser() })
  const signIn = useMutation({
    mutationFn: (email: string) => auth.signIn(email),
    onSuccess: async (u) => {
      // Dev convenience: a fresh local store gets ~30 NYC entries so the app looks alive.
      if (import.meta.env.DEV) await seedIfEmpty(repos)
      qc.setQueryData(['user'], u)
    },
  })
  const signOut = useMutation({
    mutationFn: () => auth.signOut(),
    onSuccess: () => qc.setQueryData(['user'], null),
  })
  return { user: user.data ?? null, loading: user.isLoading, signIn, signOut }
}
