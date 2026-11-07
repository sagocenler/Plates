import { dishSuggestions } from './dishes'
import { visit } from './fixtures'

const d = (name: string) => ({ id: name, name, verdict: null, orderAgain: false, photoId: null })
const visits = [
  visit({ id: 'a', dishes: [d('Cacio e pepe'), d('Svizzera')] }),
  visit({ id: 'b', dishes: [d('cacio e pepe')] }),
  visit({ id: 'c', placeId: 'other', dishes: [d('Pizza')] }),
]

describe('dishSuggestions', () => {
  it('ranks by frequency, de-duplicates case-insensitively, scopes to the place', () => {
    expect(dishSuggestions(visits, 'p1')).toEqual(['Cacio e pepe', 'Svizzera'])
  })
  it('filters by what is typed and hides an exact match', () => {
    expect(dishSuggestions(visits, 'p1', 'cac')).toEqual(['Cacio e pepe'])
    expect(dishSuggestions(visits, 'p1', 'cacio e pepe')).toEqual([])
  })
  it('returns nothing for an unknown place', () => {
    expect(dishSuggestions(visits, 'zzz')).toEqual([])
  })
})

import { bestDishes } from './dishes'

describe('bestDishes', () => {
  const dd = (name: string, verdict: 'loved' | 'fine' | null, orderAgain: boolean) => ({ id: name + verdict, name, verdict, orderAgain, photoId: null })
  it('keeps loved / order-again dishes, merges repeats, ranks order-again first', () => {
    const vs = [
      visit({ id: 'a', dishes: [dd('Pasta', 'loved', false), dd('Soup', 'fine', false), dd('Steak', 'loved', true)] }),
      visit({ id: 'b', dishes: [dd('pasta', 'loved', false)] }),
    ]
    const r = bestDishes(vs)
    expect(r.map((d) => d.name)).toEqual(['Steak', 'Pasta'])
    expect(r[1]?.times).toBe(2)
  })
})
