import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import QueryError from '@/components/QueryError'
import { ListSkeleton } from '@/components/Skeleton'
import { useRepos } from '@/data/provider'
import { usePlaces, useWants } from '@/data/queries'
import { mapsUrl } from '@/domain/share'
import { useGeolocation } from '@/lib/useGeolocation'
import { useWantActions } from './useWantActions'

const PRICE = (n: number | null) => (n ? '$'.repeat(n) : '')

export default function WantPage() {
  const repos = useRepos()
  const navigate = useNavigate()
  const a = useWantActions()
  const wants = useWants()
  const places = usePlaces()
  const geo = useGeolocation()
  const [q, setQ] = useState('')
  const query = q.trim()

  const results = useQuery({
    queryKey: ['want-search', query, geo.coords.lat, geo.coords.lng],
    queryFn: () => (query ? repos.placeSearch.autocomplete(query, geo.coords) : repos.placeSearch.nearby(geo.coords, 8)),
    enabled: geo.source !== 'pending',
  })

  if (wants.isError || places.isError) return <QueryError what="your list" onRetry={() => void Promise.all([wants.refetch(), places.refetch()])} />
  if (wants.isLoading || places.isLoading) return <ListSkeleton rows={3} label="Loading your want-to-try list" />

  const wanted = new Set(a.wants.map((w) => w.placeId))
  const wantedGoogleIds = new Set((places.data ?? []).filter((p) => wanted.has(p.id)).map((p) => p.googlePlaceId))
  const suggestions = (results.data ?? []).filter((r) => !wantedGoogleIds.has(r.googlePlaceId))

  return (
    <section>
      <Link to="/lists" className="text-sm text-muted">← Lists</Link>
      <h1 className="mt-2 text-3xl font-semibold">Want to try</h1>
      <p className="mt-1 text-sm text-muted">Places on your radar. When you go, tap "I went" to log the visit.</p>

      {a.wants.length === 0 ? (
        <p className="mt-6 rounded-xl border border-dashed border-line p-6 text-center text-muted">
          Nothing here yet. Search below to save a place you've been meaning to try.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {a.wants.map((w) => {
            const place = places.data?.find((p) => p.id === w.placeId)
            if (!place) return null
            return (
              <li key={w.id} className="rounded-xl border border-line bg-card p-4">
                <h2 className="font-serif text-lg font-semibold">{place.name}</h2>
                <p className="text-sm text-muted">{[place.cuisine, place.neighborhood, PRICE(place.priceLevel)].filter(Boolean).join(' · ')}</p>
                <label htmlFor={`want-note-${w.id}`} className="mt-3 block text-xs text-muted">Why you want to go</label>
                <textarea
                  id={`want-note-${w.id}`}
                  rows={2}
                  defaultValue={w.note}
                  onBlur={(e) => void a.saveNote(w, e.target.value)}
                  placeholder="A friend's tip, a dish to try… (optional)"
                  className="mt-1 w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm"
                />
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => navigate('/log', { state: { place, wantId: w.id } })}
                    className="min-h-11 rounded-xl bg-accent px-4 text-sm font-medium text-accent-ink"
                  >
                    I went<span className="sr-only"> to {place.name}</span>
                  </button>
                  <a href={mapsUrl(place)} target="_blank" rel="noreferrer" className="grid min-h-11 place-items-center rounded-xl border border-line px-4 text-sm">
                    Open in Maps<span className="sr-only"> for {place.name}</span>
                  </a>
                  <button type="button" onClick={() => void a.remove(w.id)} className="min-h-11 px-2 text-sm text-muted">
                    Remove<span className="sr-only"> {place.name}</span>
                  </button>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <h2 className="mt-10 text-xl font-semibold">Add a place</h2>
      <label htmlFor="want-search" className="sr-only">Search restaurants to add</label>
      <input
        id="want-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search restaurants"
        autoComplete="off"
        className="mt-3 w-full rounded-xl border border-line bg-card px-4 py-3 text-base"
      />
      <ul className="mt-2 divide-y divide-line">
        {suggestions.map((r) => (
          <li key={r.googlePlaceId} className="flex items-center justify-between gap-3 py-3">
            <span className="min-w-0">
              <span className="block truncate font-medium">{r.name}</span>
              <span className="block truncate text-sm text-muted">{[r.cuisine, r.neighborhood, PRICE(r.priceLevel)].filter(Boolean).join(' · ')}</span>
            </span>
            <button type="button" onClick={() => void a.add(r)} className="min-h-11 shrink-0 rounded-xl border border-line px-4 text-sm">
              Want to try<span className="sr-only"> {r.name}</span>
            </button>
          </li>
        ))}
        {results.data && suggestions.length === 0 && <li className="py-4 text-muted">No matches. Try another name.</li>}
      </ul>
    </section>
  )
}
