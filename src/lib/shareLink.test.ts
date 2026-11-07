import { vi } from 'vitest'
import { shareOrCopy, shareUrl } from './shareLink'

const data = { title: 'Lilia', url: 'https://x.test/s/abc' }
const setNav = (props: Record<string, unknown>) => {
  for (const k of ['share', 'canShare', 'clipboard']) Object.defineProperty(navigator, k, { value: undefined, configurable: true })
  for (const [k, v] of Object.entries(props)) Object.defineProperty(navigator, k, { value: v, configurable: true })
}

describe('shareOrCopy', () => {
  it('uses the native share sheet when present', async () => {
    const share = vi.fn().mockResolvedValue(undefined)
    setNav({ share })
    expect(await shareOrCopy(data)).toBe('shared')
    expect(share).toHaveBeenCalledWith(data)
  })
  it('reports a dismissed share sheet as cancelled, without copying', async () => {
    const writeText = vi.fn()
    setNav({ share: vi.fn().mockRejectedValue(new DOMException('x', 'AbortError')), clipboard: { writeText } })
    expect(await shareOrCopy(data)).toBe('cancelled')
    expect(writeText).not.toHaveBeenCalled()
  })
  it('falls back to copying the link', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined)
    setNav({ clipboard: { writeText } })
    expect(await shareOrCopy(data)).toBe('copied')
    expect(writeText).toHaveBeenCalledWith(data.url)
  })
  it('falls back to copy when sharing errors, and reports failure if copy fails', async () => {
    setNav({ share: vi.fn().mockRejectedValue(new Error('nope')), clipboard: { writeText: vi.fn().mockRejectedValue(new Error('denied')) } })
    expect(await shareOrCopy(data)).toBe('failed')
  })
  it('builds public URLs', () => {
    expect(shareUrl('abc', 'https://plates.app')).toBe('https://plates.app/s/abc')
  })
})
