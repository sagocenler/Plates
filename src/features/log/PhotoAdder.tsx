import { useRef, useState } from 'react'
import { useRepos } from '@/data/provider'
import { compressPhoto } from '@/lib/photos'

export default function PhotoAdder({
  onAdded,
  label,
  multiple = false,
  className = '',
}: {
  onAdded: (ids: string[]) => void
  label: string
  multiple?: boolean
  className?: string
}) {
  const { photos } = useRepos()
  const input = useRef<HTMLInputElement>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handle = async (files: FileList | null) => {
    if (!files?.length) return
    setBusy(true)
    setError(null)
    try {
      const ids: string[] = []
      for (const f of Array.from(files)) ids.push(await photos.put(await compressPhoto(f)))
      onAdded(ids)
    } catch {
      setError('Could not add that photo. Try another.')
    } finally {
      setBusy(false)
      if (input.current) input.current.value = ''
    }
  }

  return (
    <>
      <input
        ref={input}
        type="file"
        accept="image/*"
        multiple={multiple}
        className="sr-only"
        aria-label={label}
        onChange={(e) => void handle(e.target.files)}
      />
      <button
        type="button"
        onClick={() => input.current?.click()}
        disabled={busy}
        className={`grid place-items-center rounded-lg border border-dashed border-line text-sm text-muted ${className}`}
      >
        {busy ? 'Adding…' : label}
      </button>
      {error && <p role="alert" className="text-sm text-accent">{error}</p>}
    </>
  )
}
