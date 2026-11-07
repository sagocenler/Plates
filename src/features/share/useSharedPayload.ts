import { useQuery } from '@tanstack/react-query'
import { useRepos } from '@/data/provider'
import { buildSharedPayload, type SharedPayload } from '@/domain/share'

/**
 * Resolves a share token to the recipient-safe payload (or null = "no longer available").
 * Local repos today; the Supabase version will call the get_shared(token) RPC instead.
 */
export function useSharedPayload(token: string | undefined) {
  const repos = useRepos()
  return useQuery<SharedPayload | null>({
    queryKey: ['shared', token],
    staleTime: 0,
    gcTime: 0,
    queryFn: async () => {
      if (!token) return null
      const share = await repos.shares.get(token)
      if (!share || share.revokedAt) return null
      const [places, visits, lists, items] = await Promise.all([repos.places.list(), repos.visits.list(), repos.lists.lists(), repos.lists.items()])
      const list = share.kind === 'list' ? lists.find((l) => l.id === share.targetId) : undefined
      return buildSharedPayload(share, { places, visits, ...(list ? { list } : {}), items: items.filter((i) => i.listId === share.targetId) })
    },
  })
}
