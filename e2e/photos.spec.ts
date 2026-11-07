import { expect, test } from '@playwright/test'

test('photos are resized and compressed in the browser before they are stored', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email').fill('victoria@example.com')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Library', exact: true })).toBeVisible({ timeout: 20_000 })
  await page.getByRole('navigation').getByRole('link', { name: 'Log' }).click()
  await page.getByLabel('Search restaurants').fill('taim')
  await page.getByRole('button', { name: /Taim/ }).click()

  // A deliberately huge image (3200x2400 PNG, like a fresh phone photo).
  await page.evaluate(async () => {
    const c = document.createElement('canvas')
    c.width = 3200
    c.height = 2400
    const ctx = c.getContext('2d')
    if (!ctx) throw new Error('no 2d context')
    for (let i = 0; i < 600; i++) {
      ctx.fillStyle = `hsl(${(i * 37) % 360} 70% ${30 + (i % 40)}%)`
      ctx.fillRect(Math.random() * 3200, Math.random() * 2400, 260, 260)
    }
    const blob = await new Promise<Blob>((res) => c.toBlob((b) => res(b as Blob), 'image/png'))
    const dt = new DataTransfer()
    dt.items.add(new File([blob], 'big.png', { type: 'image/png' }))
    const input = document.querySelector<HTMLInputElement>('input[aria-label="＋ Photo"]')
    if (!input) throw new Error('photo input missing')
    input.files = dt.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })

  await expect(page.getByRole('button', { name: 'Remove photo' })).toBeVisible()
  const stored = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((res, rej) => {
      const r = indexedDB.open('plates')
      r.onsuccess = () => res(r.result)
      r.onerror = () => rej(r.error)
    })
    const rows = await new Promise<{ blob: Blob }[]>((res, rej) => {
      const q = db.transaction('photos').objectStore('photos').getAll()
      q.onsuccess = () => res(q.result as { blob: Blob }[])
      q.onerror = () => rej(q.error)
    })
    const last = rows[rows.length - 1]
    if (!last) throw new Error('no photo stored')
    const bmp = await createImageBitmap(last.blob)
    return { bytes: last.blob.size, w: bmp.width, h: bmp.height, type: last.blob.type }
  })

  // 3200x2400 in -> long edge capped at 1600 (aspect ratio kept), re-encoded as JPEG.
  expect(Math.max(stored.w, stored.h)).toBeLessThanOrEqual(1600)
  expect(stored.w / stored.h).toBeCloseTo(3200 / 2400, 1)
  expect(stored.type).toBe('image/jpeg')
  expect(stored.bytes).toBeLessThan(1_000_000)
})
