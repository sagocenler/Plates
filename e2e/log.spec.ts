import { expect, test } from '@playwright/test'

// 1x1 PNG
const PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==', 'base64')

test('a complete log (restaurant + verdict + photo + dish) takes under 60 seconds', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email').fill('victoria@example.com')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible()

  const start = Date.now()
  await page.getByRole('link', { name: 'Log' }).click()
  await page.getByLabel('Search restaurants').fill('taim')
  await page.getByRole('button', { name: /Taim/ }).click()
  await page.getByRole('button', { name: 'Loved it' }).first().click()
  await page.getByLabel('＋ Photo').setInputFiles({ name: 'dish.png', mimeType: 'image/png', buffer: PNG })
  await page.getByRole('button', { name: '+ Add a dish' }).click()
  await page.getByPlaceholder('Dish name').fill('Green falafel')
  await page.getByRole('button', { name: 'Save visit' }).click()
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible()
  expect(Date.now() - start).toBeLessThan(60_000)
})

test('suggests dishes previously logged at the same restaurant', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email').fill('victoria@example.com')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible()
  await page.waitForTimeout(1500) // let the dev seed finish
  await page.getByRole('link', { name: 'Log' }).click()
  await page.getByLabel('Search restaurants').fill('carota')
  await page.getByRole('button', { name: /Via Carota/ }).click()
  await expect(page.getByRole('button', { name: '+ Cacio e pepe' })).toBeVisible()
})
