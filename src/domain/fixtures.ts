import type { Place, Visit } from './types'

export const place = (over: Partial<Place> = {}): Place => ({
  id: 'p1',
  googlePlaceId: 'gp1',
  name: 'Via Carota',
  address: '51 Grove St, New York, NY',
  lat: 40.7316,
  lng: -74.0037,
  neighborhood: 'West Village',
  cuisine: 'Italian',
  priceLevel: 3,
  snapshotAt: '2026-01-01T00:00:00Z',
  ...over,
})

export const visit = (over: Partial<Visit> = {}): Visit => ({
  id: 'v1',
  userId: 'u1',
  placeId: 'p1',
  visitedOn: '2026-03-01',
  verdict: 'loved',
  value: 'fair',
  orderThe: 'Cacio e pepe',
  skipThe: 'Tiramisu',
  tip: 'Book two weeks ahead',
  privateNote: 'SECRET: went with my ex',
  occasions: ['date night'],
  dishes: [{ id: 'd1', name: 'Svizzera', verdict: 'loved', orderAgain: true, photoId: null }],
  photoIds: ['ph1'],
  visibility: 'private',
  createdAt: '2026-03-01T00:00:00Z',
  updatedAt: '2026-03-01T00:00:00Z',
  ...over,
})
