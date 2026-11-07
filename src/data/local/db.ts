import Dexie, { type EntityTable } from 'dexie'
import type { List, ListItem, Place, Profile, Share, Visit } from '@/domain/types'

export interface PhotoRow { id: string; blob: Blob }
export interface DraftRow { key: string; data: unknown; updatedAt: string }
export interface SessionRow { key: 'user'; profile: Profile }

export class PlatesDB extends Dexie {
  places!: EntityTable<Place, 'id'>
  visits!: EntityTable<Visit, 'id'>
  lists!: EntityTable<List, 'id'>
  listItems!: EntityTable<ListItem, 'id'>
  shares!: EntityTable<Share, 'token'>
  photos!: EntityTable<PhotoRow, 'id'>
  drafts!: EntityTable<DraftRow, 'key'>
  session!: EntityTable<SessionRow, 'key'>

  constructor(name = 'plates') {
    super(name)
    this.version(1).stores({
      places: 'id, &googlePlaceId, cuisine, neighborhood',
      visits: 'id, placeId, visitedOn, verdict',
      lists: 'id, position',
      listItems: 'id, listId, placeId, position',
      shares: 'token, targetId',
      photos: 'id',
      drafts: 'key',
      session: 'key',
    })
  }
}
