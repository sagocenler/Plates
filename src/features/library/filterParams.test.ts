import { EMPTY_FILTERS } from '@/domain/filters'
import { filtersToParams, paramsToFilters } from './filterParams'

describe('filter params', () => {
  it('round-trips', () => {
    const f = { ...EMPTY_FILTERS, query: 'pasta', cuisine: 'Italian', priceLevel: 3, verdict: 'loved' as const, orderAgain: true }
    expect(paramsToFilters(filtersToParams(f))).toEqual(f)
  })
  it('ignores junk values', () => {
    const f = paramsToFilters(new URLSearchParams('verdict=bogus&price=9'))
    expect(f.verdict).toBeNull()
    expect(f.priceLevel).toBeNull()
  })
  it('empty filters make empty params', () => {
    expect(filtersToParams(EMPTY_FILTERS).toString()).toBe('')
  })
})
