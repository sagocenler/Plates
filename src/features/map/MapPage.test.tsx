import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { vi } from 'vitest'
import { DataProvider } from '@/data/provider'
import { PlatesDB } from '@/data/local/db'
import { createLocalRepos } from '@/data/local/repos'
import { seedIfEmpty } from '@/data/seed/seed'
import type { LibraryEntry } from '@/domain/filters'

// WebGL isn't available in jsdom: replace the map with a list of pins that exercises the same props.
vi.mock('./MapView', () => ({
  default: ({ entries, onSelect }: { entries: LibraryEntry[]; onSelect: (id: string) => void }) => (
    <ul aria-label="pins">
      {entries.map((e) => (
        <li key={e.place.id}>
          <button type="button" onClick={() => onSelect(e.place.id)}>{e.place.name}</button>
        </li>
      ))}
    </ul>
  ),
}))

import MapPage from './MapPage'

let n = 0
async function setup(seed: boolean) {
  const repos = createLocalRepos(new PlatesDB(`map-test-${n++}`))
  if (seed) await seedIfEmpty(repos)
  render(
    <DataProvider repos={repos}>
      <MemoryRouter initialEntries={['/map']}>
        <Routes>
          <Route path="/map" element={<MapPage />} />
          <Route path="/place/:id" element={<h1>Place page</h1>} />
        </Routes>
      </MemoryRouter>
    </DataProvider>,
  )
}

describe('MapPage', () => {
  it('shows an empty state with a call to action', async () => {
    await setup(false)
    expect(await screen.findByRole('heading', { name: 'Nothing to map yet' })).toBeInTheDocument()
  })

  it('pins every logged place and the loved-it chip narrows them', async () => {
    await setup(true)
    const user = userEvent.setup()
    const pins = await screen.findByRole('list', { name: 'pins' })
    const all = within(pins).getAllByRole('listitem').length
    expect(await screen.findByText(`${all} places`)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Loved it + order again' }))
    const filtered = within(await screen.findByRole('list', { name: 'pins' })).getAllByRole('listitem').length
    expect(filtered).toBeGreaterThan(0)
    expect(filtered).toBeLessThan(all)
    expect(screen.getByText(`${filtered} places`)).toBeInTheDocument()
  })

  it('selecting a pin shows a card linking to the restaurant page', async () => {
    await setup(true)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: 'Via Carota' }))
    const link = await screen.findByRole('link', { name: /View restaurant/ })
    expect(link).toHaveAttribute('href', expect.stringMatching(/^\/place\//))
  })
})
