import { EMPTY_FILTERS, type Filters } from '@/domain/filters'
import { VERDICTS, type Verdict } from '@/domain/types'

/** Filters live in the URL so Back from a restaurant page restores the list. */
export function filtersToParams(f: Filters): URLSearchParams {
  const p = new URLSearchParams()
  if (f.query) p.set('q', f.query)
  if (f.cuisine) p.set('cuisine', f.cuisine)
  if (f.neighborhood) p.set('hood', f.neighborhood)
  if (f.priceLevel) p.set('price', String(f.priceLevel))
  if (f.verdict) p.set('verdict', f.verdict)
  if (f.occasion) p.set('occ', f.occasion)
  if (f.orderAgain) p.set('again', '1')
  return p
}

export function paramsToFilters(p: URLSearchParams): Filters {
  const verdict = p.get('verdict')
  const price = Number(p.get('price'))
  return {
    ...EMPTY_FILTERS,
    query: p.get('q') ?? '',
    cuisine: p.get('cuisine'),
    neighborhood: p.get('hood'),
    priceLevel: price >= 1 && price <= 4 ? price : null,
    verdict: (VERDICTS as readonly string[]).includes(verdict ?? '') ? (verdict as Verdict) : null,
    occasion: p.get('occ'),
    orderAgain: p.get('again') === '1',
  }
}
