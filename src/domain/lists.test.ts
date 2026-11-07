import { cleanName, moveBy, nextPosition } from './lists'

describe('list helpers', () => {
  it('moves items and clamps at the ends', () => {
    expect(moveBy(['a', 'b', 'c'], 0, 1)).toEqual(['b', 'a', 'c'])
    expect(moveBy(['a', 'b', 'c'], 2, -1)).toEqual(['a', 'c', 'b'])
    expect(moveBy(['a', 'b', 'c'], 0, -1)).toEqual(['a', 'b', 'c'])
    expect(moveBy(['a', 'b', 'c'], 2, 1)).toEqual(['a', 'b', 'c'])
    expect(moveBy(['a'], 5, 1)).toEqual(['a'])
  })
  it('does not mutate its input', () => {
    const src = ['a', 'b']
    moveBy(src, 0, 1)
    expect(src).toEqual(['a', 'b'])
  })
  it('computes the next position', () => {
    expect(nextPosition([])).toBe(0)
    expect(nextPosition([0, 4, 2])).toBe(5)
  })
  it('normalizes names', () => {
    expect(cleanName('  Best   date  night ')).toBe('Best date night')
  })
})
