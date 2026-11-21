import { uuid } from './uuid'

const V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/

describe('uuid', () => {
  it('makes valid v4 ids', () => {
    expect(uuid()).toMatch(V4)
    expect(uuid()).not.toBe(uuid())
  })
  it('still works when crypto.randomUUID is unavailable (plain-http LAN testing)', () => {
    const original = crypto.randomUUID
    Object.defineProperty(crypto, 'randomUUID', { value: undefined, configurable: true })
    const ids = new Set(Array.from({ length: 200 }, () => uuid()))
    expect(ids.size).toBe(200)
    for (const id of ids) expect(id).toMatch(V4)
    Object.defineProperty(crypto, 'randomUUID', { value: original, configurable: true })
  })
})
