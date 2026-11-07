import type { SharedPayload } from '@/domain/share'
import type { Id, List, ListItem, Place, Profile, Share, Visit, WantItem } from '@/domain/types'

/** The UI depends only on these interfaces. Local (Dexie) now, Supabase later. */

export interface AuthRepo {
  /** 'local' = dev stub (any email); 'password' = real email + password accounts. */
  readonly mode: 'local' | 'password'
  getUser(): Promise<Profile | null>
  signIn(email: string, password: string): Promise<Profile>
  /** Resolves null when the backend requires email confirmation before a session exists. */
  signUp(email: string, password: string): Promise<Profile | null>
  signOut(): Promise<void>
}

/** What a share link resolves to: the recipient-safe payload, or null when unknown/revoked. */
export interface SharedRepo {
  getShared(token: string): Promise<SharedPayload | null>
}

export interface PlacesRepo {
  /** Places the user has stored (logged or saved). */
  list(): Promise<Place[]>
  get(id: Id): Promise<Place | undefined>
  /** Persist a snapshot from a search result. Idempotent on googlePlaceId. */
  upsert(place: Omit<Place, 'id' | 'snapshotAt'>): Promise<Place>
}

export interface PlaceSearchResult extends Omit<Place, 'id' | 'snapshotAt'> {
  distanceMeters?: number
}

/** Autocomplete + nearby. Mock now; Google Places (server-proxied) later. */
export interface PlacesProvider {
  autocomplete(query: string, near?: { lat: number; lng: number }): Promise<PlaceSearchResult[]>
  nearby(near: { lat: number; lng: number }, limit?: number): Promise<PlaceSearchResult[]>
}

export interface VisitsRepo {
  list(): Promise<Visit[]>
  get(id: Id): Promise<Visit | undefined>
  save(visit: Visit): Promise<Visit>
  remove(id: Id): Promise<void>
}

export interface ListsRepo {
  lists(): Promise<List[]>
  items(listId?: Id): Promise<ListItem[]>
  saveList(list: List): Promise<List>
  removeList(id: Id): Promise<void>
  reorderLists(orderedIds: Id[]): Promise<void>
  saveItem(item: ListItem): Promise<ListItem>
  removeItem(id: Id): Promise<void>
  reorderItems(listId: Id, orderedIds: Id[]): Promise<void>
}

export interface SharesRepo {
  create(share: Share): Promise<Share>
  update(share: Share): Promise<Share>
  get(token: string): Promise<Share | undefined>
  forTarget(targetId: Id): Promise<Share[]>
  revoke(token: string): Promise<void>
}

export interface PhotosRepo {
  put(blob: Blob): Promise<Id>
  /** Object URL for display; caller should revoke when done. */
  url(id: Id): Promise<string | null>
  remove(id: Id): Promise<void>
}

export interface WantRepo {
  list(): Promise<WantItem[]>
  /** Idempotent per place: adding a place that is already wanted returns the existing item. */
  add(item: WantItem): Promise<WantItem>
  update(item: WantItem): Promise<WantItem>
  remove(id: Id): Promise<void>
}

/** Unsaved work (e.g. a half-filled visit). Stays on-device; never synced. */
export interface DraftsRepo {
  get(key: string): Promise<unknown | undefined>
  put(key: string, data: unknown): Promise<void>
  remove(key: string): Promise<void>
}

export interface Repos {
  drafts: DraftsRepo
  wants: WantRepo
  auth: AuthRepo
  places: PlacesRepo
  placeSearch: PlacesProvider
  visits: VisitsRepo
  lists: ListsRepo
  shares: SharesRepo
  shared: SharedRepo
  photos: PhotosRepo
}
