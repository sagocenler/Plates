import { buildSharedPayload } from './share'
import { place, visit } from './fixtures'
import type { Share } from './types'

const share: Share = { token: 't', userId: 'u1', kind: 'place', targetId: 'p1', revokedAt: null, showPhotos: true, showTips: true, createdAt: '' }

describe('buildSharedPayload', () => {
  it('never leaks the private note', () => {
    const payload = buildSharedPayload(share, { places: [place()], visits: [visit()] })
    expect(payload).not.toBeNull()
    expect(JSON.stringify(payload)).not.toContain('SECRET')
    expect(payload?.places[0]?.orderThe).toContain('Cacio e pepe')
    expect(payload?.places[0]?.orderThe).toContain('Svizzera')
  })
  it('returns null when revoked', () => {
    expect(buildSharedPayload({ ...share, revokedAt: '2026-05-01' }, { places: [place()], visits: [visit()] })).toBeNull()
  })
  it('respects showTips and showPhotos', () => {
    const p = buildSharedPayload({ ...share, showTips: false, showPhotos: false }, { places: [place()], visits: [visit()] })
    expect(p?.places[0]?.tip).toBeNull()
    expect(p?.places[0]?.skipThe).toBeNull()
    expect(p?.places[0]?.photoIds).toEqual([])
  })
  it('builds a list share with list-specific notes in order', () => {
    const p2 = place({ id: 'p2', name: 'B' })
    const payload = buildSharedPayload(
      { ...share, kind: 'list', targetId: 'l1' },
      {
        places: [place(), p2],
        visits: [visit(), visit({ id: 'v2', placeId: 'p2' })],
        list: { id: 'l1', userId: 'u1', name: 'Date night', position: 0 },
        items: [
          { id: 'i2', listId: 'l1', placeId: 'p2', position: 1, note: 'second' },
          { id: 'i1', listId: 'l1', placeId: 'p1', position: 0, note: 'first' },
        ],
      },
    )
    expect(payload?.title).toBe('Date night')
    expect(payload?.places.map((x) => x.note)).toEqual(['first', 'second'])
  })
})
