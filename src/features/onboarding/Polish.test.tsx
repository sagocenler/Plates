import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router'
import { vi } from 'vitest'
import ErrorBoundary from '@/components/ErrorBoundary'
import QueryError from '@/components/QueryError'
import { DataProvider } from '@/data/provider'
import { PlatesDB } from '@/data/local/db'
import { createLocalRepos } from '@/data/local/repos'
import LibraryPage from '../library/LibraryPage'
import QuickAddPage from './QuickAddPage'

let n = 0
const fresh = () => createLocalRepos(new PlatesDB(`polish-${n++}`))

describe('QuickAddPage', () => {
  it('adds past favorites with one tap each, supports undo, and shows them in the library', async () => {
    const repos = fresh()
    const user = userEvent.setup()
    render(
      <DataProvider repos={repos}>
        <MemoryRouter initialEntries={['/welcome']}>
          <Routes>
            <Route path="/welcome" element={<QuickAddPage />} />
            <Route path="/library" element={<LibraryPage />} />
          </Routes>
        </MemoryRouter>
      </DataProvider>,
    )
    await user.type(await screen.findByLabelText('Search restaurants'), 'lilia')
    const group = await screen.findByRole('group', { name: 'Verdict for Lilia' })
    await user.click(within(group).getByRole('button', { name: 'Loved it' }))
    expect(await screen.findByText(/Added: Loved it/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Done · 1 added' })).toBeInTheDocument()
    expect(await repos.visits.list()).toHaveLength(1)

    await user.click(screen.getByRole('button', { name: /Undo/ }))
    await waitFor(async () => expect(await repos.visits.list()).toHaveLength(0))
    expect(screen.getByRole('link', { name: 'Skip for now' })).toBeInTheDocument()

    await user.click(within(await screen.findByRole('group', { name: 'Verdict for Lilia' })).getByRole('button', { name: 'Liked it' }))
    await user.click(await screen.findByRole('link', { name: 'Done · 1 added' }))
    expect(await screen.findByRole('heading', { level: 2, name: 'Lilia' })).toBeInTheDocument()
  })

  it('changing a verdict after adding replaces the visit instead of duplicating it', async () => {
    const repos = fresh()
    const user = userEvent.setup()
    render(
      <DataProvider repos={repos}>
        <MemoryRouter initialEntries={['/welcome']}>
          <Routes><Route path="/welcome" element={<QuickAddPage />} /></Routes>
        </MemoryRouter>
      </DataProvider>,
    )
    await user.type(await screen.findByLabelText('Search restaurants'), 'taim')
    await user.click(within(await screen.findByRole('group', { name: 'Verdict for Taim' })).getByRole('button', { name: 'Liked it' }))
    await screen.findByText(/Added: Liked it/)
    expect(await repos.visits.list()).toHaveLength(1)
  })
})

describe('error handling', () => {
  it('QueryError offers a retry', async () => {
    const retry = vi.fn()
    render(<QueryError what="your library" onRetry={retry} />)
    expect(screen.getByRole('alert')).toHaveTextContent("We couldn't load your library")
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(retry).toHaveBeenCalled()
  })

  it('ErrorBoundary replaces a crashed screen with a friendly message', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const Boom = () => {
      throw new Error('boom')
    }
    render(
      <ErrorBoundary>
        <Boom />
      </ErrorBoundary>,
    )
    expect(screen.getByRole('alert')).toHaveTextContent('Something went wrong')
    expect(screen.getByRole('button', { name: 'Reload Plates' })).toBeInTheDocument()
    spy.mockRestore()
  })

  it('library shows an accessible loading skeleton first', async () => {
    const repos = fresh()
    render(
      <DataProvider repos={repos}>
        <MemoryRouter><LibraryPage /></MemoryRouter>
      </DataProvider>,
    )
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    expect(await screen.findByRole('heading', { name: 'Welcome to Plates' })).toBeInTheDocument()
  })
})
