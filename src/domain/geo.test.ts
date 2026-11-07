import { boundsOf } from './geo'
import { place, visit } from './fixtures'

describe('boundsOf', () => {
  it('returns null for no entries', () => expect(boundsOf([])).toBeNull())
  it('wraps all places', () => {
    const e = (id: string, lat: number, lng: number) => ({ place: place({ id, lat, lng }), visits: [visit()] })
    expect(boundsOf([e('a', 40.7, -74.0), e('b', 40.8, -73.9), e('c', 40.6, -73.95)])).toEqual([-74.0, 40.6, -73.9, 40.8])
  })
})
