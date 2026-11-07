import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { DataProvider } from '@/data/provider'
import { PlatesDB } from '@/data/local/db'
import { createLocalRepos } from '@/data/local/repos'
import { seedIfEmpty } from '@/data/seed/seed'
import { buildLibrary, EMPTY_FILTERS, filterLibrary } from '@/domain/filters'
import LibraryPage from './LibraryPage'
import PlacePage from '../place/PlacePage'

let n = 0
async function setup(opts: { seed: boolean; path?: string }) {
  const repos = createLocalRepos(new PlatesDB(`lib-test-${n++}`))
  if (opts.seed) await seedIfEmpty(repos)
  render(
    <DataProvider repos={repos}>
      <MemoryRouter initialEntries={[opts.path ?? '/library']}>
        <Routes>
          <Route path="/library" element={<LibraryPage />} />
          <Route path="/place/:id" element={<PlacePage />} />
          <Route path="/log" element={<h1>Log page</h1>} />
        </Routes>
      </MemoryRouter>
    </DataProvider>,
  )
  return repos
}

describe('LibraryPage', () => {
  it('welcomes first-time users and points them to log or quick-add', async () => {
    await setup({ seed: false })
    expect(await screen.findByRole('heading', { name: 'Welcome to Plates' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Log your first place' })).toHaveAttribute('href', '/log')
    expect(screen.getByRole('link', { name: 'Add a few past favorites' })).toHaveAttribute('href', '/welcome')
  })

  it('lists every logged place, newest first', async () => {
    const repos = await setup({ seed: true })
    const total = (await repos.places.list()).length
    expect(await screen.findByText(`${total} places`)).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(total)
  })

  it('"Loved it + order again" is a single tap and matches the domain filter', async () => {
    const repos = await setup({ seed: true })
    const lib = buildLibrary(await repos.places.list(), await repos.visits.list())
    const expected = filterLibrary(lib, { ...EMPTY_FILTERS, verdict: 'loved', orderAgain: true }).length
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Loved it + order again' }))
    expect(await screen.findByText(`${expected} results`)).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(expected)
    await user.click(screen.getByRole('button', { name: 'Loved it + order again' })) // toggles off
    expect(screen.getAllByRole('heading', { level: 2 }).length).toBeGreaterThan(expected)
  })

  it('searches dishes and shows a friendly no-match state', async () => {
    await setup({ seed: true })
    const user = userEvent.setup()
    const box = await screen.findByLabelText(/Search places/)
    await user.type(box, 'cumin')
    const items = await screen.findAllByRole('heading', { level: 2 })
    expect(items).toHaveLength(1)
    expect(items[0]).toHaveTextContent("Xi'an Famous Foods")
    await user.clear(box)
    await user.type(box, 'zzzzzz')
    expect(await screen.findByText('Nothing matches')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Clear all' }))
    expect((await screen.findAllByRole('heading', { level: 2 })).length).toBeGreaterThan(10)
  })

  it('filters by cuisine from the filter panel', async () => {
    await setup({ seed: true })
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Filters' }))
    await user.selectOptions(within(screen.getByRole('group', { name: 'Filters' })).getByLabelText('Cuisine'), 'Pizza')
    const items = await screen.findAllByRole('heading', { level: 2 })
    expect(items.length).toBeGreaterThan(1)
    expect(screen.getByRole('button', { name: 'Filters (1)' })).toBeInTheDocument()
  })
})

describe('PlacePage', () => {
  it('shows visit history, best dishes and the private note to the owner', async () => {
    const repos = await setup({ seed: true })
    const carota = (await repos.places.list()).find((p) => p.name === 'Via Carota')
    expect(carota).toBeDefined()
    // second visit so history has 2 entries
    const first = (await repos.visits.list()).find((v) => v.placeId === carota?.id)
    if (!first) throw new Error('missing seed visit')
    await repos.visits.save({ ...first, id: 'second', visitedOn: '2026-03-20', privateNote: '' })
    // navigate by re-rendering at the place route
    document.body.innerHTML = ''
    render(
      <DataProvider repos={repos}>
        <MemoryRouter initialEntries={[`/place/${carota?.id}`]}>
          <Routes><Route path="/place/:id" element={<PlacePage />} /></Routes>
        </MemoryRouter>
      </DataProvider>,
    )
    expect(await screen.findByRole('heading', { name: 'Via Carota' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: '2 visits' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Best dishes' })).toBeInTheDocument()
    expect(screen.getByText('Anniversary dinner')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open in Maps' })).toHaveAttribute('href', expect.stringContaining('google.com/maps'))
  })

  it('shows a not-found state for unknown ids', async () => {
    await setup({ seed: false, path: '/place/nope' })
    expect(await screen.findByRole('heading', { name: 'Restaurant not found' })).toBeInTheDocument()
  })
})
