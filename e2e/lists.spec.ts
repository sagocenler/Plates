import { expect, test } from '@playwright/test'

test('create a list, add restaurants from their pages, reorder, and keep a list note', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Email').fill('victoria@example.com')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Library', exact: true })).toBeVisible({ timeout: 20_000 })

  // Add two restaurants to a brand-new list from their pages.
  await page.getByLabel(/Search places/).fill('lilia')
  await page.getByRole('heading', { level: 2, name: 'Lilia' }).click()
  await page.getByText('Add to list').click()
  await page.getByLabel('New list name').fill('Best date night')
  await page.getByRole('button', { name: 'Create + add' }).click()
  await expect(page.getByRole('checkbox', { name: 'Best date night' })).toBeChecked()

  await page.getByRole('link', { name: '← Library' }).click()
  await page.getByLabel(/Search places/).fill('don angie')
  await page.getByRole('heading', { level: 2, name: 'Don Angie' }).click()
  await page.getByText('Add to list').click()
  await page.getByRole('checkbox', { name: 'Best date night' }).check()

  await page.getByRole('navigation').getByRole('link', { name: 'Lists' }).click()
  await expect(page.getByText('2 places')).toBeVisible()
  await page.getByRole('link', { name: /Best date night/ }).click()

  const names = page.locator('ol > li a span:first-child')
  await expect(names).toHaveText(['Lilia', 'Don Angie'])
  await page.getByRole('button', { name: 'Move Don Angie up' }).click()
  await expect(names).toHaveText(['Don Angie', 'Lilia'])

  await page.getByLabel('Note for this list').first().fill('Stuffed flatbread')
  await page.getByLabel('Note for this list').first().blur()
  await page.reload()
  await expect(page.getByLabel('Note for this list').first()).toHaveValue('Stuffed flatbread')
  await expect(names).toHaveText(['Don Angie', 'Lilia']) // order persisted
})
