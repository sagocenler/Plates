import { useState, type FormEvent } from 'react'
import { useAuth } from './useAuth'

const field = 'w-full rounded-xl border border-line bg-card px-4 py-3 text-base'

/**
 * Local mode: any email signs you in on this device (dev stub).
 * Password mode: real accounts. Email confirmation is expected to be OFF in the Supabase project for now,
 * but if it is on we explain what happened instead of failing silently.
 */
export default function LoginPage() {
  const { signIn, signUp, mode } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [creating, setCreating] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)

  const pending = signIn.isPending || signUp.isPending
  const error = (creating ? signUp.error : signIn.error) as Error | null

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setNotice(null)
    if (!email.trim()) return
    if (mode === 'local') {
      signIn.mutate({ email: email.trim(), password: '' })
      return
    }
    if (creating) {
      const user = await signUp.mutateAsync({ email: email.trim(), password }).catch(() => undefined)
      if (user === null) setNotice('Account created. This project still requires email confirmation, so check your inbox, then sign in.')
    } else {
      signIn.mutate({ email: email.trim(), password })
    }
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <h1 className="text-5xl font-semibold">Plates</h1>
      <p className="mt-3 text-muted">Log where you eat. Recommend with confidence.</p>

      <form onSubmit={(e) => void submit(e)} className="mt-10 space-y-3">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className={field} />

        {mode === 'password' && (
          <>
            <label htmlFor="password" className="block pt-1 text-sm font-medium">Password</label>
            <input
              id="password"
              type="password"
              autoComplete={creating ? 'new-password' : 'current-password'}
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              aria-describedby="pw-hint"
              className={field}
            />
            {creating && <p id="pw-hint" className="text-xs text-muted">At least 8 characters.</p>}
          </>
        )}

        {error && (
          <p role="alert" className="text-sm text-accent">
            {creating ? error.message : 'Email or password is incorrect.'}
          </p>
        )}
        {notice && <p role="status" className="text-sm">{notice}</p>}

        <button type="submit" disabled={pending} className="min-h-12 w-full rounded-xl bg-accent px-4 py-3 font-medium text-accent-ink disabled:bg-line disabled:text-muted">
          {pending ? 'One moment…' : mode === 'local' ? 'Continue' : creating ? 'Create account' : 'Sign in'}
        </button>

        {mode === 'password' ? (
          <button
            type="button"
            onClick={() => {
              setCreating((c) => !c)
              setNotice(null)
            }}
            className="min-h-11 w-full text-sm text-muted underline"
          >
            {creating ? 'I already have an account' : 'New here? Create an account'}
          </button>
        ) : (
          <p className="pt-2 text-xs text-muted">
            Development mode: this signs you in locally on this device. Real sign-in comes with the backend.
          </p>
        )}
      </form>
    </main>
  )
}
