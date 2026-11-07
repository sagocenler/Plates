import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { vi } from 'vitest'
import { DataProvider } from '@/data/provider'
import { PlatesDB } from '@/data/local/db'
import { createLocalRepos } from '@/data/local/repos'
import type { AuthRepo, Repos } from '@/data/interfaces'
import LoginPage from './LoginPage'

function reposWith(auth: Partial<AuthRepo>): Repos {
  const base = createLocalRepos(new PlatesDB(`login-${Math.random()}`))
  return { ...base, auth: { ...base.auth, mode: 'password', ...auth } as AuthRepo }
}

describe('LoginPage (password mode)', () => {
  it('shows a password field and signs in', async () => {
    const signIn = vi.fn().mockResolvedValue({ id: 'u', displayName: 'a' })
    render(<DataProvider repos={reposWith({ signIn })}><LoginPage /></DataProvider>)
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Email'), 'a@b.co')
    await user.type(screen.getByLabelText('Password'), 'hunter2hunter2')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    await waitFor(() => expect(signIn).toHaveBeenCalledWith('a@b.co', 'hunter2hunter2'))
  })

  it('creates an account, and explains when the project still wants email confirmation', async () => {
    const signUp = vi.fn().mockResolvedValue(null)
    render(<DataProvider repos={reposWith({ signUp })}><LoginPage /></DataProvider>)
    const user = userEvent.setup()
    await user.click(await screen.findByRole('button', { name: /Create an account/ }))
    await user.type(screen.getByLabelText('Email'), 'new@b.co')
    await user.type(screen.getByLabelText('Password'), 'longenough1')
    await user.click(screen.getByRole('button', { name: 'Create account' }))
    expect(await screen.findByText(/requires email confirmation/)).toBeInTheDocument()
  })

  it('shows a generic message for bad credentials (does not reveal which part was wrong)', async () => {
    const signIn = vi.fn().mockRejectedValue(new Error('Invalid login credentials'))
    render(<DataProvider repos={reposWith({ signIn })}><LoginPage /></DataProvider>)
    const user = userEvent.setup()
    await user.type(await screen.findByLabelText('Email'), 'a@b.co')
    await user.type(screen.getByLabelText('Password'), 'wrongwrong')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Email or password is incorrect.')
  })
})
