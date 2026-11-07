/** Return a copy with the item at `index` moved by `delta` (clamped). */
export function moveBy<T>(items: readonly T[], index: number, delta: number): T[] {
  const to = Math.max(0, Math.min(items.length - 1, index + delta))
  const copy = [...items]
  if (index < 0 || index >= items.length || to === index) return copy
  const [item] = copy.splice(index, 1)
  copy.splice(to, 0, item as T)
  return copy
}

export const nextPosition = (positions: readonly number[]): number => (positions.length ? Math.max(...positions) + 1 : 0)

export const cleanName = (s: string): string => s.trim().replace(/\s+/g, ' ')
