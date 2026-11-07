import { expect, test } from '@playwright/test'

/**
 * Smoke test against the REAL Supabase project. Skipped unless you provide a test account:
 *   E2E_SUPABASE_EMAIL=you+test@example.com E2E_SUPABASE_PASSWORD=... npm run e2e -- supabase
 * It signs in (sign-up first if the account does not exist yet), logs a visit, lists it, shares it,
 * opens the link signed-out, checks the private note is absent, then revokes.
 */
const email = process.env.E2E_SUPABASE_EMAIL
const password = process.env.E2E_SUPABASE_PASSWORD
test.skip(!email || !password, 'set E2E_SUPABASE_EMAIL and E2E_SUPABASE_PASSWORD to run against Supabase')
test.use({ baseURL: 'http://localhost:5175' })

test('real backend: sign in, log, share, open signed-out, revoke', async ({ page, browser }) => {
  await page.goto('/')
  await page.getByLabel('Email').fill(email ?? '')
  await page.getByLabel('Password').fill(password ?? '')
  await page.getByRole('button', { name: 'Sign in' }).click()
  await expect(page.getByRole('navigation', { name: 'Primary' })).toBeVisible({ timeout: 20_000 })

  await page.getByRole('navigation').getByRole('link', { name: 'Log' }).click()
  await page.getByLabel('Search restaurants').fill('taim')
  await page.getByRole('button', { name: /Taim/ }).click()
  await page.getByRole('button', { name: 'Loved it' }).first().click()
  await page.getByText('More details').click()
  await page.getByLabel(/Private note/).fill('E2E-SECRET-NOTE')
  await page.getByRole('button', { name: 'Save visit' }).click()
  await expect(page.getByRole('heading', { level: 2, name: 'Taim' })).toBeVisible({ timeout: 20_000 })

  await page.getByRole('heading', { level: 2, name: 'Taim' }).click()
  await expect(page.getByText('E2E-SECRET-NOTE')).toBeVisible()
  await page.getByRole('button', { name: 'Share', exact: true }).click()
  await page.getByRole('button', { name: 'Share link' }).click()
  const link = await page.getByLabel('Share link').inputValue()

  const anon = await (await browser.newContext()).newPage() // fresh context: no session at all
  await anon.goto(link)
  await expect(anon.getByRole('heading', { level: 1, name: 'Taim' })).toBeVisible({ timeout: 20_000 })
  expect(await anon.locator('body').innerText()).not.toContain('E2E-SECRET-NOTE')

  await page.getByRole('button', { name: 'Turn off link' }).click()
  await expect(page.getByText('Link turned off')).toBeVisible()
  await anon.reload()
  await expect(anon.getByRole('heading', { name: /no longer available/ })).toBeVisible()

  // cleanup: delete nothing automatically; remove the test visit from the library UI if you want a clean slate
})
