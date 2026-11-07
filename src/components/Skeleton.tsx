/** Placeholder shapes while data loads. Announced once to screen readers, hidden visually from them otherwise. */
export function Skeleton({ className = '' }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded-lg bg-line motion-reduce:animate-none ${className}`} />
}

export function ListSkeleton({ rows = 5, label = 'Loading' }: { rows?: number; label?: string }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}…</span>
      <Skeleton className="mt-2 h-9 w-40" />
      <Skeleton className="mt-6 h-12 w-full" />
      <ul className="mt-6 space-y-5">
        {Array.from({ length: rows }, (_, i) => (
          <li key={i} className="flex gap-4">
            <Skeleton className="h-20 w-20 shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function PageSkeleton({ label = 'Loading' }: { label?: string }) {
  return (
    <div role="status" aria-busy="true">
      <span className="sr-only">{label}…</span>
      <Skeleton className="h-4 w-20" />
      <Skeleton className="mt-4 h-10 w-3/4" />
      <Skeleton className="mt-3 h-4 w-1/2" />
      <Skeleton className="mt-8 h-32 w-full" />
      <Skeleton className="mt-4 h-32 w-full" />
    </div>
  )
}
