import { expect, test } from '@playwright/test'

test('map renders real pins and selecting one opens a card', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email').fill('victoria@example.com')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Library', exact: true })).toBeVisible({ timeout: 20_000 })
  await page.getByRole('link', { name: 'Map' }).click()
  const pins = page.locator('.maplibregl-marker')
  await expect(pins.first()).toBeVisible({ timeout: 20_000 })
  expect(await pins.count()).toBeGreaterThan(20)
  await page.getByRole('button', { name: /^Carbone, / }).dispatchEvent('click')
  await expect(page.getByRole('link', { name: /View restaurant/ })).toBeVisible()
})
