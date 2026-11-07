import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { DataProvider } from '@/data/provider'
import { PlatesDB } from '@/data/local/db'
import { createLocalRepos } from '@/data/local/repos'
import { seedIfEmpty } from '@/data/seed/seed'
import PlacePage from '../place/PlacePage'
import ListDetailPage from './ListDetailPage'
import ListsPage from './ListsPage'

let n = 0
async function setup(path = '/lists') {
  const repos = createLocalRepos(new PlatesDB(`lists-test-${n++}`))
  await seedIfEmpty(repos)
  render(
    <DataProvider repos={repos}>
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route path="/lists" element={<ListsPage />} />
          <Route path="/lists/:id" element={<ListDetailPage />} />
          <Route path="/place/:id" element={<PlacePage />} />
        </Routes>
      </MemoryRouter>
    </DataProvider>,
  )
  return repos
}

async function createList(user: ReturnType<typeof userEvent.setup>, name: string) {
  await user.type(await screen.findByLabelText('New list name'), name)
  await user.click(screen.getByRole('button', { name: 'Create' }))
}

describe('Lists', () => {
  it('shows an empty state, creates lists, and reorders them', async () => {
    const user = userEvent.setup()
    await setup()
    expect(await screen.findByText('No lists yet')).toBeInTheDocument()
    await createList(user, 'Best date night')
    await createList(user, '  Cheap eats   Midtown ')
    const names = async () => (await screen.findAllByRole('listitem')).map((li) => li.querySelector('a span')?.textContent)
    await waitFor(async () => expect(await names()).toEqual(['Best date night', 'Cheap eats Midtown']))
    await user.click(screen.getByRole('button', { name: 'Move Cheap eats Midtown up' }))
    await waitFor(async () => expect(await names()).toEqual(['Cheap eats Midtown', 'Best date night']))
    expect(screen.getByRole('button', { name: 'Move Cheap eats Midtown up' })).toBeDisabled()
  })

  it('adds restaurants to a list, edits a note, reorders, removes, renames and deletes', async () => {
    const user = userEvent.setup()
    const repos = await setup()
    await createList(user, 'Favorites')
    await user.click(await screen.findByRole('link', { name: /Favorites/ }))

    expect(await screen.findByText(/Nothing here yet/)).toBeInTheDocument()
    const picker = await screen.findByLabelText('Add a restaurant')
    await user.selectOptions(picker, await within(picker).findByRole('option', { name: 'Lilia' }))
    await user.click(screen.getByRole('button', { name: 'Add' }))
    await user.selectOptions(screen.getByLabelText('Add a restaurant'), await screen.findByRole('option', { name: 'Taim' }))
    await user.click(screen.getByRole('button', { name: 'Add' }))

    const order = () => screen.getAllByRole('listitem').map((li) => li.querySelector('a span')?.textContent)
    await waitFor(() => expect(order()).toEqual(['Lilia', 'Taim']))
    expect(screen.queryByRole('option', { name: 'Lilia' })).not.toBeInTheDocument() // already in list

    await user.click(screen.getByRole('button', { name: 'Move Taim up' }))
    await waitFor(() => expect(order()).toEqual(['Taim', 'Lilia']))

    const note = screen.getAllByLabelText('Note for this list')[0] as HTMLElement
    await user.type(note, 'Order the falafel')
    await user.tab() // blur saves
    await waitFor(async () => expect((await repos.lists.items()).some((i) => i.note === 'Order the falafel')).toBe(true))

    await user.click(screen.getByRole('button', { name: 'Remove Lilia from list' }))
    await waitFor(() => expect(order()).toEqual(['Taim']))

    await user.click(screen.getByRole('button', { name: 'Rename' }))
    const input = screen.getByLabelText('List name')
    await user.clear(input)
    await user.type(input, 'Go-tos')
    await user.click(screen.getByRole('button', { name: 'Save' }))
    expect(await screen.findByRole('heading', { name: 'Go-tos' })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Delete' }))
    await user.click(screen.getByRole('button', { name: 'Yes, delete list' }))
    expect(await screen.findByText('No lists yet')).toBeInTheDocument()
    expect(await repos.lists.items()).toHaveLength(0) // items removed with the list
  })

  it('adds a restaurant to several lists from its page, with a note kept per list', async () => {
    const user = userEvent.setup()
    const repos = await setup()
    await createList(user, 'One')
    await createList(user, 'Two')
    await screen.findByRole('link', { name: /Two/ })
    const carota = (await repos.places.list()).find((p) => p.name === 'Via Carota')
    document.body.innerHTML = ''
    render(
      <DataProvider repos={repos}>
        <MemoryRouter initialEntries={[`/place/${carota?.id}`]}>
          <Routes><Route path="/place/:id" element={<PlacePage />} /></Routes>
        </MemoryRouter>
      </DataProvider>,
    )
    await user.click(await screen.findByText('Add to list'))
    await user.click(await screen.findByRole('checkbox', { name: 'One' }))
    await user.click(screen.getByRole('checkbox', { name: 'Two' }))
    await waitFor(async () => expect(await repos.lists.items()).toHaveLength(2))
    await user.click(screen.getByRole('checkbox', { name: 'One' })) // uncheck
    await waitFor(async () => expect(await repos.lists.items()).toHaveLength(1))
    await user.type(screen.getByLabelText('New list name'), 'Fresh')
    await user.click(screen.getByRole('button', { name: 'Create + add' }))
    await waitFor(async () => expect(await repos.lists.items()).toHaveLength(2))
    expect(await screen.findByRole('checkbox', { name: 'Fresh' })).toBeChecked()
  })

  it('shows not-found for an unknown list', async () => {
    await setup('/lists/nope')
    expect(await screen.findByRole('heading', { name: 'List not found' })).toBeInTheDocument()
  })
})
