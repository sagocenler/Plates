import { buildLibrary, EMPTY_FILTERS, filterLibrary } from './filters'
import { place, visit } from './fixtures'

const places = [place(), place({ id: 'p2', name: 'Joe’s Pizza', cuisine: 'Pizza', neighborhood: 'Midtown', priceLevel: 1 })]
const visits = [
  visit(),
  visit({ id: 'v2', placeId: 'p2', verdict: 'liked', visitedOn: '2026-04-01', occasions: ['casual'], dishes: [], orderThe: 'Plain slice' }),
]
const lib = buildLibrary(places, visits)

describe('filterLibrary', () => {
  it('orders by most recent visit', () => {
    expect(lib.map((e) => e.place.id)).toEqual(['p2', 'p1'])
  })
  it('skips places with no visits', () => {
    expect(buildLibrary([...places, place({ id: 'p3' })], visits)).toHaveLength(2)
  })
  it('searches names, dishes, notes and tags, accent-insensitive', () => {
    expect(filterLibrary(lib, { ...EMPTY_FILTERS, query: 'svizzera' })).toHaveLength(1)
    expect(filterLibrary(lib, { ...EMPTY_FILTERS, query: 'joes pizza' })).toHaveLength(0) // apostrophe differs
    expect(filterLibrary(lib, { ...EMPTY_FILTERS, query: 'casual' })[0]?.place.id).toBe('p2')
    expect(filterLibrary(lib, { ...EMPTY_FILTERS, query: 'CACIO' })).toHaveLength(1)
  })
  it('combines Loved it + order again', () => {
    const r = filterLibrary(lib, { ...EMPTY_FILTERS, verdict: 'loved', orderAgain: true })
    expect(r.map((e) => e.place.id)).toEqual(['p1'])
  })
  it('filters by cuisine, neighborhood and price', () => {
    expect(filterLibrary(lib, { ...EMPTY_FILTERS, cuisine: 'Pizza' })).toHaveLength(1)
    expect(filterLibrary(lib, { ...EMPTY_FILTERS, neighborhood: 'West Village' })).toHaveLength(1)
    expect(filterLibrary(lib, { ...EMPTY_FILTERS, priceLevel: 1 })[0]?.place.id).toBe('p2')
  })
  it('handles 600 entries quickly', () => {
    const ps = Array.from({ length: 600 }, (_, i) => place({ id: `x${i}`, name: `Place ${i}` }))
    const vs = ps.map((p, i) => visit({ id: `vx${i}`, placeId: p.id }))
    const big = buildLibrary(ps, vs)
    const t = performance.now()
    filterLibrary(big, { ...EMPTY_FILTERS, query: 'place 59', verdict: 'loved' })
    expect(performance.now() - t).toBeLessThan(200)
  })
})
