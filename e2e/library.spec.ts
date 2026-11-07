import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email').fill('victoria@example.com')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Library', exact: true })).toBeVisible({ timeout: 20_000 })
})

test('Loved it + order again is one tap, and Back keeps the filter', async ({ page }) => {
  const all = await page.getByRole('heading', { level: 2 }).count()
  await page.getByRole('button', { name: 'Loved it + order again' }).click()
  await expect(page.getByRole('button', { name: 'Loved it + order again' })).toHaveAttribute('aria-pressed', 'true')
  const filtered = await page.getByRole('heading', { level: 2 }).count()
  expect(filtered).toBeGreaterThan(0)
  expect(filtered).toBeLessThan(all)

  await page.getByRole('heading', { level: 2 }).first().click()
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  await page.getByRole('link', { name: '← Library' }).click()
  await expect(page.getByRole('button', { name: 'Loved it + order again' })).toHaveAttribute('aria-pressed', 'true')
})

test('search finds a place by dish name', async ({ page }) => {
  await page.getByLabel(/Search places/).fill('cumin')
  await expect(page.getByRole('heading', { level: 2 })).toHaveCount(1)
  await expect(page.getByRole('heading', { level: 2 })).toContainText("Xi'an")
})
