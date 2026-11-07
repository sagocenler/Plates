import { useState, type FormEvent } from 'react'
import { useAuth } from './useAuth'

/** Local stub. The real flow (email code + Google) arrives with Supabase. */
export default function LoginPage() {
  const { signIn } = useAuth()
  const [email, setEmail] = useState('')

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (email.trim()) signIn.mutate(email.trim())
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6">
      <h1 className="text-5xl font-semibold">Plates</h1>
      <p className="mt-3 text-muted">Log where you eat. Recommend with confidence.</p>
      <form onSubmit={submit} className="mt-10 space-y-3">
        <label htmlFor="email" className="text-sm font-medium">Email</label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          className="w-full rounded-xl border border-line bg-card px-4 py-3 text-base"
        />
        <button type="submit" className="w-full rounded-xl bg-accent px-4 py-3 font-medium text-accent-ink">
          Continue
        </button>
        <p className="pt-2 text-xs text-muted">
          Development mode: this signs you in locally on this device. Real sign-in comes with the backend.
        </p>
      </form>
    </main>
  )
}
