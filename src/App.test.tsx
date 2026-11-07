import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import App from './App'

describe('App', () => {
  it('shows login, then the app shell after signing in', async () => {
    render(<App />)
    expect(await screen.findByRole('heading', { name: 'Plates' })).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Email'), 'victoria@example.com')
    await userEvent.click(screen.getByRole('button', { name: 'Continue' }))
    await waitFor(() => expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument())
    expect(await screen.findByRole('heading', { name: 'Library' })).toBeInTheDocument()
  })
})
