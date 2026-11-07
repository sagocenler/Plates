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

export interface BestDish {
  name: string
  times: number
  orderAgain: boolean
  loved: boolean
}

/** Dishes worth ordering: marked "order again" or loved, de-duplicated by name, strongest first. */
export function bestDishes(visits: Visit[]): BestDish[] {
  const map = new Map<string, BestDish>()
  for (const v of visits) {
    for (const d of v.dishes) {
      const key = norm(d.name)
      if (!key) continue
      const cur = map.get(key) ?? { name: d.name, times: 0, orderAgain: false, loved: false }
      cur.times++
      cur.orderAgain ||= d.orderAgain
      cur.loved ||= d.verdict === 'loved'
      map.set(key, cur)
    }
  }
  const score = (d: BestDish) => (d.orderAgain ? 2 : 0) + (d.loved ? 1 : 0)
  return [...map.values()]
    .filter((d) => d.orderAgain || d.loved)
    .sort((a, b) => score(b) - score(a) || b.times - a.times || a.name.localeCompare(b.name))
}
