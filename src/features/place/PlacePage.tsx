import { Link, useLocation, useNavigate, useParams } from 'react-router'
import VerdictBadge from '@/components/VerdictBadge'
import { usePlaces, useVisits } from '@/data/queries'
import { bestDishes } from '@/domain/dishes'
import { mapsUrl } from '@/domain/share'
import { VALUE_LABEL, type Visit } from '@/domain/types'
import AddToList from '@/features/lists/AddToList'
import PhotoThumb from '@/features/log/PhotoThumb'

const PRICE = (n: number | null) => (n ? '$'.repeat(n) : '')
const fmtDate = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })

function Line({ label, text }: { label: string; text: string }) {
  if (!text) return null
  return (
    <p className="text-sm">
      <span className="text-muted">{label} </span>
      {text}
    </p>
  )
}

function VisitCard({ v }: { v: Visit }) {
  return (
    <li className="rounded-xl border border-line bg-card p-4">
      <div className="flex items-center justify-between">
        <time dateTime={v.visitedOn} className="text-sm text-muted">{fmtDate(v.visitedOn)}</time>
        <div className="flex items-center gap-2">
          {v.value && <span className="text-xs text-muted">{VALUE_LABEL[v.value]}</span>}
          <VerdictBadge verdict={v.verdict} />
        </div>
      </div>
      {v.photoIds.length > 0 && (
        <div className="mt-3 flex gap-2 overflow-x-auto">
          {v.photoIds.map((id) => (
            <PhotoThumb key={id} id={id} size="h-24 w-24" />
          ))}
        </div>
      )}
      <div className="mt-3 space-y-1">
        <Line label="Order the" text={v.orderThe} />
        <Line label="Skip the" text={v.skipThe} />
        <Line label="Tip" text={v.tip} />
      </div>
      {v.dishes.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {v.dishes.map((d) => (
            <li key={d.id} className="flex items-center justify-between gap-2">
              <span>{d.name}</span>
              <span className="text-xs text-muted">
                {[d.verdict, d.orderAgain && 'order again'].filter(Boolean).join(' · ')}
              </span>
            </li>
          ))}
        </ul>
      )}
      {v.occasions.length > 0 && (
        <p className="mt-3 flex flex-wrap gap-1.5">
          {v.occasions.map((o) => (
            <span key={o} className="rounded-full border border-line px-2.5 py-0.5 text-xs">{o}</span>
          ))}
        </p>
      )}
      {v.privateNote && (
        <p className="mt-3 rounded-lg bg-line/50 px-3 py-2 text-sm">
          <span className="mr-1 text-xs font-medium uppercase tracking-wide text-muted">Private</span>
          {v.privateNote}
        </p>
      )}
    </li>
  )
}

export default function PlacePage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const places = usePlaces()
  const visits = useVisits()

  if (places.isLoading || visits.isLoading) return <p role="status" className="text-muted">Loading…</p>
  const place = places.data?.find((p) => p.id === id)
  if (!place) {
    return (
      <section className="pt-10 text-center">
        <h1 className="text-2xl font-semibold">Restaurant not found</h1>
        <Link to="/library" className="mt-4 inline-block underline">Back to library</Link>
      </section>
    )
  }

  const mine = (visits.data ?? []).filter((v) => v.placeId === place.id).sort((a, b) => b.visitedOn.localeCompare(a.visitedOn))
  const best = bestDishes(mine)
  const back = (location.state as { from?: string } | null)?.from ?? '/library'

  return (
    <article className="space-y-7">
      <header>
        <Link to={back} className="text-sm text-muted">← Library</Link>
        <h1 className="mt-2 text-4xl font-semibold">{place.name}</h1>
        <p className="mt-1 text-muted">{[place.cuisine, place.neighborhood, PRICE(place.priceLevel)].filter(Boolean).join(' · ')}</p>
        <p className="text-sm text-muted">{place.address}</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate('/log', { state: { place } })}
            className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink"
          >
            Log another visit
          </button>
          <a href={mapsUrl(place)} target="_blank" rel="noreferrer" className="rounded-xl border border-line px-4 py-2.5 text-sm">
            Open in Maps
          </a>
        </div>
      </header>

      <AddToList placeId={place.id} />

      {best.length > 0 && (
        <section aria-labelledby="best-h">
          <h2 id="best-h" className="mb-2 text-xl font-semibold">Best dishes</h2>
          <ul className="flex flex-wrap gap-2">
            {best.map((d) => (
              <li key={d.name} className="rounded-full border border-accent px-3 py-1.5 text-sm">
                {d.name}
                {d.times > 1 && <span className="ml-1 text-xs text-muted">×{d.times}</span>}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-labelledby="hist-h">
        <h2 id="hist-h" className="mb-3 text-xl font-semibold">
          {mine.length} {mine.length === 1 ? 'visit' : 'visits'}
        </h2>
        <ul className="space-y-3">
          {mine.map((v) => (
            <VisitCard key={v.id} v={v} />
          ))}
        </ul>
      </section>
    </article>
  )
}
