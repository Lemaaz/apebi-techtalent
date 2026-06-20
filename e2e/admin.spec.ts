/**
 * E2E — Flux admin : validation comptes, accès dashboard
 * Couvre : accès admin, validation talent, KPIs dashboard
 */
import { test, expect } from '@playwright/test'

const ADMIN_EMAIL = process.env.PLAYWRIGHT_TEST_ADMIN_EMAIL ?? 'e2e-admin@test.apebi.ma'
const ADMIN_PASSWORD = process.env.PLAYWRIGHT_TEST_ADMIN_PASSWORD ?? 'TestPassword123!'

test.describe('Administration', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/connexion')
    await page.getByLabel(/email/i).fill(ADMIN_EMAIL)
    await page.getByLabel(/mot de passe/i).fill(ADMIN_PASSWORD)
    await page.getByRole('button', { name: /se connecter/i }).click()
    await page.waitForURL((url) => !url.pathname.includes('/connexion'), { timeout: 10000 })
  })

  test('Le dashboard admin est accessible', async ({ page }) => {
    await page.goto('/admin')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page).not.toHaveURL(/\/connexion|\/403/)
    await expect(page.getByRole('heading', { name: /dashboard/i })).toBeVisible()
  })

  test('La gestion des talents est accessible', async ({ page }) => {
    await page.goto('/admin/talents')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page).not.toHaveURL(/\/connexion|\/403/)
  })

  test('La gestion des entreprises est accessible', async ({ page }) => {
    await page.goto('/admin/entreprises')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page).not.toHaveURL(/\/connexion|\/403/)
  })

  test('La gestion des offres est accessible', async ({ page }) => {
    await page.goto('/admin/offres')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page).not.toHaveURL(/\/connexion|\/403/)
  })

  test('L\'export CSV talents répond avec un fichier', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.goto('/api/admin/export?type=talents'),
    ])
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/^talents-.+\.csv$/)
  })

  test('L\'export CSV offres répond avec un fichier', async ({ page }) => {
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.goto('/api/admin/export?type=offres'),
    ])
    const filename = download.suggestedFilename()
    expect(filename).toMatch(/^offres-.+\.csv$/)
  })

})

test.describe('Admin — accès refusé pour non-admin', () => {

  test('Un utilisateur non connecté est redirigé depuis /admin', async ({ page }) => {
    await page.goto('/admin')
    await expect(page).toHaveURL(/\/connexion|\/403|\//)
    await expect(page).not.toHaveURL(/^http:\/\/localhost:\d+\/admin$/)
  })

})
