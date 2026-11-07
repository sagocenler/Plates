import { canSave, emptyForm, formToVisit, toggleOccasion, todayISO } from './formState'

const place = { googlePlaceId: 'g', name: 'X', address: 'a', lat: 0, lng: 0, neighborhood: 'n', cuisine: 'c', priceLevel: 2 as const }

describe('log form state', () => {
  it('defaults the date to today (local)', () => {
    expect(emptyForm(new Date(2026, 4, 3)).visitedOn).toBe('2026-05-03')
    expect(todayISO(new Date(2026, 11, 31))).toBe('2026-12-31')
  })
  it('needs only a restaurant and a verdict', () => {
    const f = emptyForm()
    expect(canSave(f)).toBe(false)
    expect(canSave({ ...f, place })).toBe(false)
    expect(canSave({ ...f, place, verdict: 'liked' })).toBe(true)
  })
  it('toggles occasions case-insensitively and ignores blanks', () => {
    expect(toggleOccasion([], ' Date Night ')).toEqual(['date night'])
    expect(toggleOccasion(['date night'], 'date night')).toEqual([])
    expect(toggleOccasion(['solo'], '  ')).toEqual(['solo'])
  })
  it('builds a visit, dropping empty dishes and trimming text', () => {
    const f = { ...emptyForm(), place, verdict: 'loved' as const, orderThe: ' Pasta ', dishes: [
      { key: '1', name: ' Cacio ', verdict: 'loved' as const, orderAgain: true, photoId: null },
      { key: '2', name: '  ', verdict: null, orderAgain: false, photoId: null },
    ] }
    const v = formToVisit(f, 'p1', 'u1')
    expect(v.orderThe).toBe('Pasta')
    expect(v.dishes).toHaveLength(1)
    expect(v.dishes[0]).toMatchObject({ name: 'Cacio', orderAgain: true })
    expect(v.visibility).toBe('private')
  })
  it('refuses to build without a verdict', () => {
    expect(() => formToVisit({ ...emptyForm(), place }, 'p1', 'u1')).toThrow()
  })
})
