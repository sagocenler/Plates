import { useQueryClient } from '@tanstack/react-query'
import { newId } from '@/data/local/repos'
import { useRepos } from '@/data/provider'
import { useAllListItems, useLists } from '@/data/queries'
import { cleanName, moveBy, nextPosition } from '@/domain/lists'
import type { Id, List } from '@/domain/types'
import { useAuth } from '@/features/auth/useAuth'

/** All list mutations. Each one invalidates the list queries so every screen stays in sync. */
export function useListActions() {
  const { lists: repo } = useRepos()
  const qc = useQueryClient()
  const { user } = useAuth()
  const lists = useLists().data ?? []
  const items = useAllListItems().data ?? []

  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['lists'] }), qc.invalidateQueries({ queryKey: ['listItems'] })])

  return {
    lists,
    items,
    async createList(name: string): Promise<List | null> {
      const clean = cleanName(name)
      if (!clean) return null
      const list = await repo.saveList({ id: newId(), userId: user?.id ?? 'local-user', name: clean, position: nextPosition(lists.map((l) => l.position)) })
      await refresh()
      return list
    },
    async renameList(list: List, name: string) {
      const clean = cleanName(name)
      if (!clean || clean === list.name) return
      await repo.saveList({ ...list, name: clean })
      await refresh()
    },
    async deleteList(id: Id) {
      await repo.removeList(id)
      await refresh()
    },
    async moveList(id: Id, delta: number) {
      const ids = lists.map((l) => l.id)
      await repo.reorderLists(moveBy(ids, ids.indexOf(id), delta))
      await refresh()
    },
    async addPlace(listId: Id, placeId: Id) {
      const mine = items.filter((i) => i.listId === listId)
      if (mine.some((i) => i.placeId === placeId)) return
      await repo.saveItem({ id: newId(), listId, placeId, position: nextPosition(mine.map((i) => i.position)), note: '' })
      await refresh()
    },
    async removePlace(listId: Id, placeId: Id) {
      const hit = items.find((i) => i.listId === listId && i.placeId === placeId)
      if (hit) await repo.removeItem(hit.id)
      await refresh()
    },
    async saveNote(itemId: Id, note: string) {
      const item = items.find((i) => i.id === itemId)
      if (!item || item.note === note.trim()) return
      await repo.saveItem({ ...item, note: note.trim() })
      await refresh()
    },
    async moveItem(listId: Id, itemId: Id, delta: number) {
      const ids = items.filter((i) => i.listId === listId).sort((a, b) => a.position - b.position).map((i) => i.id)
      await repo.reorderItems(listId, moveBy(ids, ids.indexOf(itemId), delta))
      await refresh()
    },
  }
}
