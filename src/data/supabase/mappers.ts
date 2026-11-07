import { mapsUrlFor, type SharedPayload, type SharedPlace } from '@/domain/share'
import type { Dish, List, ListItem, Place, PriceLevel, Share, ShareKind, ValueRating, Verdict, Visibility, Visit, WantItem } from '@/domain/types'

// Row shapes mirror supabase/migrations (snake_case). Kept hand-written so the mapping is explicit and testable.

export interface PlaceRow {
  id: string
  google_place_id: string
  name: string
  address: string
  lat: number
  lng: number
  neighborhood: string
  cuisine: string
  price_level: number | null
  snapshot_at: string
}

export interface DishRow {
  id: string
  visit_id: string
  name: string
  verdict: Verdict | null
  order_again: boolean
  photo_id: string | null
  position: number
}

export interface VisitRow {
  id: string
  user_id: string
  place_id: string
  visited_on: string
  verdict: Verdict
  value: ValueRating | null
  order_the: string
  skip_the: string
  tip: string
  private_note: string
  occasions: string[]
  visibility: Visibility
  created_at: string
  updated_at: string
  visit_dishes?: DishRow[]
  visit_photos?: { photo_id: string; position: number }[]
}

export const placeFromRow = (r: PlaceRow): Place => ({
  id: r.id,
  googlePlaceId: r.google_place_id,
  name: r.name,
  address: r.address,
  lat: r.lat,
  lng: r.lng,
  neighborhood: r.neighborhood,
  cuisine: r.cuisine,
  priceLevel: r.price_level === null ? null : (r.price_level as PriceLevel),
  snapshotAt: r.snapshot_at,
})

export const visitFromRow = (r: VisitRow): Visit => ({
  id: r.id,
  userId: r.user_id,
  placeId: r.place_id,
  visitedOn: r.visited_on,
  verdict: r.verdict,
  value: r.value,
  orderThe: r.order_the,
  skipThe: r.skip_the,
  tip: r.tip,
  privateNote: r.private_note,
  occasions: r.occasions,
  visibility: r.visibility,
  dishes: [...(r.visit_dishes ?? [])]
    .sort((a, b) => a.position - b.position)
    .map((d): Dish => ({ id: d.id, name: d.name, verdict: d.verdict, orderAgain: d.order_again, photoId: d.photo_id })),
  photoIds: [...(r.visit_photos ?? [])].sort((a, b) => a.position - b.position).map((p) => p.photo_id),
  createdAt: r.created_at,
  updatedAt: r.updated_at,
})

/** The rows to write for one visit. user_id is omitted on purpose: the database fills it from the session. */
export function visitToRows(v: Visit) {
  return {
    visit: {
      id: v.id,
      place_id: v.placeId,
      visited_on: v.visitedOn,
      verdict: v.verdict,
      value: v.value,
      order_the: v.orderThe,
      skip_the: v.skipThe,
      tip: v.tip,
      private_note: v.privateNote,
      occasions: v.occasions,
      visibility: v.visibility,
    },
    dishes: v.dishes.map((d, i) => ({ id: d.id, visit_id: v.id, name: d.name, verdict: d.verdict, order_again: d.orderAgain, photo_id: d.photoId, position: i })),
    photos: v.photoIds.map((photo_id, i) => ({ visit_id: v.id, photo_id, position: i })),
  }
}

export const listFromRow = (r: { id: string; user_id: string; name: string; position: number }): List => ({
  id: r.id,
  userId: r.user_id,
  name: r.name,
  position: r.position,
})

export const itemFromRow = (r: { id: string; list_id: string; place_id: string; position: number; note: string }): ListItem => ({
  id: r.id,
  listId: r.list_id,
  placeId: r.place_id,
  position: r.position,
  note: r.note,
})

export const wantFromRow = (r: { id: string; user_id: string; place_id: string; note: string; added_at: string }): WantItem => ({
  id: r.id,
  userId: r.user_id,
  placeId: r.place_id,
  note: r.note,
  addedAt: r.added_at,
})

export interface ShareRow {
  token: string
  user_id: string
  kind: ShareKind
  target_id: string
  show_photos: boolean
  show_tips: boolean
  revoked_at: string | null
  created_at: string
}

export const shareFromRow = (r: ShareRow): Share => ({
  token: r.token,
  userId: r.user_id,
  kind: r.kind,
  targetId: r.target_id,
  revokedAt: r.revoked_at,
  showPhotos: r.show_photos,
  showTips: r.show_tips,
  createdAt: r.created_at,
})

export const shareToRow = (s: Share) => ({
  token: s.token,
  kind: s.kind,
  target_id: s.targetId,
  show_photos: s.showPhotos,
  show_tips: s.showTips,
  revoked_at: s.revokedAt,
  created_at: s.createdAt,
})

/** get_shared() JSON -> the same SharedPayload the local implementation produces. Photo ids are storage paths. */
export function sharedFromJson(json: unknown): SharedPayload | null {
  if (typeof json !== 'object' || json === null) return null
  const j = json as { kind?: string; title?: string; places?: Record<string, unknown>[] }
  if ((j.kind !== 'place' && j.kind !== 'list') || typeof j.title !== 'string' || !Array.isArray(j.places)) return null
  const str = (x: unknown) => (typeof x === 'string' ? x : '')
  const strs = (x: unknown) => (Array.isArray(x) ? x.filter((i): i is string => typeof i === 'string') : [])
  const places = j.places.map((p): SharedPlace => {
    const note = str(p.note)
    return {
      name: str(p.name),
      address: str(p.address),
      neighborhood: str(p.neighborhood),
      cuisine: str(p.cuisine),
      mapsUrl: mapsUrlFor(str(p.name), str(p.address), str(p.googlePlaceId)),
      verdict: p.verdict as Verdict,
      value: (p.value as ValueRating | undefined) ?? null,
      orderThe: strs(p.orderThe),
      bestFor: strs(p.bestFor),
      skipThe: str(p.skipThe) || null,
      tip: str(p.tip) || null,
      photoIds: strs(p.photoPaths),
      ...(note ? { note } : {}),
    }
  })
  return { kind: j.kind, title: j.title, places }
}
