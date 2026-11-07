import { useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router'
import VerdictBadge from '@/components/VerdictBadge'
import { usePlaces, useVisits } from '@/data/queries'
import { representativeVisit } from '@/domain/share'
import SharePanel from '@/features/share/SharePanel'
import { useListActions } from './useListActions'

const PRICE = (n: number | null) => (n ? '$'.repeat(n) : '')

export default function ListDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const a = useListActions()
  const places = usePlaces()
  const visits = useVisits()
  const [renaming, setRenaming] = useState(false)
  const [draft, setDraft] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pick, setPick] = useState('')

  const list = a.lists.find((l) => l.id === id)
  if (!list) {
    return (
      <section className="pt-10 text-center">
        <h1 className="text-2xl font-semibold">List not found</h1>
        <Link to="/lists" className="mt-4 inline-block underline">Back to lists</Link>
      </section>
    )
  }

  const items = a.items.filter((i) => i.listId === list.id).sort((x, y) => x.position - y.position)
  const inList = new Set(items.map((i) => i.placeId))
  const available = (places.data ?? []).filter((p) => !inList.has(p.id)).sort((x, y) => x.name.localeCompare(y.name))

  return (
    <article className="space-y-6">
      <header>
        <Link to="/lists" className="text-sm text-muted">← Lists</Link>
        {renaming ? (
          <form
            className="mt-2 flex gap-2"
            onSubmit={async (e) => {
              e.preventDefault()
              await a.renameList(list, draft)
              setRenaming(false)
            }}
          >
            <label htmlFor="rename" className="sr-only">List name</label>
            <input id="rename" autoFocus value={draft} onChange={(e) => setDraft(e.target.value)} className="w-full rounded-xl border border-line bg-card px-4 py-2.5 text-lg" />
            <button type="submit" className="rounded-xl bg-accent px-4 text-accent-ink">Save</button>
            <button type="button" onClick={() => setRenaming(false)} className="rounded-xl border border-line px-4">Cancel</button>
          </form>
        ) : (
          <h1 className="mt-2 text-3xl font-semibold">{list.name}</h1>
        )}
        <p className="text-sm text-muted">{items.length} {items.length === 1 ? 'place' : 'places'}</p>
        {!renaming && (
          <div className="mt-3 flex gap-2">
            <button type="button" onClick={() => { setDraft(list.name); setRenaming(true) }} className="rounded-xl border border-line px-4 py-2 text-sm">Rename</button>
            {confirmDelete ? (
              <>
                <button
                  type="button"
                  onClick={async () => {
                    await a.deleteList(list.id)
                    navigate('/lists', { replace: true })
                  }}
                  className="rounded-xl bg-accent px-4 py-2 text-sm text-accent-ink"
                >
                  Yes, delete list
                </button>
                <button type="button" onClick={() => setConfirmDelete(false)} className="rounded-xl border border-line px-4 py-2 text-sm">Keep</button>
              </>
            ) : (
              <button type="button" onClick={() => setConfirmDelete(true)} className="rounded-xl border border-line px-4 py-2 text-sm">Delete</button>
            )}
          </div>
        )}
      </header>

      {items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <SharePanel kind="list" targetId={list.id} title={list.name} />
        </div>
      )}

      {items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line p-6 text-center text-muted">
          Nothing here yet. Add a restaurant below, or use "Add to list" on any restaurant page.
        </p>
      ) : (
        <ol className="space-y-3">
          {items.map((item, i) => {
            const place = places.data?.find((p) => p.id === item.placeId)
            if (!place) return null
            const rep = representativeVisit((visits.data ?? []).filter((v) => v.placeId === place.id))
            return (
              <li key={item.id} className="rounded-xl border border-line bg-card p-4">
                <div className="flex items-start justify-between gap-2">
                  <Link to={`/place/${place.id}`} className="min-w-0">
                    <span className="block truncate font-serif text-lg font-semibold">{place.name}</span>
                    <span className="block truncate text-sm text-muted">{[place.cuisine, place.neighborhood, PRICE(place.priceLevel)].filter(Boolean).join(' · ')}</span>
                  </Link>
                  {rep && <VerdictBadge verdict={rep.verdict} />}
                </div>
                <label htmlFor={`note-${item.id}`} className="mt-3 block text-xs text-muted">Note for this list</label>
                <textarea
                  id={`note-${item.id}`}
                  rows={2}
                  defaultValue={item.note}
                  onBlur={(e) => void a.saveNote(item.id, e.target.value)}
                  placeholder="Why it belongs here (optional)"
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
                />
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex gap-2">
                    <button type="button" aria-label={`Move ${place.name} up`} disabled={i === 0} onClick={() => void a.moveItem(list.id, item.id, -1)} className="h-11 w-11 rounded-lg border border-line disabled:opacity-30">↑</button>
                    <button type="button" aria-label={`Move ${place.name} down`} disabled={i === items.length - 1} onClick={() => void a.moveItem(list.id, item.id, 1)} className="h-11 w-11 rounded-lg border border-line disabled:opacity-30">↓</button>
                  </div>
                  <button type="button" onClick={() => void a.removePlace(list.id, place.id)} aria-label={`Remove ${place.name} from list`} className="min-h-11 px-2 text-sm text-muted">Remove</button>
                </div>
              </li>
            )
          })}
        </ol>
      )}

      {available.length > 0 && (
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault()
            if (pick) {
              await a.addPlace(list.id, pick)
              setPick('')
            }
          }}
        >
          <label htmlFor="add-place" className="sr-only">Add a restaurant</label>
          <select id="add-place" value={pick} onChange={(e) => setPick(e.target.value)} className="w-full rounded-xl border border-line bg-card px-3 py-3 text-base">
            <option value="">Add a restaurant…</option>
            {available.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button type="submit" disabled={!pick} className="shrink-0 rounded-xl bg-accent px-5 font-medium text-accent-ink disabled:bg-line disabled:text-muted">Add</button>
        </form>
      )}
    </article>
  )
}
