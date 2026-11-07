export default function QueryError({ what, onRetry }: { what: string; onRetry: () => void }) {
  return (
    <div role="alert" className="pt-10 text-center">
      <h1 className="text-2xl font-semibold">We couldn't load {what}</h1>
      <p className="mx-auto mt-2 max-w-xs text-muted">Your data is safe on this device. Give it another try.</p>
      <button type="button" onClick={onRetry} className="mt-5 min-h-11 rounded-xl bg-accent px-6 font-medium text-accent-ink">
        Try again
      </button>
    </div>
  )
}
