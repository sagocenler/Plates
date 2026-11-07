import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { useRepos } from '@/data/provider'
import { newShareToken } from '@/domain/share'
import type { Id, Share, ShareKind } from '@/domain/types'
import { useAuth } from '@/features/auth/useAuth'
import { shareOrCopy, shareUrl } from '@/lib/shareLink'

const MESSAGE = { shared: 'Shared', copied: 'Link copied', cancelled: '', failed: 'Could not share. Copy the link below.' } as const

/** Tap 1: open. Tap 2: "Share link" (creates the link, opens the share sheet or copies). */
export default function SharePanel({ kind, targetId, title }: { kind: ShareKind; targetId: Id; title: string }) {
  const { shares } = useRepos()
  const { user } = useAuth()
  const qc = useQueryClient()
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('')
  const [pendingOpts, setPendingOpts] = useState({ showPhotos: true, showTips: true })

  const existing = useQuery({
    queryKey: ['shares', targetId],
    queryFn: async () => (await shares.forTarget(targetId)).filter((s) => !s.revokedAt).sort((a, b) => b.createdAt.localeCompare(a.createdAt))[0] ?? null,
  })
  const active: Share | null = existing.data ?? null
  const opts = active ?? pendingOpts
  const refresh = () => qc.invalidateQueries({ queryKey: ['shares', targetId] })

  const setOpt = async (patch: Partial<typeof pendingOpts>) => {
    if (active) {
      await shares.update({ ...active, ...patch })
      await refresh()
    } else setPendingOpts((o) => ({ ...o, ...patch }))
  }

  const share = async () => {
    let s = active
    if (!s) {
      s = await shares.create({
        token: newShareToken(),
        userId: user?.id ?? 'local-user',
        kind,
        targetId,
        revokedAt: null,
        showPhotos: pendingOpts.showPhotos,
        showTips: pendingOpts.showTips,
        createdAt: new Date().toISOString(),
      })
      await refresh()
    }
    const outcome = await shareOrCopy({ title: `${title} · Plates`, text: `My recommendation: ${title}`, url: shareUrl(s.token) })
    setStatus(MESSAGE[outcome])
  }

  const revoke = async () => {
    if (!active) return
    await shares.revoke(active.token)
    setStatus('Link turned off')
    await refresh()
  }

  // Fragment so the button sits in the parent's button row and the panel wraps to its own full-width row.
  return (
    <>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="rounded-xl border border-line px-4 py-2.5 text-sm"
      >
        {active ? 'Shared' : 'Share'}
      </button>

      {open && (
        <div role="group" aria-label="Share options" className="mt-1 w-full basis-full space-y-3 rounded-xl border border-line bg-card p-4">
          <p className="text-sm text-muted">Anyone with the link can view this, no account needed. Your private notes are never included.</p>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={opts.showPhotos} onChange={(e) => void setOpt({ showPhotos: e.target.checked })} className="h-4 w-4 accent-[var(--color-accent)]" />
            Include photos
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={opts.showTips} onChange={(e) => void setOpt({ showTips: e.target.checked })} className="h-4 w-4 accent-[var(--color-accent)]" />
            Include tips and "skip the"
          </label>
          {active && (
            <input readOnly aria-label="Share link" value={shareUrl(active.token)} onFocus={(e) => e.currentTarget.select()} className="w-full rounded-lg border border-line bg-paper px-3 py-2 text-sm" />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={() => void share()} className="rounded-xl bg-accent px-4 py-2.5 text-sm font-medium text-accent-ink">
              Share link
            </button>
            {active && (
              <button type="button" onClick={() => void revoke()} className="rounded-xl border border-line px-4 py-2.5 text-sm">
                Turn off link
              </button>
            )}
          </div>
          <p role="status" className="min-h-5 text-sm text-muted">{status}</p>
          <p className="text-xs text-muted">Development note: links only open in this browser until the backend is connected.</p>
        </div>
      )}
    </>
  )
}
