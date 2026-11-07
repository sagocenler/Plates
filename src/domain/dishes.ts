import type { Visit } from './types'

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

/** Dish names previously logged at this place, most frequent first, optionally filtered by what's typed. */
export function dishSuggestions(visits: Visit[], placeId: string, query = '', limit = 6): string[] {
  const counts = new Map<string, { name: string; n: number }>()
  for (const v of visits) {
    if (v.placeId !== placeId) continue
    for (const d of v.dishes) {
      const key = norm(d.name)
      if (!key) continue
      const cur = counts.get(key)
      if (cur) cur.n++
      else counts.set(key, { name: d.name, n: 1 })
    }
  }
  const q = norm(query)
  return [...counts.entries()]
    .filter(([key]) => !q || (key.includes(q) && key !== q))
    .sort((a, b) => b[1].n - a[1].n || a[1].name.localeCompare(b[1].name))
    .map(([, v]) => v.name)
    .slice(0, limit)
}
