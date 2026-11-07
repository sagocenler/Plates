import { useQuery } from '@tanstack/react-query'
import { useId, useState } from 'react'
import type { PlaceSearchResult } from '@/data/interfaces'
import { useRepos } from '@/data/provider'
import { useGeolocation } from '@/lib/useGeolocation'

const PRICE = (n: number | null) => (n ? '$'.repeat(n) : '')
const dist = (m?: number) => (m == null ? '' : m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1)} km`)

export default function PlacePicker({ onPick }: { onPick: (p: PlaceSearchResult) => void }) {
  const { placeSearch } = useRepos()
  const geo = useGeolocation()
  const [q, setQ] = useState('')
  const inputId = useId()
  const query = q.trim()

  const results = useQuery({
    queryKey: ['place-search', query, geo.coords.lat, geo.coords.lng],
    queryFn: () => (query ? placeSearch.autocomplete(query, geo.coords) : placeSearch.nearby(geo.coords, 5)),
    enabled: geo.source !== 'pending',
  })

  return (
    <section aria-labelledby={`${inputId}-h`}>
      <h1 id={`${inputId}-h`} className="text-3xl font-semibold">Where did you eat?</h1>
      <label htmlFor={inputId} className="sr-only">Search restaurants</label>
      <input
        id={inputId}
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search restaurants"
        autoComplete="off"
        className="mt-5 w-full rounded-xl border border-line bg-card px-4 py-3 text-base"
      />
      <h2 className="mt-6 text-sm font-medium text-muted">
        {query ? 'Results' : geo.source === 'device' ? 'Near you' : 'Popular in NYC'}
      </h2>
      {results.isLoading || geo.source === 'pending' ? (
        <p role="status" className="mt-3 text-muted">Finding places…</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">
          {results.data?.map((p) => (
            <li key={p.googlePlaceId}>
              <button
                type="button"
                onClick={() => onPick(p)}
                className="flex w-full items-center justify-between gap-3 py-3.5 text-left active:opacity-60"
              >
                <span>
                  <span className="block font-medium">{p.name}</span>
                  <span className="block text-sm text-muted">
                    {[p.cuisine, p.neighborhood, PRICE(p.priceLevel)].filter(Boolean).join(' · ')}
                  </span>
                </span>
                <span className="text-xs text-muted">{dist(p.distanceMeters)}</span>
              </button>
            </li>
          ))}
          {results.data?.length === 0 && <li className="py-4 text-muted">No matches. Try another name.</li>}
        </ul>
      )}
    </section>
  )
}
