/**
 * E2E — Flux de consultation et candidature aux offres (talent)
 * Couvre : browsing offres, page détail, candidature authentifiée
 */
import { test, expect } from '@playwright/test'

const TALENT_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL ?? 'e2e-talent@test.apebi.ma'
const TALENT_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? 'TestPassword123!'

test.describe('Offres d\'emploi — navigation publique', () => {

  test('La page des offres est accessible publiquement', async ({ page }) => {
    await page.goto('/offres')
    await expect(page).toHaveTitle(/Offres|APEBI/)
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('Les offres s\'affichent ou un message vide apparaît', async ({ page }) => {
    await page.goto('/offres')
    const jobCards = page.locator('article, [data-testid="job-card"]')
    const empty = page.getByText(/aucune offre|no results|pas d.offre/i)

    // At least one of: job cards or empty state
    const count = await jobCards.count()
    if (count === 0) {
      await expect(empty).toBeVisible()
    } else {
      expect(count).toBeGreaterThan(0)
    }
  })

  test('Les filtres sont présents sur la page offres', async ({ page }) => {
    await page.goto('/offres')
    // Expect filter inputs or selects
    const filterArea = page.getByRole('form').or(page.locator('form, [aria-label*="filtre"], [aria-label*="filter"]'))
    await expect(filterArea.first()).toBeVisible()
  })

})

test.describe('Offres d\'emploi — candidature (talent connecté)', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/connexion')
    await page.getByLabel(/email/i).fill(TALENT_EMAIL)
    await page.getByLabel(/mot de passe/i).fill(TALENT_PASSWORD)
    await page.getByRole('button', { name: /se connecter/i }).click()
    await page.waitForURL((url) => !url.pathname.includes('/connexion'), { timeout: 10000 })
  })

  test('Un talent peut accéder à la liste de ses candidatures', async ({ page }) => {
    await page.goto('/talent/candidatures')
    await expect(page.getByRole('main')).toBeVisible()
    // Should not redirect to login
    await expect(page).not.toHaveURL(/\/connexion/)
  })

  test('Un talent peut accéder à ses offres sauvegardées', async ({ page }) => {
    await page.goto('/talent/offres-sauvegardees')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page).not.toHaveURL(/\/connexion/)
  })

})
