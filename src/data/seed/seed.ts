import type { Repos } from '../interfaces'
import { newId } from '../local/repos'
import { NYC_CATALOG } from './catalog'
import type { Dish, ValueRating, Verdict, Visit } from '@/domain/types'

type D = [name: string, verdict: Verdict, again: boolean]
type Row = {
  at: string
  d: string // yyyy-mm-dd
  v: Verdict
  val?: ValueRating
  order?: string
  skip?: string
  tip?: string
  note?: string
  occ: string[]
  dishes: D[]
}

// Invented visit content for dev; restaurant names are real NYC places.
const SEED: Row[] = [
  { at: 'Via Carota', d: '2026-02-14', v: 'loved', val: 'fair', order: 'Insalata verde, cacio e pepe', skip: 'Dessert', tip: 'No reservations. Go at 5pm', note: 'Anniversary dinner', occ: ['date night', 'special occasion'], dishes: [['Insalata verde', 'loved', true], ['Cacio e pepe', 'loved', true]] },
  { at: 'Lilia', d: '2026-01-20', v: 'loved', val: 'fair', order: 'Sheep\'s milk agnolotti', tip: 'Book at midnight, 30 days out', occ: ['date night', 'groups'], dishes: [['Sheep\'s milk agnolotti', 'loved', true], ['Maccheroni pomodoro', 'liked', false]] },
  { at: 'Carbone', d: '2025-12-12', v: 'liked', val: 'overpriced', order: 'Spicy rigatoni vodka', skip: 'Veal parm', note: 'Client dinner, expensed', occ: ['business lunch', 'special occasion'], dishes: [['Spicy rigatoni vodka', 'loved', true], ['Veal parm', 'fine', false]] },
  { at: 'Joe\'s Pizza', d: '2026-03-02', v: 'loved', val: 'great', order: 'Plain slice', occ: ['casual', 'solo'], dishes: [['Plain slice', 'loved', true]] },
  { at: 'Di Fara Pizza', d: '2025-10-05', v: 'liked', val: 'fair', tip: 'Long wait. Worth it on a weekday', occ: ['casual'], dishes: [['Square slice', 'liked', true]] },
  { at: 'Katz\'s Delicatessen', d: '2025-11-09', v: 'loved', val: 'fair', order: 'Pastrami on rye', skip: 'The fries', tip: 'Keep your ticket!', occ: ['casual', 'family'], dishes: [['Pastrami on rye', 'loved', true]] },
  { at: 'Russ & Daughters Cafe', d: '2026-02-01', v: 'loved', val: 'fair', order: 'The Classic board', occ: ['family', 'casual'], dishes: [['The Classic', 'loved', true], ['Babka french toast', 'liked', true]] },
  { at: 'Le Bernardin', d: '2025-09-20', v: 'loved', val: 'fair', order: 'Tasting menu', occ: ['special occasion'], dishes: [['Tuna "Barely Cooked"', 'loved', true]] },
  { at: 'Balthazar', d: '2025-08-17', v: 'fine', val: 'overpriced', skip: 'Anything touristy', occ: ['groups'], dishes: [['Steak frites', 'fine', false]] },
  { at: 'Frenchette', d: '2026-02-27', v: 'loved', val: 'fair', order: 'Duck frites, oysters', occ: ['date night', 'groups'], dishes: [['Duck frites', 'loved', true], ['Oysters', 'liked', true]] },
  { at: 'Don Angie', d: '2026-03-10', v: 'loved', val: 'fair', order: 'Stuffed garlic flatbread', tip: 'Reserve on Resy at 10am', occ: ['date night'], dishes: [['Stuffed garlic flatbread', 'loved', true], ['Lasagna for two', 'loved', true]] },
  { at: 'Estela', d: '2025-12-30', v: 'liked', val: 'fair', order: 'Endive salad, ricotta dip', occ: ['date night', 'groups'], dishes: [['Endive salad', 'loved', true]] },
  { at: 'Cosme', d: '2025-11-22', v: 'liked', val: 'overpriced', order: 'Duck carnitas', occ: ['groups', 'special occasion'], dishes: [['Duck carnitas', 'loved', true], ['Husk meringue', 'liked', false]] },
  { at: 'Los Tacos No. 1', d: '2026-03-15', v: 'loved', val: 'great', order: 'Adobada taco', occ: ['casual', 'solo'], dishes: [['Adobada taco', 'loved', true], ['Nopal taco', 'liked', false]] },
  { at: 'Superiority Burger', d: '2026-01-08', v: 'liked', val: 'great', order: 'The Superiority Burger', occ: ['casual', 'solo'], dishes: [['Superiority Burger', 'liked', true]] },
  { at: 'Peter Luger Steak House', d: '2025-07-04', v: 'fine', val: 'overpriced', skip: 'Sides', tip: 'Cash or house card only', occ: ['groups'], dishes: [['Porterhouse for two', 'fine', false]] },
  { at: 'Sushi Nakazawa', d: '2025-10-30', v: 'loved', val: 'fair', order: 'Omakase at the counter', occ: ['special occasion', 'date night'], dishes: [['Omakase', 'loved', true]] },
  { at: 'Ippudo NY', d: '2026-02-08', v: 'liked', val: 'fair', order: 'Akamaru modern', occ: ['casual', 'solo'], dishes: [['Akamaru modern', 'liked', true]] },
  { at: 'Momofuku Noodle Bar', d: '2025-09-03', v: 'fine', val: 'fair', occ: ['casual'], dishes: [['Pork buns', 'liked', true]] },
  { at: 'Atoboy', d: '2026-01-31', v: 'loved', val: 'great', order: 'Prix fixe, pick the banchan', occ: ['date night', 'business lunch'], dishes: [['Fried chicken', 'loved', true]] },
  { at: 'Xi\'an Famous Foods', d: '2026-03-05', v: 'loved', val: 'great', order: 'Spicy cumin lamb noodles', occ: ['casual', 'solo', 'business lunch'], dishes: [['Spicy cumin lamb noodles', 'loved', true]] },
  { at: 'Nom Wah Tea Parlor', d: '2025-12-06', v: 'liked', val: 'fair', order: 'Original roast pork bun', occ: ['family', 'groups'], dishes: [['Roast pork bun', 'liked', true]] },
  { at: 'Barney Greengrass', d: '2026-02-22', v: 'loved', val: 'fair', order: 'Sturgeon and scrambled eggs', tip: 'Closed Mondays', occ: ['family'], dishes: [['Sturgeon + eggs', 'loved', true]] },
  { at: 'Absolute Bagels', d: '2026-03-18', v: 'loved', val: 'great', order: 'Pumpernickel with scallion cream cheese', tip: 'Cash only, go before 9', occ: ['casual', 'solo'], dishes: [['Pumpernickel bagel', 'loved', true]] },
  { at: 'Gramercy Tavern', d: '2025-11-28', v: 'loved', val: 'fair', occ: ['special occasion', 'business lunch'], dishes: [['Tavern tasting menu', 'loved', true]] },
  { at: 'Rubirosa', d: '2026-01-16', v: 'liked', val: 'fair', order: 'Tie-dye pizza', occ: ['groups', 'family'], dishes: [['Tie-dye pizza', 'loved', true]] },
  { at: 'Dhamaka', d: '2026-03-12', v: 'loved', val: 'fair', order: 'Doh khleiw, goat kaleji', tip: 'Order spice level honestly', occ: ['groups', 'date night'], dishes: [['Doh khleiw', 'loved', true], ['Goat kaleji', 'loved', true]] },
  { at: 'Roberta\'s', d: '2025-08-30', v: 'liked', val: 'fair', order: 'Beefsteak tomato pie', occ: ['groups'], dishes: [['Bee Sting pizza', 'loved', true]] },
  { at: 'Eleven Madison Park', d: '2025-06-14', v: 'fine', val: 'overpriced', note: 'Too long, too precious', occ: ['special occasion'], dishes: [['Tasting menu', 'fine', false]] },
  { at: 'Taim', d: '2026-02-19', v: 'liked', val: 'great', order: 'Green falafel sandwich', occ: ['casual', 'solo'], dishes: [['Green falafel', 'liked', true]] },
  { at: 'Prune', d: '2026-01-25', v: 'loved', val: 'fair', order: 'Brunch bloody mary + Dutch baby', occ: ['casual', 'date night'], dishes: [['Dutch baby', 'loved', true]] },
]

export const SEED_USER_ID = 'local-user'

/** Fill an empty store with ~30 realistic NYC visits. No-op if the user already has data. */
export async function seedIfEmpty(repos: Repos, force = false): Promise<number> {
  if (!force && (await repos.visits.list()).length > 0) return 0
  let count = 0
  for (const row of SEED) {
    const found = NYC_CATALOG.find((p) => p.name === row.at)
    if (!found) throw new Error(`Seed references unknown place: ${row.at}`)
    const { distanceMeters: _ignored, ...snapshot } = found
    const place = await repos.places.upsert(snapshot)
    const dishes: Dish[] = row.dishes.map(([name, verdict, orderAgain]) => ({ id: newId(), name, verdict, orderAgain, photoId: null }))
    const now = new Date().toISOString()
    const visit: Visit = {
      id: newId(),
      userId: SEED_USER_ID,
      placeId: place.id,
      visitedOn: row.d,
      verdict: row.v,
      value: row.val ?? null,
      orderThe: row.order ?? '',
      skipThe: row.skip ?? '',
      tip: row.tip ?? '',
      privateNote: row.note ?? '',
      occasions: row.occ,
      dishes,
      photoIds: [],
      visibility: 'private',
      createdAt: now,
      updatedAt: now,
    }
    await repos.visits.save(visit)
    count++
  }
  return count
}
