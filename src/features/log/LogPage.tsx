import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { useRepos } from '@/data/provider'
import { usePlaces, useVisits } from '@/data/queries'
import { dishSuggestions } from '@/domain/dishes'
import { SYSTEM_OCCASIONS, VALUES, VALUE_LABEL, type Place } from '@/domain/types'
import { useAuth } from '@/features/auth/useAuth'
import DishList from './DishList'
import { canSave, emptyForm, formToVisit, toggleOccasion, type LogForm } from './formState'
import PhotoAdder from './PhotoAdder'
import PhotoThumb from './PhotoThumb'
import PlacePicker from './PlacePicker'
import VerdictPicker from './VerdictPicker'

const field = 'w-full rounded-xl border border-line bg-card px-4 py-3 text-base'

export default function LogPage() {
  const location = useLocation()
  // "Log another visit" from a restaurant page arrives with the place preselected.
  const preset = (location.state as { place?: Place } | null)?.place
  const [form, setForm] = useState<LogForm>(() => {
    const f = emptyForm()
    if (!preset) return f
    const { id: _id, snapshotAt: _s, ...snapshot } = preset
    return { ...f, place: snapshot }
  })
  const [customTag, setCustomTag] = useState('')
  const repos = useRepos()
  const { user } = useAuth()
  const qc = useQueryClient()
  const navigate = useNavigate()
  const visits = useVisits()
  const patch = (p: Partial<LogForm>) => setForm((f) => ({ ...f, ...p }))

  // A place logged before (matched by Google id) lets us suggest dishes ordered there.
  const places = usePlaces()
  const placeId = form.place ? places.data?.find((p) => p.googlePlaceId === form.place?.googlePlaceId)?.id ?? null : null

  const typed = form.dishes.map((d) => d.name.toLowerCase().trim())
  const suggestions = placeId
    ? dishSuggestions(visits.data ?? [], placeId, '', 8).filter((s) => !typed.includes(s.toLowerCase()))
    : []

  const save = useMutation({
    mutationFn: async () => {
      if (!form.place) throw new Error('Pick a restaurant')
      const place = await repos.places.upsert(form.place)
      return repos.visits.save(formToVisit(form, place.id, user?.id ?? 'local-user'))
    },
    onSuccess: async () => {
      await Promise.all([qc.invalidateQueries({ queryKey: ['visits'] }), qc.invalidateQueries({ queryKey: ['places'] })])
      navigate('/library')
    },
  })

  if (!form.place) return <PlacePicker onPick={(place) => patch({ place })} />

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (canSave(form)) save.mutate()
  }

  const customOccasions = form.occasions.filter((o) => !(SYSTEM_OCCASIONS as readonly string[]).includes(o))

  return (
    <form onSubmit={submit} className="space-y-7">
      <header>
        <button type="button" onClick={() => patch({ place: null })} className="text-sm text-muted">← Change restaurant</button>
        <h1 className="mt-2 text-3xl font-semibold">{form.place.name}</h1>
        <p className="text-sm text-muted">{[form.place.cuisine, form.place.neighborhood].filter(Boolean).join(' · ')}</p>
      </header>

      <VerdictPicker value={form.verdict} onChange={(verdict) => patch({ verdict })} legend="How was it?" />

      <section aria-label="Photos">
        <div className="flex gap-2 overflow-x-auto">
          {form.photoIds.map((id) => (
            <PhotoThumb key={id} id={id} onRemove={() => patch({ photoIds: form.photoIds.filter((x) => x !== id) })} />
          ))}
          <PhotoAdder
            label="＋ Photo"
            multiple
            className="h-20 w-20 shrink-0"
            onAdded={(ids) => patch({ photoIds: [...form.photoIds, ...ids] })}
          />
        </div>
      </section>

      <DishList dishes={form.dishes} suggestions={suggestions} onChange={(dishes) => patch({ dishes })} />

      <details className="rounded-xl border border-line bg-card p-4">
        <summary className="cursor-pointer font-medium">Why I'd recommend it</summary>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="order" className="mb-1 block text-sm">Order the…</label>
            <input id="order" className={field} value={form.orderThe} onChange={(e) => patch({ orderThe: e.target.value })} />
          </div>
          <div>
            <label htmlFor="skip" className="mb-1 block text-sm">Skip the…</label>
            <input id="skip" className={field} value={form.skipThe} onChange={(e) => patch({ skipThe: e.target.value })} />
          </div>
          <div>
            <label htmlFor="tip" className="mb-1 block text-sm">Tip (book ahead, go early…)</label>
            <input id="tip" className={field} value={form.tip} onChange={(e) => patch({ tip: e.target.value })} />
          </div>
          <fieldset>
            <legend className="mb-2 text-sm">Best for</legend>
            <div className="flex flex-wrap gap-2">
              {[...SYSTEM_OCCASIONS, ...customOccasions].map((o) => (
                <button
                  key={o}
                  type="button"
                  aria-pressed={form.occasions.includes(o)}
                  onClick={() => patch({ occasions: toggleOccasion(form.occasions, o) })}
                  className={`rounded-full border px-3 py-1.5 text-sm ${form.occasions.includes(o) ? 'border-accent bg-accent text-accent-ink' : 'border-line'}`}
                >
                  {o}
                </button>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <label htmlFor="custom-tag" className="sr-only">Custom tag</label>
              <input
                id="custom-tag"
                className={field}
                placeholder="Custom tag"
                value={customTag}
                onChange={(e) => setCustomTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    patch({ occasions: form.occasions.includes(customTag.trim().toLowerCase()) ? form.occasions : toggleOccasion(form.occasions, customTag) })
                    setCustomTag('')
                  }
                }}
              />
              <button
                type="button"
                className="shrink-0 rounded-xl border border-line px-4"
                onClick={() => {
                  patch({ occasions: form.occasions.includes(customTag.trim().toLowerCase()) ? form.occasions : toggleOccasion(form.occasions, customTag) })
                  setCustomTag('')
                }}
              >
                Add
              </button>
            </div>
          </fieldset>
        </div>
      </details>

      <details className="rounded-xl border border-line bg-card p-4">
        <summary className="cursor-pointer font-medium">More details</summary>
        <div className="mt-4 space-y-4">
          <div>
            <label htmlFor="date" className="mb-1 block text-sm">Date</label>
            <input id="date" type="date" className={field} value={form.visitedOn} onChange={(e) => patch({ visitedOn: e.target.value })} />
          </div>
          <fieldset>
            <legend className="mb-2 text-sm">Value for money</legend>
            <div className="flex gap-2">
              {VALUES.map((v) => (
                <button
                  key={v}
                  type="button"
                  aria-pressed={form.value === v}
                  onClick={() => patch({ value: form.value === v ? null : v })}
                  className={`flex-1 rounded-xl border px-2 py-2.5 text-sm ${form.value === v ? 'border-accent bg-accent text-accent-ink' : 'border-line'}`}
                >
                  {VALUE_LABEL[v]}
                </button>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor="private" className="mb-1 block text-sm">Private note (never shared)</label>
            <textarea id="private" rows={3} className={field} value={form.privateNote} onChange={(e) => patch({ privateNote: e.target.value })} />
          </div>
        </div>
      </details>

      {save.isError && <p role="alert" className="text-accent">Couldn't save. Please try again.</p>}

      <div className="sticky bottom-20 z-[5]">
        <button
          type="submit"
          disabled={!canSave(form) || save.isPending}
          className="w-full rounded-xl bg-accent px-4 py-4 text-base font-medium text-accent-ink shadow-lg disabled:opacity-40"
        >
          {save.isPending ? 'Saving…' : form.verdict ? 'Save visit' : 'Pick a verdict to save'}
        </button>
      </div>
    </form>
  )
}
