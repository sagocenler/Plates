import { PlatesDB } from '../local/db'
import { createLocalRepos } from '../local/repos'
import { seedIfEmpty } from './seed'
import { buildLibrary, EMPTY_FILTERS, filterLibrary } from '@/domain/filters'

describe('seed + local repos', () => {
  it('seeds ~30 visits once and supports filtering', async () => {
    const repos = createLocalRepos(new PlatesDB('test-seed'))
    const n = await seedIfEmpty(repos)
    expect(n).toBeGreaterThanOrEqual(30)
    expect(await seedIfEmpty(repos)).toBe(0)
    const lib = buildLibrary(await repos.places.list(), await repos.visits.list())
    expect(lib.length).toBe(n)
    expect(filterLibrary(lib, { ...EMPTY_FILTERS, verdict: 'loved', orderAgain: true }).length).toBeGreaterThan(5)
  })

  it('autocomplete finds places and sorts nearby by distance', async () => {
    const repos = createLocalRepos(new PlatesDB('test-search'))
    expect((await repos.placeSearch.autocomplete('carota'))[0]?.name).toBe('Via Carota')
    const near = await repos.placeSearch.nearby({ lat: 40.7305, lng: -74.0021 }, 3)
    expect(near[0]?.name).toMatch(/Joe|Carota/)
  })
})
