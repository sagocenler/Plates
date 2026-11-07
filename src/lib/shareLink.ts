export type ShareOutcome = 'shared' | 'copied' | 'cancelled' | 'failed'

export const shareUrl = (token: string, origin = window.location.origin) => `${origin}/s/${token}`

/** Native share sheet when available (iOS/Android), otherwise copy the link. */
export async function shareOrCopy(data: { title: string; text?: string; url: string }): Promise<ShareOutcome> {
  if (typeof navigator.share === 'function' && (typeof navigator.canShare !== 'function' || navigator.canShare(data))) {
    try {
      await navigator.share(data)
      return 'shared'
    } catch (e) {
      if (e instanceof DOMException && e.name === 'AbortError') return 'cancelled'
      // fall through to copy
    }
  }
  try {
    await navigator.clipboard.writeText(data.url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
