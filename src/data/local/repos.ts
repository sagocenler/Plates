import type { Id } from '@/domain/types'
import type { Repos } from '../interfaces'
import { MockPlacesProvider } from '../mockPlaces'
import { PlatesDB } from './db'

export const newId = (): Id => crypto.randomUUID()

export function createLocalRepos(db: PlatesDB = new PlatesDB()): Repos {
  return {
    auth: {
      async getUser() {
        return (await db.session.get('user'))?.profile ?? null
      },
      async signIn(email) {
        const profile = { id: 'local-user', displayName: email.split('@')[0] || 'You' }
        await db.session.put({ key: 'user', profile })
        return profile
      },
      async signOut() {
        await db.session.delete('user')
      },
    },
    places: {
      list: () => db.places.toArray(),
      get: (id) => db.places.get(id),
      async upsert(p) {
        const existing = await db.places.where('googlePlaceId').equals(p.googlePlaceId).first()
        if (existing) return existing
        const place = { ...p, id: newId(), snapshotAt: new Date().toISOString() }
        await db.places.add(place)
        return place
      },
    },
    placeSearch: new MockPlacesProvider(),
    visits: {
      list: () => db.visits.toArray(),
      get: (id) => db.visits.get(id),
      async save(v) {
        const visit = { ...v, updatedAt: new Date().toISOString() }
        await db.visits.put(visit)
        return visit
      },
      remove: (id) => db.visits.delete(id),
    },
    lists: {
      lists: () => db.lists.orderBy('position').toArray(),
      items: (listId) => (listId ? db.listItems.where('listId').equals(listId).sortBy('position') : db.listItems.toArray()),
      async saveList(l) {
        await db.lists.put(l)
        return l
      },
      async removeList(id) {
        await db.transaction('rw', db.lists, db.listItems, async () => {
          await db.listItems.where('listId').equals(id).delete()
          await db.lists.delete(id)
        })
      },
      async reorderLists(ids) {
        await db.transaction('rw', db.lists, async () => {
          for (const [i, id] of ids.entries()) await db.lists.update(id, { position: i })
        })
      },
      async saveItem(item) {
        await db.listItems.put(item)
        return item
      },
      removeItem: (id) => db.listItems.delete(id),
      async reorderItems(_listId, ids) {
        await db.transaction('rw', db.listItems, async () => {
          for (const [i, id] of ids.entries()) await db.listItems.update(id, { position: i })
        })
      },
    },
    shares: {
      async create(s) {
        await db.shares.put(s)
        return s
      },
      get: (token) => db.shares.get(token),
      forTarget: (targetId) => db.shares.where('targetId').equals(targetId).toArray(),
      async revoke(token) {
        await db.shares.update(token, { revokedAt: new Date().toISOString() })
      },
    },
    photos: {
      async put(blob) {
        const id = newId()
        await db.photos.add({ id, blob })
        return id
      },
      async url(id) {
        const row = await db.photos.get(id)
        return row ? URL.createObjectURL(row.blob) : null
      },
      remove: (id) => db.photos.delete(id),
    },
  }
}
