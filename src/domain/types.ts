// Source-of-truth domain types. They mirror the future Supabase tables (see docs/schema.sql).

export type Id = string

export const VERDICTS = ['loved', 'liked', 'fine', 'skip'] as const
export type Verdict = (typeof VERDICTS)[number]

export const VERDICT_LABEL: Record<Verdict, string> = {
  loved: 'Loved it',
  liked: 'Liked it',
  fine: 'It was fine',
  skip: 'Skip it',
}

export const VALUES = ['great', 'fair', 'overpriced'] as const
export type ValueRating = (typeof VALUES)[number]

export const VALUE_LABEL: Record<ValueRating, string> = {
  great: 'Great value',
  fair: 'Fair',
  overpriced: 'Overpriced',
}

export type Visibility = 'private' | 'link' | 'friends'

export const SYSTEM_OCCASIONS = [
  'date night',
  'solo',
  'business lunch',
  'groups',
  'family',
  'casual',
  'special occasion',
] as const

export type PriceLevel = 1 | 2 | 3 | 4

export interface Profile {
  id: Id
  displayName: string
}

/** Snapshot of a place, so entries survive if the restaurant closes. */
export interface Place {
  id: Id
  googlePlaceId: string
  name: string
  address: string
  lat: number
  lng: number
  neighborhood: string
  cuisine: string
  priceLevel: PriceLevel | null
  snapshotAt: string
}

export interface Dish {
  id: Id
  name: string
  verdict: Verdict | null
  orderAgain: boolean
  photoId: Id | null
}

export interface Visit {
  id: Id
  userId: Id
  placeId: Id
  visitedOn: string // ISO date, yyyy-mm-dd
  verdict: Verdict
  value: ValueRating | null
  orderThe: string
  skipThe: string
  tip: string
  /** Never included in any share payload. */
  privateNote: string
  occasions: string[]
  dishes: Dish[]
  photoIds: Id[]
  visibility: Visibility
  createdAt: string
  updatedAt: string
}

export interface List {
  id: Id
  userId: Id
  name: string
  position: number
}

export interface ListItem {
  id: Id
  listId: Id
  placeId: Id
  position: number
  note: string
}

export type ShareKind = 'place' | 'list'

export interface Share {
  token: string
  userId: Id
  kind: ShareKind
  targetId: Id
  revokedAt: string | null
  showPhotos: boolean
  showTips: boolean
  createdAt: string
}

export interface Friendship {
  id: Id
  requesterId: Id
  addresseeId: Id
  status: 'pending' | 'accepted'
}
