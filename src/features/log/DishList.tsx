import { useId } from 'react'
import { VERDICT_LABEL, VERDICTS, type Verdict } from '@/domain/types'
import { newDish, type DishDraft } from './formState'
import PhotoAdder from './PhotoAdder'
import PhotoThumb from './PhotoThumb'

export default function DishList({
  dishes,
  suggestions,
  onChange,
}: {
  dishes: DishDraft[]
  /** Previously logged dish names at this restaurant. */
  suggestions: string[]
  onChange: (d: DishDraft[]) => void
}) {
  const listId = useId()
  const update = (key: string, patch: Partial<DishDraft>) =>
    onChange(dishes.map((d) => (d.key === key ? { ...d, ...patch } : d)))

  return (
    <section aria-labelledby={`${listId}-h`}>
      <h2 id={`${listId}-h`} className="mb-2 text-sm font-medium">Dishes</h2>

      {suggestions.length > 0 && (
        <div className="mb-3">
          <p className="mb-1.5 text-xs text-muted">Ordered here before</p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => onChange([...dishes.filter((d) => d.name.trim()), { ...newDish(), name: s }])}
                className="rounded-full border border-line bg-card px-3 py-1.5 text-sm"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>
      )}

      <datalist id={`${listId}-dl`}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>

      <ul className="space-y-3">
        {dishes.map((d, i) => (
          <li key={d.key} className="rounded-xl border border-line bg-card p-3">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <label htmlFor={`${d.key}-n`} className="sr-only">Dish {i + 1} name</label>
                <input
                  id={`${d.key}-n`}
                  list={`${listId}-dl`}
                  value={d.name}
                  onChange={(e) => update(d.key, { name: e.target.value })}
                  placeholder="Dish name"
                  autoComplete="off"
                  className="w-full bg-transparent text-base font-medium outline-none"
                />
              </div>
              {d.photoId ? (
                <PhotoThumb id={d.photoId} size="h-12 w-12" onRemove={() => update(d.key, { photoId: null })} />
              ) : (
                <PhotoAdder label="📷" className="h-12 w-12" onAdded={([id]) => update(d.key, { photoId: id ?? null })} />
              )}
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <div role="group" aria-label={`Dish ${i + 1} verdict`} className="flex gap-1">
                {VERDICTS.map((v: Verdict) => (
                  <button
                    key={v}
                    type="button"
                    aria-pressed={d.verdict === v}
                    onClick={() => update(d.key, { verdict: d.verdict === v ? null : v })}
                    className={`rounded-lg border px-2 py-1 text-xs ${d.verdict === v ? 'border-accent bg-accent text-accent-ink' : 'border-line'}`}
                  >
                    {VERDICT_LABEL[v]}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={d.orderAgain}
                  onChange={(e) => update(d.key, { orderAgain: e.target.checked })}
                  className="h-4 w-4 accent-[var(--color-accent)]"
                />
                Order again
              </label>
              <button
                type="button"
                onClick={() => onChange(dishes.filter((x) => x.key !== d.key))}
                className="text-sm text-muted"
                aria-label={`Remove dish ${i + 1}`}
              >
                Remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <button
        type="button"
        onClick={() => onChange([...dishes, newDish()])}
        className="mt-3 w-full rounded-xl border border-dashed border-line py-3 text-sm text-muted"
      >
        + Add a dish
      </button>
    </section>
  )
}
