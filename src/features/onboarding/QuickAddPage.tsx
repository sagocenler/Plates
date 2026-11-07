import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { Link } from 'react-router'
import type { PlaceSearchResult } from '@/data/interfaces'
import { useRepos } from '@/data/provider'
import { VERDICT_LABEL, type Id, type Verdict } from '@/domain/types'
import { useAuth } from '@/features/auth/useAuth'
import { emptyForm, formToVisit } from '@/features/log/formState'
import { NYC_CENTER } from '@/lib/useGeolocation'

type Added = { visitId: Id; verdict: Verdict }

/** Bulk-add past favorites in one tap each: pick a place, pick a verdict, done. */
export default function QuickAddPage() {
  const repos = useRepos()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [added, setAdded] = useState<Record<string, Added>>({})
  const query = q.trim()

  const results = useQuery({
    queryKey: ['quick-add', query],
    queryFn: () => (query ? repos.placeSearch.autocomplete(query, NYC_CENTER) : repos.placeSearch.nearby(NYC_CENTER, 12)),
  })

  const refresh = () => Promise.all([qc.invalidateQueries({ queryKey: ['visits'] }), qc.invalidateQueries({ queryKey: ['places'] })])

  const add = async (p: PlaceSearchResult, verdict: Verdict) => {
    const place = await repos.places.upsert(p)
    const previous = added[p.googlePlaceId]
    if (previous) await repos.visits.remove(previous.visitId)
    const visit = await repos.visits.save(formToVisit({ ...emptyForm(), place: p, verdict }, place.id, user?.id ?? 'local-user'))
    setAdded((a) => ({ ...a, [p.googlePlaceId]: { visitId: visit.id, verdict } }))
    await refresh()
  }

  const undo = async (googlePlaceId: string) => {
    const hit = added[googlePlaceId]
    if (!hit) return
    await repos.visits.remove(hit.visitId)
    setAdded(({ [googlePlaceId]: _gone, ...rest }) => rest)
    await refresh()
  }

  const count = Object.keys(added).length

  return (
    <section>
      <h1 className="text-3xl font-semibold">Add past favorites</h1>
      <p className="mt-2 text-muted">Tap how you felt about places you already know. You can add dishes and tips later.</p>

      <label htmlFor="qa-search" className="sr-only">Search restaurants</label>
      <input
        id="qa-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search restaurants"
        autoComplete="off"
        className="mt-5 w-full rounded-xl border border-line bg-card px-4 py-3 text-base"
      />

      <ul className="mt-4 divide-y divide-line">
        {results.data?.map((p) => {
          const a = added[p.googlePlaceId]
          return (
            <li key={p.googlePlaceId} className="py-3.5">
              <p className="font-medium">{p.name}</p>
              <p className="text-sm text-muted">{[p.cuisine, p.neighborhood].filter(Boolean).join(' · ')}</p>
              {a ? (
                <p className="mt-2 flex items-center justify-between text-sm" role="status">
                  <span className="text-accent">✓ Added: {VERDICT_LABEL[a.verdict]}</span>
                  <button type="button" onClick={() => void undo(p.googlePlaceId)} className="min-h-11 px-2 text-muted underline">
                    Undo<span className="sr-only"> {p.name}</span>
                  </button>
                </p>
              ) : (
                <div className="mt-2 flex gap-2" role="group" aria-label={`Verdict for ${p.name}`}>
                  {(['loved', 'liked', 'fine'] as const).map((v) => (
                    <button key={v} type="button" onClick={() => void add(p, v)} className="min-h-11 flex-1 rounded-xl border border-line bg-card px-2 text-sm active:bg-line">
                      {VERDICT_LABEL[v]}
                    </button>
                  ))}
                </div>
              )}
            </li>
          )
        })}
        {results.data?.length === 0 && <li className="py-4 text-muted">No matches. Try another name.</li>}
      </ul>

      <div className="sticky bottom-20 z-[5] mt-4">
        <Link to="/library" className="block min-h-12 rounded-xl bg-accent px-4 py-3.5 text-center font-medium text-accent-ink shadow-lg">
          {count > 0 ? `Done · ${count} added` : 'Skip for now'}
        </Link>
      </div>
    </section>
  )
}
