import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import VerdictBadge from '@/components/VerdictBadge'
import { usePlaces, useVisits } from '@/data/queries'
import { facetsOf } from '@/domain/facets'
import { activeFilterCount, buildLibrary, EMPTY_FILTERS, filterLibrary, type Filters, type LibraryEntry } from '@/domain/filters'
import { VERDICT_LABEL, VERDICTS } from '@/domain/types'
import QueryError from '@/components/QueryError'
import { ListSkeleton } from '@/components/Skeleton'
import PhotoThumb from '@/features/log/PhotoThumb'
import { filtersToParams, paramsToFilters } from './filterParams'

const PRICE = (n: number | null) => (n ? '$'.repeat(n) : '')
const sel = 'w-full rounded-xl border border-line bg-card px-3 py-2.5 text-base'

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm ${active ? 'border-accent bg-accent text-accent-ink' : 'border-line bg-card'}`}
    >
      {children}
    </button>
  )
}

function Select({ label, value, options, onChange }: { label: string; value: string; options: { value: string; label: string }[]; onChange: (v: string) => void }) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block text-muted">{label}</span>
      <select className={sel} value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="">Any</option>
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </label>
  )
}

function EntryCard({ entry, query }: { entry: LibraryEntry; query: string }) {
  const { place, visits } = entry
  const latest = visits[0]
  const photoId = visits.flatMap((v) => v.photoIds)[0]
  const order = latest?.orderThe || latest?.dishes.find((d) => d.orderAgain)?.name
  return (
    <li>
      <Link
        to={`/place/${place.id}`}
        state={{ from: query ? `/library?${query}` : '/library' }}
        className="flex gap-4 py-4 active:opacity-60"
      >
        {photoId ? (
          <PhotoThumb id={photoId} size="h-20 w-20" />
        ) : (
          <div aria-hidden className="grid h-20 w-20 shrink-0 place-items-center rounded-lg bg-line font-serif text-2xl text-muted">
            {place.name.charAt(0)}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h2 className="truncate font-serif text-lg font-semibold">{place.name}</h2>
            {latest && <VerdictBadge verdict={latest.verdict} />}
          </div>
          <p className="truncate text-sm text-muted">
            {[place.cuisine, place.neighborhood, PRICE(place.priceLevel)].filter(Boolean).join(' · ')}
          </p>
          {order && <p className="mt-1 truncate text-sm">Order: {order}</p>}
          <p className="mt-0.5 text-xs text-muted">
            {visits.length} {visits.length === 1 ? 'visit' : 'visits'}
          </p>
        </div>
      </Link>
    </li>
  )
}

export default function LibraryPage() {
  const [params, setParams] = useSearchParams()
  const [panel, setPanel] = useState(false)
  const places = usePlaces()
  const visits = useVisits()

  const filters = useMemo(() => paramsToFilters(params), [params])
  const set = (patch: Partial<Filters>) => setParams(filtersToParams({ ...filters, ...patch }), { replace: true })

  const library = useMemo(() => buildLibrary(places.data ?? [], visits.data ?? []), [places.data, visits.data])
  const facets = useMemo(() => facetsOf(library), [library])
  const results = useMemo(() => filterLibrary(library, filters), [library, filters])
  const count = activeFilterCount(filters)
  const lovedAgain = filters.verdict === 'loved' && filters.orderAgain
  const qs = params.toString()

  if (places.isError || visits.isError) {
    return <QueryError what="your library" onRetry={() => void Promise.all([places.refetch(), visits.refetch()])} />
  }
  if (places.isLoading || visits.isLoading) return <ListSkeleton label="Loading your library" />

  if (library.length === 0) {
    return (
      <section className="pt-6">
        <h1 className="text-4xl font-semibold">Welcome to Plates</h1>
        <p className="mt-3 text-muted">Be the friend who always knows where to eat.</p>
        <ol className="mt-8 space-y-5">
          {[
            ['Log', 'Jot down a visit in under a minute: a verdict, a photo, what to order.'],
            ['Collect', 'Build lists like "Best date night" from everywhere you\'ve been.'],
            ['Share', 'Send a beautiful link. No app or account needed to open it.'],
          ].map(([title, body], i) => (
            <li key={title} className="flex gap-4">
              <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-accent font-serif text-accent-ink">{i + 1}</span>
              <div>
                <h2 className="font-serif text-lg font-semibold">{title}</h2>
                <p className="text-muted">{body}</p>
              </div>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-col gap-3">
          <Link to="/log" className="min-h-12 rounded-xl bg-accent px-6 py-3.5 text-center font-medium text-accent-ink">Log your first place</Link>
          <Link to="/welcome" className="min-h-12 rounded-xl border border-line px-6 py-3.5 text-center font-medium">Add a few past favorites</Link>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h1 className="text-3xl font-semibold">Library</h1>
      <p className="mt-1 text-sm text-muted">{library.length} places</p>

      <div className="sticky top-0 z-[5] -mx-5 mt-4 bg-paper/95 px-5 pb-3 pt-2 backdrop-blur">
        <label htmlFor="lib-search" className="sr-only">Search places, dishes, notes and tags</label>
        <input
          id="lib-search"
          type="search"
          value={filters.query}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="Search places, dishes, notes, tags"
          className="w-full rounded-xl border border-line bg-card px-4 py-3 text-base"
        />
        <div className="-mx-5 mt-3 flex gap-2 overflow-x-auto px-5">
          <Chip active={lovedAgain} onClick={() => set(lovedAgain ? { verdict: null, orderAgain: false } : { verdict: 'loved', orderAgain: true })}>
            Loved it + order again
          </Chip>
          <Chip active={panel || count > 0} onClick={() => setPanel((p) => !p)}>
            Filters{count > 0 ? ` (${count})` : ''}
          </Chip>
          {count > 0 && (
            <button type="button" onClick={() => set({ ...EMPTY_FILTERS, query: filters.query })} className="min-h-11 shrink-0 px-2 text-sm text-muted underline">
              Clear
            </button>
          )}
        </div>
      </div>

      {panel && (
        <div className="mb-3 grid grid-cols-2 gap-3 rounded-xl border border-line bg-card p-4" role="group" aria-label="Filters">
          <Select label="Cuisine" value={filters.cuisine ?? ''} options={facets.cuisines.map((c) => ({ value: c, label: c }))} onChange={(v) => set({ cuisine: v || null })} />
          <Select label="Neighborhood" value={filters.neighborhood ?? ''} options={facets.neighborhoods.map((c) => ({ value: c, label: c }))} onChange={(v) => set({ neighborhood: v || null })} />
          <Select label="Price" value={filters.priceLevel ? String(filters.priceLevel) : ''} options={facets.priceLevels.map((p) => ({ value: String(p), label: PRICE(p) }))} onChange={(v) => set({ priceLevel: v ? Number(v) : null })} />
          <Select label="Verdict" value={filters.verdict ?? ''} options={VERDICTS.map((v) => ({ value: v, label: VERDICT_LABEL[v] }))} onChange={(v) => set({ verdict: (v || null) as Filters['verdict'] })} />
          <Select label="Occasion" value={filters.occasion ?? ''} options={facets.occasions.map((o) => ({ value: o, label: o }))} onChange={(v) => set({ occasion: v || null })} />
          <label className="flex items-end gap-2 pb-2.5 text-sm">
            <input type="checkbox" checked={filters.orderAgain} onChange={(e) => set({ orderAgain: e.target.checked })} className="h-4 w-4 accent-[var(--color-accent)]" />
            Order again only
          </label>
        </div>
      )}

      {results.length === 0 ? (
        <div className="pt-10 text-center" role="status">
          <p className="font-serif text-xl">Nothing matches</p>
          <p className="mt-1 text-muted">Try a different search or clear your filters.</p>
          <button type="button" onClick={() => set(EMPTY_FILTERS)} className="mt-4 rounded-xl border border-line px-5 py-2.5">Clear all</button>
        </div>
      ) : (
        <>
          <p className="sr-only" role="status">{results.length} results</p>
          <ul className="divide-y divide-line">
            {results.map((e) => (
              <EntryCard key={e.place.id} entry={e} query={qs} />
            ))}
          </ul>
        </>
      )}
    </section>
  )
}
