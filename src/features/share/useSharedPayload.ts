import { useQuery } from '@tanstack/react-query'
import { useRepos } from '@/data/provider'
import type { SharedPayload } from '@/domain/share'

/** Resolves a share token to the recipient-safe payload (null = "no longer available"). */
export function useSharedPayload(token: string | undefined) {
  const { shared } = useRepos()
  return useQuery<SharedPayload | null>({
    queryKey: ['shared', token],
    staleTime: 0,
    gcTime: 0,
    queryFn: () => (token ? shared.getShared(token) : null),
  })
}
