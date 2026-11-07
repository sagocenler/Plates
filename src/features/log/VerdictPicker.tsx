import { VERDICTS, VERDICT_LABEL, type Verdict } from '@/domain/types'

export default function VerdictPicker({
  value,
  onChange,
  legend = 'Verdict',
  compact = false,
}: {
  value: Verdict | null
  onChange: (v: Verdict) => void
  legend?: string
  compact?: boolean
}) {
  return (
    <fieldset>
      <legend className={compact ? 'sr-only' : 'mb-2 text-sm font-medium'}>{legend}</legend>
      <div className={`grid gap-2 ${compact ? 'grid-cols-4' : 'grid-cols-2'}`}>
        {VERDICTS.map((v) => (
          <button
            key={v}
            type="button"
            aria-pressed={value === v}
            onClick={() => onChange(v)}
            className={`rounded-xl border text-center ${compact ? 'px-1 py-2 text-xs' : 'px-3 py-3.5 text-base'} ${
              value === v ? 'border-accent bg-accent font-medium text-accent-ink' : 'border-line bg-card'
            }`}
          >
            {VERDICT_LABEL[v]}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
