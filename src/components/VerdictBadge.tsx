import { VERDICT_LABEL, type Verdict } from '@/domain/types'

const STYLE: Record<Verdict, string> = {
  loved: 'bg-accent text-accent-ink',
  liked: 'border border-accent text-accent',
  fine: 'border border-line text-muted',
  skip: 'border border-line text-muted line-through',
}

export default function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return <span className={`inline-block shrink-0 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${STYLE[verdict]}`}>{VERDICT_LABEL[verdict]}</span>
}
