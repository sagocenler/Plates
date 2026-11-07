import type { Place, Verdict, Visit } from './types'

export interface LibraryEntry {
  place: Place
  visits: Visit[] // newest first
}

export interface Filters {
  query: string
  cuisine: string | null
  neighborhood: string | null
  priceLevel: number | null
  verdict: Verdict | null
  occasion: string | null
  orderAgain: boolean
}

export const EMPTY_FILTERS: Filters = {
  query: '',
  cuisine: null,
  neighborhood: null,
  priceLevel: null,
  verdict: null,
  occasion: null,
  orderAgain: false,
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')

/** Group visits by place, newest visit first. */
export function buildLibrary(places: Place[], visits: Visit[]): LibraryEntry[] {
  const byPlace = new Map<string, Visit[]>()
  for (const v of visits) {
    const list = byPlace.get(v.placeId) ?? []
    list.push(v)
    byPlace.set(v.placeId, list)
  }
  const entries: LibraryEntry[] = []
  for (const place of places) {
    const vs = byPlace.get(place.id)
    if (!vs?.length) continue
    vs.sort((a, b) => b.visitedOn.localeCompare(a.visitedOn))
    entries.push({ place, visits: vs })
  }
  return entries.sort((a, b) =>
    (b.visits[0]?.visitedOn ?? '').localeCompare(a.visits[0]?.visitedOn ?? ''),
  )
}

function searchText(entry: LibraryEntry): string {
  const parts: string[] = [entry.place.name, entry.place.cuisine, entry.place.neighborhood]
  for (const v of entry.visits) {
    parts.push(v.orderThe, v.skipThe, v.tip, v.privateNote, ...v.occasions)
    for (const d of v.dishes) parts.push(d.name)
  }
  return norm(parts.join(' \n '))
}

/** Does a single visit satisfy the visit-level filters? */
function visitMatches(v: Visit, f: Filters): boolean {
  if (f.verdict && v.verdict !== f.verdict) return false
  if (f.occasion && !v.occasions.includes(f.occasion)) return false
  if (f.orderAgain && !v.dishes.some((d) => d.orderAgain)) return false
  return true
}

export function filterLibrary(entries: LibraryEntry[], f: Filters): LibraryEntry[] {
  const terms = norm(f.query).split(/\s+/).filter(Boolean)
  const result: LibraryEntry[] = []
  for (const e of entries) {
    if (f.cuisine && e.place.cuisine !== f.cuisine) continue
    if (f.neighborhood && e.place.neighborhood !== f.neighborhood) continue
    if (f.priceLevel && e.place.priceLevel !== f.priceLevel) continue
    const visits = e.visits.filter((v) => visitMatches(v, f))
    if (!visits.length) continue
    if (terms.length) {
      const text = searchText(e)
      if (!terms.every((t) => text.includes(t))) continue
    }
    result.push({ place: e.place, visits })
  }
  return result
}

export function activeFilterCount(f: Filters): number {
  return [f.cuisine, f.neighborhood, f.priceLevel, f.verdict, f.occasion].filter(Boolean).length + (f.orderAgain ? 1 : 0)
}
