import { expect, test } from '@playwright/test'

test('want-to-try: save a place, go, and it moves into the library', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email').fill('victoria@example.com')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Library', exact: true })).toBeVisible({ timeout: 20_000 })

  await page.getByRole('navigation').getByRole('link', { name: 'Lists' }).click()
  await page.getByRole('link', { name: /Want to try/ }).click()
  await page.getByLabel('Search restaurants to add').fill('mamoun')
  await page.getByRole('button', { name: /Want to try Mamoun/ }).click()
  await expect(page.getByRole('heading', { level: 2, name: "Mamoun's Falafel" })).toBeVisible()

  // Not a visit yet: absent from the library.
  await page.getByRole('navigation').getByRole('link', { name: 'Library' }).click()
  await page.getByLabel(/Search places/).fill('mamoun')
  await expect(page.getByText('Nothing matches')).toBeVisible()

  await page.getByRole('navigation').getByRole('link', { name: 'Lists' }).click()
  await page.getByRole('link', { name: /Want to try/ }).click()
  await page.getByRole('button', { name: /I went/ }).click()
  await page.getByRole('button', { name: 'Liked it' }).first().click()
  await page.getByRole('button', { name: 'Save visit' }).click()

  await expect(page.getByRole('heading', { name: 'Library', exact: true })).toBeVisible()
  await page.getByLabel(/Search places/).fill('mamoun')
  await expect(page.getByRole('heading', { level: 2, name: "Mamoun's Falafel" })).toBeVisible()

  await page.getByRole('navigation').getByRole('link', { name: 'Lists' }).click()
  await page.getByRole('link', { name: /Want to try/ }).click()
  await expect(page.getByText(/Nothing here yet/)).toBeVisible()
})
