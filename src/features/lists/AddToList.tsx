import { useState } from 'react'
import { useListActions } from './useListActions'

/** Checklist of the user's lists for one restaurant, with inline "new list". */
export default function AddToList({ placeId }: { placeId: string }) {
  const a = useListActions()
  const [name, setName] = useState('')
  const memberOf = new Set(a.items.filter((i) => i.placeId === placeId).map((i) => i.listId))
  // Show the tick instantly; the stored value catches up a moment later.
  const [optimistic, setOptimistic] = useState<Record<string, boolean>>({})
  const toggle = async (listId: string, on: boolean) => {
    setOptimistic((o) => ({ ...o, [listId]: on }))
    try {
      await (on ? a.addPlace(listId, placeId) : a.removePlace(listId, placeId))
    } finally {
      setOptimistic(({ [listId]: _done, ...rest }) => rest)
    }
  }

  return (
    <details className="rounded-xl border border-line bg-card p-4">
      <summary className="cursor-pointer font-medium">
        Add to list{memberOf.size > 0 ? ` (${memberOf.size})` : ''}
      </summary>
      <ul className="mt-3 space-y-1">
        {a.lists.map((l) => (
          <li key={l.id}>
            <label className="flex items-center gap-3 py-2">
              <input
                type="checkbox"
                checked={optimistic[l.id] ?? memberOf.has(l.id)}
                onChange={(e) => void toggle(l.id, e.target.checked)}
                className="h-5 w-5 accent-[var(--color-accent)]"
              />
              {l.name}
            </label>
          </li>
        ))}
      </ul>
      <form
        className="mt-2 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault()
          const list = await a.createList(name)
          if (list) {
            await a.addPlace(list.id, placeId)
            setName('')
          }
        }}
      >
        <label htmlFor="quick-list" className="sr-only">New list name</label>
        <input id="quick-list" value={name} onChange={(e) => setName(e.target.value)} placeholder="New list…" className="w-full rounded-xl border border-line bg-paper px-3 py-2.5" />
        <button type="submit" disabled={!name.trim()} className="shrink-0 rounded-xl border border-line px-4 disabled:opacity-40">Create + add</button>
      </form>
    </details>
  )
}
