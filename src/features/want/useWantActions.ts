import { useQueryClient } from '@tanstack/react-query'
import { newId } from '@/data/local/repos'
import type { PlaceSearchResult } from '@/data/interfaces'
import { useRepos } from '@/data/provider'
import { useWants } from '@/data/queries'
import type { Id, WantItem } from '@/domain/types'
import { useAuth } from '@/features/auth/useAuth'

export function useWantActions() {
  const repos = useRepos()
  const qc = useQueryClient()
  const { user } = useAuth()
  const wants = useWants().data ?? []
  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['wants'] }), qc.invalidateQueries({ queryKey: ['places'] })])

  return {
    wants,
    async add(result: PlaceSearchResult): Promise<WantItem> {
      const place = await repos.places.upsert(result)
      const item = await repos.wants.add({ id: newId(), userId: user?.id ?? 'local-user', placeId: place.id, note: '', addedAt: new Date().toISOString() })
      await refresh()
      return item
    },
    async saveNote(item: WantItem, note: string) {
      if (item.note === note.trim()) return
      await repos.wants.update({ ...item, note: note.trim() })
      await refresh()
    },
    async remove(id: Id) {
      await repos.wants.remove(id)
      await refresh()
    },
  }
}
