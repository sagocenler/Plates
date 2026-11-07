import { useEffect, useState } from 'react'
import { useRepos } from '@/data/provider'

export default function PhotoThumb({ id, onRemove, size = 'h-20 w-20' }: { id: string; onRemove?: () => void; size?: string }) {
  const { photos } = useRepos()
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let revoked: string | null = null
    let alive = true
    photos.url(id).then((u) => {
      if (!alive) return u && URL.revokeObjectURL(u)
      revoked = u
      setUrl(u)
    })
    return () => {
      alive = false
      if (revoked) URL.revokeObjectURL(revoked)
    }
  }, [id, photos])
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-lg bg-line ${size}`}>
      {url && <img src={url} alt="" className="h-full w-full object-cover" />}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove photo"
          className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/60 text-xs text-white"
        >
          ✕
        </button>
      )}
    </div>
  )
}
