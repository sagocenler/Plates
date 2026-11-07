import { useEffect } from 'react'
import { useParams } from 'react-router'
import VerdictBadge from '@/components/VerdictBadge'
import { VALUE_LABEL } from '@/domain/types'
import type { SharedPlace } from '@/domain/share'
import PhotoThumb from '@/features/log/PhotoThumb'
import { useSharedPayload } from './useSharedPayload'

function Block({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="font-sans text-xs font-medium uppercase tracking-wide text-muted">{label}</h3>
      <div className="mt-1">{children}</div>
    </div>
  )
}

function PlaceCard({ p, headingLevel }: { p: SharedPlace; headingLevel: 1 | 2 }) {
  const Heading = headingLevel === 1 ? 'h1' : 'h2'
  return (
    <article className="space-y-5">
      {p.photoIds.length > 0 && (
        <div className="-mx-5 flex gap-2 overflow-x-auto px-5">
          {p.photoIds.map((id) => (
            <PhotoThumb key={id} id={id} size="h-64 w-64" />
          ))}
        </div>
      )}
      <header>
        <div className="flex items-start justify-between gap-3">
          <Heading className="text-3xl font-semibold">{p.name}</Heading>
          <VerdictBadge verdict={p.verdict} />
        </div>
        <p className="mt-1 text-muted">{[p.cuisine, p.neighborhood].filter(Boolean).join(' · ')}</p>
        {p.value && <p className="text-sm text-muted">{VALUE_LABEL[p.value]}</p>}
      </header>
      {p.note && <p className="border-l-2 border-accent pl-3 font-serif text-lg italic">{p.note}</p>}
      {p.orderThe.length > 0 && (
        <Block label="Order the">
          <ul className="flex flex-wrap gap-2">
            {p.orderThe.map((d) => (
              <li key={d} className="rounded-full border border-accent px-3 py-1.5 text-sm">{d}</li>
            ))}
          </ul>
        </Block>
      )}
      {p.bestFor.length > 0 && (
        <Block label="Best for">
          <ul className="flex flex-wrap gap-2">
            {p.bestFor.map((o) => (
              <li key={o} className="rounded-full border border-line px-3 py-1.5 text-sm">{o}</li>
            ))}
          </ul>
        </Block>
      )}
      {p.tip && <Block label="Tip">{p.tip}</Block>}
      {p.skipThe && <Block label="Skip the">{p.skipThe}</Block>}
      <a href={p.mapsUrl} target="_blank" rel="noreferrer" className="inline-block rounded-xl bg-accent px-5 py-3 font-medium text-accent-ink">
        Open in Google Maps
      </a>
      <p className="text-sm text-muted">{p.address}</p>
    </article>
  )
}

/** Public page: no account, no app chrome, never includes private notes. */
export default function SharePage() {
  const { token } = useParams()
  const q = useSharedPayload(token)
  const payload = q.data

  useEffect(() => {
    document.title = payload ? `${payload.title} · Plates` : 'Plates'
    return () => {
      document.title = 'Plates'
    }
  }, [payload])

  if (q.isLoading) return <p role="status" className="p-6 text-muted">Loading…</p>

  if (!payload) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center px-6 text-center">
        <h1 className="text-3xl font-semibold">This recommendation is no longer available</h1>
        <p className="mt-3 text-muted">The link may have been turned off by the person who shared it.</p>
      </main>
    )
  }

  return (
    <main className="mx-auto min-h-dvh max-w-xl px-5 pb-16 pt-10">
      <p className="text-sm font-medium tracking-wide text-accent">PLATES · A recommendation</p>
      {payload.kind === 'list' ? (
        <>
          <h1 className="mt-3 text-4xl font-semibold">{payload.title}</h1>
          <p className="mt-1 text-muted">{payload.places.length} {payload.places.length === 1 ? 'place' : 'places'}</p>
          <div className="mt-8 space-y-12 divide-y divide-line">
            {payload.places.map((p) => (
              <div key={p.name} className="pt-12 first:pt-0">
                <PlaceCard p={p} headingLevel={2} />
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-4">
          {payload.places[0] && <PlaceCard p={payload.places[0]} headingLevel={1} />}
        </div>
      )}
    </main>
  )
}
