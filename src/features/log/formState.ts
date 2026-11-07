import type { PlaceSearchResult } from '@/data/interfaces'
import type { Dish, Id, ValueRating, Verdict, Visit } from '@/domain/types'

export interface DishDraft {
  key: string
  name: string
  verdict: Verdict | null
  orderAgain: boolean
  photoId: Id | null
}

export interface LogForm {
  place: PlaceSearchResult | null
  visitedOn: string
  verdict: Verdict | null
  value: ValueRating | null
  orderThe: string
  skipThe: string
  tip: string
  privateNote: string
  occasions: string[]
  dishes: DishDraft[]
  photoIds: Id[]
}

export function todayISO(now = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const d = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${m}-${d}`
}

export const emptyForm = (now = new Date()): LogForm => ({
  place: null,
  visitedOn: todayISO(now),
  verdict: null,
  value: null,
  orderThe: '',
  skipThe: '',
  tip: '',
  privateNote: '',
  occasions: [],
  dishes: [],
  photoIds: [],
})

export const newDish = (): DishDraft => ({ key: crypto.randomUUID(), name: '', verdict: null, orderAgain: false, photoId: null })

/** Only the restaurant and a verdict are required. */
export const canSave = (f: LogForm): boolean => f.place !== null && f.verdict !== null

export function toggleOccasion(list: string[], name: string): string[] {
  const clean = name.trim().toLowerCase()
  if (!clean) return list
  return list.includes(clean) ? list.filter((o) => o !== clean) : [...list, clean]
}

export function formToVisit(f: LogForm, placeId: Id, userId: Id, now = new Date()): Visit {
  if (!f.verdict) throw new Error('A verdict is required')
  const dishes: Dish[] = f.dishes
    .filter((d) => d.name.trim())
    .map((d) => ({ id: d.key, name: d.name.trim(), verdict: d.verdict, orderAgain: d.orderAgain, photoId: d.photoId }))
  const iso = now.toISOString()
  return {
    id: crypto.randomUUID(),
    userId,
    placeId,
    visitedOn: f.visitedOn,
    verdict: f.verdict,
    value: f.value,
    orderThe: f.orderThe.trim(),
    skipThe: f.skipThe.trim(),
    tip: f.tip.trim(),
    privateNote: f.privateNote.trim(),
    occasions: f.occasions,
    dishes,
    photoIds: f.photoIds,
    visibility: 'private',
    createdAt: iso,
    updatedAt: iso,
  }
}

export const LOG_DRAFT_KEY = 'log-draft'

/** A draft is worth keeping once a restaurant is chosen and anything has been entered. */
export function hasDraftContent(f: LogForm): boolean {
  return (
    f.place !== null &&
    (f.verdict !== null ||
      f.value !== null ||
      f.photoIds.length > 0 ||
      f.dishes.length > 0 ||
      f.occasions.length > 0 ||
      [f.orderThe, f.skipThe, f.tip, f.privateNote].some((t) => t.trim() !== ''))
  )
}

const isStr = (x: unknown): x is string => typeof x === 'string'
const isStrArr = (x: unknown): x is string[] => Array.isArray(x) && x.every(isStr)

/** Validate stored JSON before trusting it as a LogForm (storage can hold stale shapes). */
export function parseDraft(raw: unknown): LogForm | null {
  if (typeof raw !== 'object' || raw === null) return null
  const r = raw as Record<string, unknown>
  const place = r.place as Record<string, unknown> | null
  if (!place || !isStr(place.googlePlaceId) || !isStr(place.name)) return null
  if (!isStr(r.visitedOn) || !isStrArr(r.occasions) || !isStrArr(r.photoIds) || !Array.isArray(r.dishes)) return null
  if (![r.orderThe, r.skipThe, r.tip, r.privateNote].every(isStr)) return null
  const dishes: DishDraft[] = []
  for (const d of r.dishes as Record<string, unknown>[]) {
    if (!d || !isStr(d.key) || !isStr(d.name) || typeof d.orderAgain !== 'boolean') return null
    dishes.push({ key: d.key, name: d.name, verdict: (d.verdict as Verdict | null) ?? null, orderAgain: d.orderAgain, photoId: isStr(d.photoId) ? d.photoId : null })
  }
  return {
    place: place as unknown as PlaceSearchResult,
    visitedOn: r.visitedOn,
    verdict: (r.verdict as Verdict | null) ?? null,
    value: (r.value as ValueRating | null) ?? null,
    orderThe: r.orderThe as string,
    skipThe: r.skipThe as string,
    tip: r.tip as string,
    privateNote: r.privateNote as string,
    occasions: r.occasions,
    dishes,
    photoIds: r.photoIds,
  }
}
