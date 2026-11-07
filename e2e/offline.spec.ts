import { expect, test } from '@playwright/test'

// Runs against the production build: the service worker is not active in dev.
test.use({ baseURL: 'http://localhost:4173' })

test('installed-app behaviour: reloads and logs a visit with no connection', async ({ page, context }) => {
  await page.goto('/')
  await page.getByLabel('Email').fill('victoria@example.com')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Welcome to Plates' })).toBeVisible()

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready
  })
  // Wait for the worker to control the page (precache complete).
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 20_000 }).catch(async () => {
    await page.reload()
    await page.waitForFunction(() => navigator.serviceWorker.controller !== null, undefined, { timeout: 20_000 })
  })

  await context.setOffline(true)
  await page.reload()
  await expect(page.getByRole('heading', { name: 'Welcome to Plates' })).toBeVisible()
  await expect(page.getByText("You're offline")).toBeVisible()

  // Log a visit while offline.
  await page.getByRole('navigation').getByRole('link', { name: 'Log' }).click()
  await page.getByLabel('Search restaurants').fill('taim')
  await page.getByRole('button', { name: /Taim/ }).click()
  await page.getByRole('button', { name: 'Loved it' }).first().click()
  await page.getByRole('button', { name: 'Save visit' }).click()
  await expect(page.getByRole('heading', { name: 'Library', exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { level: 2, name: 'Taim' })).toBeVisible()

  await context.setOffline(false)
  await expect(page.getByText("You're offline")).toHaveCount(0)
})

test('a half-filled log survives closing the app', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email').fill('victoria@example.com')
  await page.getByRole('button', { name: 'Continue' }).click()
  await page.getByRole('navigation').getByRole('link', { name: 'Log' }).click()
  await page.getByLabel('Search restaurants').fill('lilia')
  await page.getByRole('button', { name: /Lilia/ }).click()
  await page.getByRole('button', { name: 'Liked it' }).first().click()
  await page.getByRole('button', { name: '+ Add a dish' }).click()
  await page.getByPlaceholder('Dish name').fill('Agnolotti')
  await page.waitForTimeout(700) // autosave debounce

  await page.reload()
  await expect(page.getByText(/Draft restored/)).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Lilia' })).toBeVisible()
  await expect(page.getByPlaceholder('Dish name')).toHaveValue('Agnolotti')
})
