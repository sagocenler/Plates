import { lazy, Suspense, useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import VerdictBadge from '@/components/VerdictBadge'
import { usePlaces, useVisits } from '@/data/queries'
import { buildLibrary, filterLibrary } from '@/domain/filters'
import { representativeVisit } from '@/domain/share'
import { filtersToParams, paramsToFilters } from '@/features/library/filterParams'

const MapView = lazy(() => import('./MapView'))
const PRICE = (n: number | null) => (n ? '$'.repeat(n) : '')

export default function MapPage() {
  const [params, setParams] = useSearchParams()
  const [selected, setSelected] = useState<string | null>(null)
  const places = usePlaces()
  const visits = useVisits()

  const filters = useMemo(() => paramsToFilters(params), [params])
  const library = useMemo(() => buildLibrary(places.data ?? [], visits.data ?? []), [places.data, visits.data])
  const results = useMemo(() => filterLibrary(library, filters), [library, filters])
  const lovedAgain = filters.verdict === 'loved' && filters.orderAgain
  const entry = results.find((e) => e.place.id === selected) ?? null
  const rep = entry ? representativeVisit(entry.visits) : undefined

  const toggleLoved = () =>
    setParams(filtersToParams({ ...filters, verdict: lovedAgain ? null : 'loved', orderAgain: !lovedAgain }), { replace: true })

  if (places.isLoading || visits.isLoading) return <p role="status" className="text-muted">Loading map…</p>

  if (library.length === 0) {
    return (
      <section className="pt-10 text-center">
        <h1 className="text-3xl font-semibold">Nothing to map yet</h1>
        <p className="mx-auto mt-3 max-w-xs text-muted">Every place you log shows up here as a pin.</p>
        <Link to="/log" className="mt-6 inline-block rounded-xl bg-accent px-6 py-3 font-medium text-accent-ink">Log your first place</Link>
      </section>
    )
  }

  return (
    <section aria-label="Map" className="relative -mx-5 -mb-28 -mt-8 h-[calc(100dvh-3.5rem-env(safe-area-inset-bottom))]">
      <Suspense fallback={<p role="status" className="p-6 text-muted">Loading map…</p>}>
        <MapView entries={results} selectedId={selected} onSelect={setSelected} />
      </Suspense>

      <div className="pointer-events-none absolute inset-x-0 top-0 flex items-center gap-2 p-3">
        <button
          type="button"
          aria-pressed={lovedAgain}
          onClick={toggleLoved}
          className={`pointer-events-auto rounded-full border px-3.5 py-2 text-sm shadow ${lovedAgain ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-card'}`}
        >
          Loved it + order again
        </button>
        <span className="pointer-events-auto rounded-full bg-card px-3 py-2 text-sm shadow" role="status">
          {results.length} {results.length === 1 ? 'place' : 'places'}
        </span>
      </div>

      {entry && rep && (
        <Link
          to={`/place/${entry.place.id}`}
          className="absolute inset-x-3 bottom-3 z-10 rounded-2xl border border-line bg-card p-4 shadow-lg"
        >
          <div className="flex items-start justify-between gap-2">
            <h2 className="font-serif text-lg font-semibold">{entry.place.name}</h2>
            <VerdictBadge verdict={rep.verdict} />
          </div>
          <p className="text-sm text-muted">{[entry.place.cuisine, entry.place.neighborhood, PRICE(entry.place.priceLevel)].filter(Boolean).join(' · ')}</p>
          {rep.orderThe && <p className="mt-1 text-sm">Order: {rep.orderThe}</p>}
          <p className="mt-2 text-sm text-accent">View restaurant →</p>
        </Link>
      )}
    </section>
  )
}
