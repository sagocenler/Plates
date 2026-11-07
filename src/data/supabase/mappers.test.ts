import { buildSharedPayload } from '@/domain/share'
import { place, visit } from '@/domain/fixtures'
import { placeFromRow, sharedFromJson, visitFromRow, visitToRows, type VisitRow } from './mappers'

describe('supabase mappers', () => {
  it('round-trips a visit through its row shape (dish and photo order kept)', () => {
    const v = visit({
      dishes: [
        { id: 'd2', name: 'Second', verdict: null, orderAgain: false, photoId: null },
        { id: 'd1', name: 'First', verdict: 'loved', orderAgain: true, photoId: 'ph1' },
      ],
      photoIds: ['a', 'b', 'c'],
    })
    const rows = visitToRows(v)
    expect(rows.dishes.map((d) => [d.id, d.position])).toEqual([['d2', 0], ['d1', 1]])
    expect(rows.visit).not.toHaveProperty('user_id') // the database assigns it from the session

    // Shuffle child rows the way a database might return them.
    const row: VisitRow = {
      ...rows.visit,
      user_id: v.userId,
      created_at: v.createdAt,
      updated_at: v.updatedAt,
      visit_dishes: [...rows.dishes].reverse(),
      visit_photos: [...rows.photos].reverse().map(({ photo_id, position }) => ({ photo_id, position })),
    }
    expect(visitFromRow(row)).toEqual(v)
  })

  it('maps places including a missing price level', () => {
    const p = place({ priceLevel: null })
    expect(
      placeFromRow({ id: p.id, google_place_id: p.googlePlaceId, name: p.name, address: p.address, lat: p.lat, lng: p.lng, neighborhood: p.neighborhood, cuisine: p.cuisine, price_level: null, snapshot_at: p.snapshotAt }),
    ).toEqual(p)
  })

  it('turns get_shared JSON into the same payload shape the local builder makes', () => {
    const local = buildSharedPayload(
      { token: 't', userId: 'u1', kind: 'place', targetId: 'p1', revokedAt: null, showPhotos: false, showTips: true, createdAt: '' },
      { places: [place()], visits: [visit()] },
    )
    const remote = sharedFromJson({
      kind: 'place',
      title: 'Via Carota',
      places: [
        {
          name: 'Via Carota',
          address: '51 Grove St, New York, NY',
          neighborhood: 'West Village',
          cuisine: 'Italian',
          googlePlaceId: 'gp1',
          verdict: 'loved',
          value: 'fair',
          orderThe: ['Cacio e pepe', 'Svizzera'],
          bestFor: ['date night'],
          skipThe: 'Tiramisu',
          tip: 'Book two weeks ahead',
          photoPaths: [],
        },
      ],
    })
    expect(remote).toEqual(local)
  })

  it('maps photo storage paths onto photoIds and tolerates missing optional fields', () => {
    const r = sharedFromJson({ kind: 'list', title: 'L', places: [{ name: 'X', verdict: 'liked', photoPaths: ['u/a.jpg'], note: 'hi' }] })
    expect(r?.places[0]).toMatchObject({ photoIds: ['u/a.jpg'], note: 'hi', tip: null, skipThe: null, value: null, orderThe: [], bestFor: [] })
  })

  it('rejects malformed payloads', () => {
    expect(sharedFromJson(null)).toBeNull()
    expect(sharedFromJson({ kind: 'other' })).toBeNull()
    expect(sharedFromJson({ kind: 'place', title: 'x' })).toBeNull()
  })
})
