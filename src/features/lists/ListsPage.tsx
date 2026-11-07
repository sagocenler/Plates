import { useState, type FormEvent } from 'react'
import { Link } from 'react-router'
import { useListActions } from './useListActions'

export default function ListsPage() {
  const a = useListActions()
  const [name, setName] = useState('')

  const create = async (e: FormEvent) => {
    e.preventDefault()
    const pending = name
    if (!pending.trim()) return
    setName('') // clear right away so the form feels instant
    await a.createList(pending)
  }

  return (
    <section>
      <h1 className="text-3xl font-semibold">Lists</h1>
      <p className="mt-1 text-sm text-muted">Curate your best picks: "Best date night", "Cheap eats Midtown"…</p>

      <form onSubmit={create} className="mt-5 flex gap-2">
        <label htmlFor="new-list" className="sr-only">New list name</label>
        <input
          id="new-list"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="New list name"
          className="w-full rounded-xl border border-line bg-card px-4 py-3 text-base"
        />
        <button type="submit" disabled={!name.trim()} className="shrink-0 rounded-xl bg-accent px-5 font-medium text-accent-ink disabled:bg-line disabled:text-muted">
          Create
        </button>
      </form>

      {a.lists.length === 0 ? (
        <div className="pt-12 text-center">
          <p className="font-serif text-xl">No lists yet</p>
          <p className="mx-auto mt-2 max-w-xs text-muted">Make a list above, then add restaurants to it from their pages.</p>
        </div>
      ) : (
        <ul className="mt-5 divide-y divide-line">
          {a.lists.map((l, i) => {
            const count = a.items.filter((x) => x.listId === l.id).length
            return (
              <li key={l.id} className="flex items-center gap-2 py-3">
                <Link to={`/lists/${l.id}`} className="min-w-0 flex-1 active:opacity-60">
                  <span className="block truncate font-serif text-lg font-semibold">{l.name}</span>
                  <span className="text-sm text-muted">{count} {count === 1 ? 'place' : 'places'}</span>
                </Link>
                <button type="button" aria-label={`Move ${l.name} up`} disabled={i === 0} onClick={() => void a.moveList(l.id, -1)} className="h-10 w-10 rounded-lg border border-line disabled:opacity-30">↑</button>
                <button type="button" aria-label={`Move ${l.name} down`} disabled={i === a.lists.length - 1} onClick={() => void a.moveList(l.id, 1)} className="h-10 w-10 rounded-lg border border-line disabled:opacity-30">↓</button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
