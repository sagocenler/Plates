import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { vi } from 'vitest'
import { DataProvider } from '@/data/provider'
import { PlatesDB } from '@/data/local/db'
import { createLocalRepos } from '@/data/local/repos'
import { seedIfEmpty } from '@/data/seed/seed'
import PlacePage from '../place/PlacePage'
import ListDetailPage from '../lists/ListDetailPage'
import SharePage from './SharePage'

let n = 0
async function setup(opts: { path: (r: Awaited<ReturnType<typeof boot>>) => string }) {
  const repos = await boot()
  render(
    <DataProvider repos={repos}>
      <MemoryRouter initialEntries={[opts.path(repos)]}>
        <Routes>
          <Route path="/place/:id" element={<PlacePage />} />
          <Route path="/lists/:id" element={<ListDetailPage />} />
          <Route path="/s/:token" element={<SharePage />} />
        </Routes>
      </MemoryRouter>
    </DataProvider>,
  )
  return repos
}
async function boot() {
  const repos = createLocalRepos(new PlatesDB(`share-test-${n++}`))
  await seedIfEmpty(repos)
  return repos
}

const placeId = async (repos: Awaited<ReturnType<typeof boot>>, name: string) => (await repos.places.list()).find((p) => p.name === name)?.id ?? ''

describe('sharing', () => {
  beforeEach(() => {
    for (const k of ['share', 'canShare']) Object.defineProperty(navigator, k, { value: undefined, configurable: true })
    Object.defineProperty(navigator, 'clipboard', { value: { writeText: vi.fn().mockResolvedValue(undefined) }, configurable: true })
  })

  it('shares a restaurant in two taps, and the public page hides private notes', async () => {
    const user = userEvent.setup()
    // Via Carota's seed visit has the private note "Anniversary dinner"
    const repos = await boot()
    const id = await placeId(repos, 'Via Carota')
    document.body.innerHTML = ''
    render(
      <DataProvider repos={repos}>
        <MemoryRouter initialEntries={[`/place/${id}`]}>
          <Routes><Route path="/place/:id" element={<PlacePage />} /></Routes>
        </MemoryRouter>
      </DataProvider>,
    )
    await user.click(await screen.findByRole('button', { name: 'Share' })) // tap 1
    await user.click(screen.getByRole('button', { name: 'Share link' })) // tap 2
    expect(await screen.findByText('Link copied')).toBeInTheDocument()
    const link = (screen.getByLabelText('Share link') as HTMLInputElement).value
    expect(link).toMatch(/\/s\/[0-9a-f]{32}$/)

    document.body.innerHTML = ''
    render(
      <DataProvider repos={repos}>
        <MemoryRouter initialEntries={[new URL(link).pathname]}>
          <Routes><Route path="/s/:token" element={<SharePage />} /></Routes>
        </MemoryRouter>
      </DataProvider>,
    )
    expect(await screen.findByRole('heading', { level: 1, name: 'Via Carota' })).toBeInTheDocument()
    expect(screen.getByText('Order the')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Open in Google Maps' })).toHaveAttribute('href', expect.stringContaining('google.com/maps'))
    expect(document.body.textContent).not.toContain('Anniversary dinner') // private note
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument() // no app chrome
  })

  it('revoking makes the link show a friendly message', async () => {
    const user = userEvent.setup()
    const repos = await boot()
    const id = await placeId(repos, 'Lilia')
    document.body.innerHTML = ''
    render(
      <DataProvider repos={repos}>
        <MemoryRouter initialEntries={[`/place/${id}`]}>
          <Routes>
            <Route path="/place/:id" element={<PlacePage />} />
            <Route path="/s/:token" element={<SharePage />} />
          </Routes>
        </MemoryRouter>
      </DataProvider>,
    )
    await user.click(await screen.findByRole('button', { name: 'Share' }))
    await user.click(screen.getByRole('button', { name: 'Share link' }))
    await screen.findByText('Link copied')
    const token = (screen.getByLabelText('Share link') as HTMLInputElement).value.split('/s/')[1] ?? ''
    expect((await repos.shares.get(token))?.revokedAt).toBeNull()
    await user.click(screen.getByRole('button', { name: 'Turn off link' }))
    await waitFor(async () => expect((await repos.shares.get(token))?.revokedAt).not.toBeNull())
    expect(await screen.findByRole('button', { name: 'Share' })).toBeInTheDocument() // back to unshared

    document.body.innerHTML = ''
    render(
      <DataProvider repos={repos}>
        <MemoryRouter initialEntries={[`/s/${token}`]}>
          <Routes><Route path="/s/:token" element={<SharePage />} /></Routes>
        </MemoryRouter>
      </DataProvider>,
    )
    expect(await screen.findByRole('heading', { name: /no longer available/ })).toBeInTheDocument()
  })

  it('unknown tokens also show the friendly message', async () => {
    await setup({ path: () => '/s/doesnotexist' })
    expect(await screen.findByRole('heading', { name: /no longer available/ })).toBeInTheDocument()
  })

  it('shares a list with per-list notes in order and honors the tips toggle', async () => {
    const user = userEvent.setup()
    const repos = await boot()
    const list = await repos.lists.saveList({ id: 'l1', userId: 'local-user', name: 'Date night', position: 0 })
    await repos.lists.saveItem({ id: 'i1', listId: 'l1', placeId: await placeId(repos, 'Don Angie'), position: 1, note: 'Flatbread first' })
    await repos.lists.saveItem({ id: 'i2', listId: 'l1', placeId: await placeId(repos, 'Lilia'), position: 0, note: 'Book early' })
    document.body.innerHTML = ''
    render(
      <DataProvider repos={repos}>
        <MemoryRouter initialEntries={[`/lists/${list.id}`]}>
          <Routes><Route path="/lists/:id" element={<ListDetailPage />} /></Routes>
        </MemoryRouter>
      </DataProvider>,
    )
    await user.click(await screen.findByRole('button', { name: 'Share' }))
    await user.click(screen.getByRole('checkbox', { name: /Include tips/ }))
    await user.click(screen.getByRole('button', { name: 'Share link' }))
    await screen.findByText('Link copied')
    const token = (screen.getByLabelText('Share link') as HTMLInputElement).value.split('/s/')[1] ?? ''

    document.body.innerHTML = ''
    render(
      <DataProvider repos={repos}>
        <MemoryRouter initialEntries={[`/s/${token}`]}>
          <Routes><Route path="/s/:token" element={<SharePage />} /></Routes>
        </MemoryRouter>
      </DataProvider>,
    )
    expect(await screen.findByRole('heading', { level: 1, name: 'Date night' })).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual(['Lilia', 'Don Angie'])
    expect(screen.getByText('Book early')).toBeInTheDocument()
    expect(screen.queryByText('Reserve on Resy at 10am')).not.toBeInTheDocument() // Don Angie's tip is hidden
  })
})
