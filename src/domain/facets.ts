import type { LibraryEntry } from './filters'

export interface Facets {
  cuisines: string[]
  neighborhoods: string[]
  priceLevels: number[]
  occasions: string[]
}

const uniqSorted = <T extends string | number>(xs: T[]) => [...new Set(xs)].sort() as T[]

export function facetsOf(entries: LibraryEntry[]): Facets {
  return {
    cuisines: uniqSorted(entries.map((e) => e.place.cuisine).filter(Boolean)),
    neighborhoods: uniqSorted(entries.map((e) => e.place.neighborhood).filter(Boolean)),
    priceLevels: uniqSorted(entries.map((e) => e.place.priceLevel).filter((p): p is 1 | 2 | 3 | 4 => p !== null)),
    occasions: uniqSorted(entries.flatMap((e) => e.visits.flatMap((v) => v.occasions))),
  }
}
