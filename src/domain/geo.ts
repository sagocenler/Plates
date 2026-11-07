import type { LibraryEntry } from './filters'

export type Bounds = [west: number, south: number, east: number, north: number]

/** Bounding box [w, s, e, n] around the given entries, or null when there are none. */
export function boundsOf(entries: LibraryEntry[]): Bounds | null {
  if (entries.length === 0) return null
  let w = Infinity, s = Infinity, e = -Infinity, n = -Infinity
  for (const { place } of entries) {
    w = Math.min(w, place.lng); e = Math.max(e, place.lng)
    s = Math.min(s, place.lat); n = Math.max(n, place.lat)
  }
  return [w, s, e, n]
}
