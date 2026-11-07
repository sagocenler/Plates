import { expect, test } from '@playwright/test'

test('share in two taps, recipient view hides private notes and needs no sign-in, revoke shows friendly page', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write'])
  await page.goto('/')
  await page.getByLabel('Email').fill('victoria@example.com')
  await page.getByRole('button', { name: 'Continue' }).click()
  await expect(page.getByRole('heading', { name: 'Library', exact: true })).toBeVisible({ timeout: 20_000 })

  await page.getByLabel(/Search places/).fill('via carota')
  await page.getByRole('heading', { level: 2, name: 'Via Carota' }).click()
  await expect(page.getByText('Anniversary dinner')).toBeVisible() // owner sees their private note

  await page.getByRole('button', { name: 'Share', exact: true }).click() // tap 1
  await page.getByRole('button', { name: 'Share link' }).click() // tap 2
  const link = await page.getByLabel('Share link').inputValue()
  expect(link).toMatch(/\/s\/[0-9a-f]{32}$/)

  // Recipient: public page, no app chrome, no private note.
  const recipient = await context.newPage()
  await recipient.goto(link)
  await expect(recipient.getByRole('heading', { level: 1, name: 'Via Carota' })).toBeVisible()
  await expect(recipient.getByRole('link', { name: 'Open in Google Maps' })).toBeVisible()
  await expect(recipient.getByRole('navigation')).toHaveCount(0)
  expect(await recipient.locator('body').innerText()).not.toContain('Anniversary dinner')

  // Revoke, then the link is gone.
  await page.getByRole('button', { name: 'Turn off link' }).click()
  await expect(page.getByText('Link turned off')).toBeVisible()
  await recipient.reload()
  await expect(recipient.getByRole('heading', { name: /no longer available/ })).toBeVisible()
})
