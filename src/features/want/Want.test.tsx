import Dexie from 'dexie'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { DataProvider } from '@/data/provider'
import { PlatesDB } from '@/data/local/db'
import { createLocalRepos } from '@/data/local/repos'
import { seedIfEmpty } from '@/data/seed/seed'
import LibraryPage from '../library/LibraryPage'
import ListsPage from '../lists/ListsPage'
import LogPage from '../log/LogPage'
import WantPage from './WantPage'

let n = 0
const fresh = () => createLocalRepos(new PlatesDB(`want-${n++}`))

function mount(repos: ReturnType<typeof createLocalRepos>, path = '/want') {
  render(
    <DataProvider repos={repos}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/want" element={<WantPage />} />
          <Route path="/lists" element={<ListsPage />} />
          <Route path="/log" element={<LogPage />} />
          <Route path="/library" element={<LibraryPage />} />
        </Routes>
      </MemoryRouter>
    </DataProvider>,
  )
}

describe('Want to try', () => {
  it('adds a place, keeps a note, and removes it', async () => {
    const repos = fresh()
    const user = userEvent.setup()
    mount(repos)
    expect(await screen.findByText(/Nothing here yet/)).toBeInTheDocument()
    await user.type(screen.getByLabelText('Search restaurants to add'), 'dhamaka')
    await user.click(await screen.findByRole('button', { name: /Want to try\s*Dhamaka/ }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Dhamaka' })).toBeInTheDocument()
    expect(await repos.wants.list()).toHaveLength(1)
    // already wanted: no longer offered as a suggestion
    expect(screen.queryByRole('button', { name: /Want to try\s*Dhamaka/ })).not.toBeInTheDocument()

    const note = screen.getByLabelText('Why you want to go')
    await user.type(note, "Alex says get the goat")
    await user.tab()
    await waitFor(async () => expect((await repos.wants.list())[0]?.note).toBe('Alex says get the goat'))

    await user.click(screen.getByRole('button', { name: /Remove\s*Dhamaka/ }))
    await waitFor(async () => expect(await repos.wants.list()).toHaveLength(0))
    // not in the library: a want is not a visit
    expect(await repos.visits.list()).toHaveLength(0)
  })

  it('adding the same place twice never duplicates', async () => {
    const repos = fresh()
    const place = await repos.places.upsert({ googlePlaceId: 'g1', name: 'X', address: 'a', lat: 0, lng: 0, neighborhood: 'n', cuisine: 'c', priceLevel: 1 })
    const base = { userId: 'u', placeId: place.id, note: '', addedAt: new Date().toISOString() }
    const a = await repos.wants.add({ ...base, id: 'w1' })
    const b = await repos.wants.add({ ...base, id: 'w2' })
    expect(b.id).toBe(a.id)
    expect(await repos.wants.list()).toHaveLength(1)
  })

  it('"I went" opens the log with the place chosen, and saving graduates it from want-to-try into the library', async () => {
    const repos = fresh()
    const user = userEvent.setup()
    mount(repos)
    await user.type(await screen.findByLabelText('Search restaurants to add'), 'taim')
    await user.click(await screen.findByRole('button', { name: /Want to try\s*Taim/ }))
    await user.click(await screen.findByRole('button', { name: /I went/ }))

    expect(await screen.findByRole('heading', { level: 1, name: 'Taim' })).toBeInTheDocument()
    await user.click(within(screen.getByRole('group', { name: 'How was it?' })).getByRole('button', { name: 'Loved it' }))
    await user.click(screen.getByRole('button', { name: 'Save visit' }))

    expect(await screen.findByRole('heading', { level: 2, name: 'Taim' })).toBeInTheDocument() // now in the library
    expect(await repos.wants.list()).toHaveLength(0)
    expect(await repos.visits.list()).toHaveLength(1)
  })

  it('is reachable from the Lists page with a live count', async () => {
    const repos = fresh()
    await seedIfEmpty(repos)
    const lilia = (await repos.places.list())[0]
    if (!lilia) throw new Error('seed missing')
    await repos.wants.add({ id: 'w', userId: 'u', placeId: lilia.id, note: '', addedAt: new Date().toISOString() })
    mount(repos, '/lists')
    const link = await screen.findByRole('link', { name: /Want to try/ })
    expect(link).toHaveAttribute('href', '/want')
    await waitFor(() => expect(link).toHaveTextContent('1 place on your radar'))
  })
})

describe('database upgrade', () => {
  it('keeps existing data when the want-to-try table is added (v1 -> v2)', async () => {
    const name = `upgrade-${n++}`
    const v1 = new Dexie(name)
    v1.version(1).stores({ places: 'id, &googlePlaceId, cuisine, neighborhood', visits: 'id, placeId, visitedOn, verdict', lists: 'id, position', listItems: 'id, listId, placeId, position', shares: 'token, targetId', photos: 'id', drafts: 'key', session: 'key' })
    await v1.table('places').add({ id: 'p1', googlePlaceId: 'g', name: 'Old place' })
    v1.close()

    const db = new PlatesDB(name)
    expect((await db.places.get('p1'))?.name).toBe('Old place')
    expect(await db.wants.count()).toBe(0)
  })
})
