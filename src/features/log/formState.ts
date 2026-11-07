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
