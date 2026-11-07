import AxeBuilder from '@axe-core/playwright'
import { expect, test, type Page } from '@playwright/test'

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']

async function audit(page: Page, label: string) {
  const { violations } = await new AxeBuilder({ page }).withTags(TAGS).analyze()
  const summary = violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(' | ')}`)
  expect(summary, `${label} accessibility violations`).toEqual([])
}

for (const scheme of ['light', 'dark'] as const) {
  test(`main screens have no axe violations (${scheme})`, async ({ page }) => {
    await page.emulateMedia({ colorScheme: scheme })
    await page.goto('/')
    await audit(page, 'login')
    await page.getByLabel('Email').fill('victoria@example.com')
    await page.getByRole('button', { name: 'Continue' }).click()
    await expect(page.getByRole('heading', { name: 'Library', exact: true })).toBeVisible({ timeout: 20_000 })
    await audit(page, 'library')

    await page.getByRole('button', { name: 'Filters' }).click()
    await audit(page, 'library with filters')

    await page.getByRole('heading', { level: 2, name: 'Via Carota' }).click()
    await expect(page.getByRole('heading', { level: 1, name: 'Via Carota' })).toBeVisible()
    await page.getByRole('button', { name: 'Share', exact: true }).click()
    await page.getByText('Add to list').click()
    await audit(page, 'restaurant page')

    await page.getByRole('navigation').getByRole('link', { name: 'Log' }).click()
    await audit(page, 'log: choose restaurant')
    await page.getByLabel('Search restaurants').fill('taim')
    await page.getByRole('button', { name: /Taim/ }).click()
    await page.getByRole('button', { name: '+ Add a dish' }).click()
    await page.getByText("Why I'd recommend it").click()
    await audit(page, 'log form')

    await page.getByRole('navigation').getByRole('link', { name: 'Lists' }).click()
    await page.getByLabel('New list name').fill('Favorites')
    await page.getByRole('button', { name: 'Create' }).click()
    await page.getByRole('link', { name: /Favorites/ }).click()
    await audit(page, 'list detail')

    await page.goto('/welcome')
    await audit(page, 'quick add')

    await page.goto('/want')
    await page.getByLabel('Search restaurants to add').fill('taim')
    await page.getByRole('button', { name: /Want to try Taim/ }).click()
    await expect(page.getByRole('heading', { level: 2, name: 'Taim' })).toBeVisible()
    await audit(page, 'want to try')

    await page.getByRole('navigation').getByRole('link', { name: 'Map' }).click()
    await expect(page.locator('.maplibregl-marker').first()).toBeVisible({ timeout: 20_000 })
    await audit(page, 'map')
  })
}
