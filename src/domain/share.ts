import type { Id, List, ListItem, Place, Share, ValueRating, Verdict, Visit } from './types'

/** Everything a recipient may see. Deliberately has no field for private notes. */
export interface SharedPlace {
  name: string
  address: string
  neighborhood: string
  cuisine: string
  mapsUrl: string
  verdict: Verdict
  value: ValueRating | null
  orderThe: string[]
  bestFor: string[]
  skipThe: string | null
  tip: string | null
  photoIds: Id[]
  note?: string
}

export interface SharedPayload {
  kind: 'place' | 'list'
  title: string
  places: SharedPlace[]
}

export const mapsUrlFor = (name: string, address: string, googlePlaceId: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${address}`)}&query_place_id=${encodeURIComponent(googlePlaceId)}`

export const mapsUrl = (p: Place) => mapsUrlFor(p.name, p.address, p.googlePlaceId)

const RANK: Record<Verdict, number> = { loved: 0, liked: 1, fine: 2, skip: 3 }

/** The visit that represents the place: best verdict, then most recent. */
export function representativeVisit(visits: Visit[]): Visit | undefined {
  return [...visits].sort(
    (a, b) => RANK[a.verdict] - RANK[b.verdict] || b.visitedOn.localeCompare(a.visitedOn),
  )[0]
}

export function buildSharedPlace(
  place: Place,
  visits: Visit[],
  opts: { showPhotos: boolean; showTips: boolean; note?: string },
): SharedPlace | null {
  const rep = representativeVisit(visits)
  if (!rep) return null
  const orderThe = new Set<string>()
  if (rep.orderThe.trim()) orderThe.add(rep.orderThe.trim())
  // Add order-again dishes unless the free-text "order the" already mentions them.
  const said = rep.orderThe.toLowerCase()
  for (const v of visits) for (const d of v.dishes) if (d.orderAgain && !said.includes(d.name.toLowerCase())) orderThe.add(d.name)
  const bestFor = [...new Set(visits.flatMap((v) => v.occasions))]
  return {
    name: place.name,
    address: place.address,
    neighborhood: place.neighborhood,
    cuisine: place.cuisine,
    mapsUrl: mapsUrl(place),
    verdict: rep.verdict,
    value: rep.value,
    orderThe: [...orderThe],
    bestFor,
    skipThe: opts.showTips && rep.skipThe.trim() ? rep.skipThe.trim() : null,
    tip: opts.showTips && rep.tip.trim() ? rep.tip.trim() : null,
    photoIds: opts.showPhotos ? visits.flatMap((v) => v.photoIds).slice(0, 6) : [],
    ...(opts.note?.trim() ? { note: opts.note.trim() } : {}),
  }
}

interface ShareData {
  places: Place[]
  visits: Visit[]
  list?: List
  items?: ListItem[]
}

/** Returns null when the share is revoked or its target is gone ("no longer available"). */
export function buildSharedPayload(share: Share, data: ShareData): SharedPayload | null {
  if (share.revokedAt) return null
  const opts = { showPhotos: share.showPhotos, showTips: share.showTips }
  if (share.kind === 'place') {
    const place = data.places.find((p) => p.id === share.targetId)
    if (!place) return null
    const sp = buildSharedPlace(place, data.visits.filter((v) => v.placeId === place.id), opts)
    return sp ? { kind: 'place', title: place.name, places: [sp] } : null
  }
  if (!data.list || data.list.id !== share.targetId) return null
  const places: SharedPlace[] = []
  for (const item of [...(data.items ?? [])].sort((a, b) => a.position - b.position)) {
    const place = data.places.find((p) => p.id === item.placeId)
    if (!place) continue
    const sp = buildSharedPlace(place, data.visits.filter((v) => v.placeId === place.id), { ...opts, note: item.note })
    if (sp) places.push(sp)
  }
  return { kind: 'list', title: data.list.name, places }
}

export function newShareToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(16))
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('')
}
