import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { DataProvider } from '@/data/provider'
import { PlatesDB } from '@/data/local/db'
import { createLocalRepos } from '@/data/local/repos'
import { seedIfEmpty } from '@/data/seed/seed'
import LogPage from './LogPage'

let n = 0
async function setup(seed = false) {
  const repos = createLocalRepos(new PlatesDB(`log-test-${n++}`))
  if (seed) await seedIfEmpty(repos)
  render(
    <DataProvider repos={repos}>
      <MemoryRouter initialEntries={['/log']}>
        <Routes>
          <Route path="/log" element={<LogPage />} />
          <Route path="/library" element={<h1>Library page</h1>} />
        </Routes>
      </MemoryRouter>
    </DataProvider>,
  )
  return repos
}

describe('LogPage', () => {
  it('saves a visit with only a restaurant and a verdict', async () => {
    const repos = await setup()
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Search restaurants'), 'carota')
    await user.click(await screen.findByRole('button', { name: /Via Carota/ }))
    const save = screen.getByRole('button', { name: 'Pick a verdict to save' })
    expect(save).toBeDisabled()
    await user.click(screen.getByRole('button', { name: 'Liked it' }))
    await user.click(screen.getByRole('button', { name: 'Save visit' }))
    await screen.findByRole('heading', { name: 'Library page' })
    const visits = await repos.visits.list()
    expect(visits).toHaveLength(1)
    expect(visits[0]).toMatchObject({ verdict: 'liked', visibility: 'private', dishes: [] })
  })

  it('searches restaurants by typing', async () => {
    await setup()
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Search restaurants'), 'lilia')
    expect(await screen.findByRole('button', { name: /Lilia/ })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Via Carota/ })).not.toBeInTheDocument()
  })

  it('adds dishes and suggests ones logged before at the same restaurant', async () => {
    const repos = await setup(true) // Via Carota is seeded with "Cacio e pepe"
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Search restaurants'), 'carota')
    await user.click(await screen.findByRole('button', { name: /Via Carota/ }))
    const chip = await screen.findByRole('button', { name: '+ Cacio e pepe' })
    await user.click(chip)
    expect(screen.getByDisplayValue('Cacio e pepe')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: '+ Cacio e pepe' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: '+ Add a dish' }))
    await user.click(within(screen.getByRole('group', { name: 'How was it?' })).getByRole('button', { name: 'Loved it' }))
    await user.click(screen.getByRole('button', { name: 'Save visit' }))
    await waitFor(async () => {
      const carota = (await repos.visits.list()).filter((v) => v.dishes.some((d) => d.name === 'Cacio e pepe'))
      expect(carota.length).toBeGreaterThanOrEqual(2)
    })
  })
})
