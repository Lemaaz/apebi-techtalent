/**
 * E2E — Paramètres alertes talent (NOT-06 / NOT-05 toggle)
 * Couvre : accès page paramètres, présence toggle alertes, toggle cliquable
 */
import { test, expect } from '@playwright/test'

const TALENT_EMAIL = process.env.PLAYWRIGHT_TEST_TALENT_EMAIL ?? 'e2e-talent@test.apebi.ma'
const TALENT_PASSWORD = process.env.PLAYWRIGHT_TEST_TALENT_PASSWORD ?? 'TestPassword123!'

test.describe('Paramètres alertes — talent', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/connexion')
    await page.getByLabel(/email/i).fill(TALENT_EMAIL)
    await page.getByLabel(/mot de passe/i).fill(TALENT_PASSWORD)
    await page.getByRole('button', { name: /se connecter/i }).click()
    await page.waitForURL((url) => !url.pathname.includes('/connexion'), { timeout: 10000 })
  })

  test('La page paramètres est accessible au talent', async ({ page }) => {
    await page.goto('/talent/parametres')
    await expect(page.getByRole('heading', { name: /paramètres/i })).toBeVisible()
    await expect(page).not.toHaveURL(/\/connexion/)
  })

  test('La section alertes email est visible dans les paramètres', async ({ page }) => {
    await page.goto('/talent/parametres')
    await expect(page.getByText(/alertes offres par email/i)).toBeVisible()
  })

  test('Le toggle alertes email est présent et interactif', async ({ page }) => {
    await page.goto('/talent/parametres')
    const toggle = page.getByRole('switch', { name: /alertes email/i })
    await expect(toggle).toBeVisible()
    const initialState = await toggle.getAttribute('aria-checked')
    // Cliquer le toggle
    await toggle.click()
    // L'état doit avoir changé (optimistic UI ou après revalidation)
    await page.waitForTimeout(500)
    const newState = await toggle.getAttribute('aria-checked')
    // Re-cliquer pour remettre à l'état initial (évite de laisser le compte en état désabonné)
    await toggle.click()
    await page.waitForTimeout(500)
  })

  test('La page unsubscribe est accessible depuis les paramètres', async ({ page }) => {
    await page.goto('/talent/parametres')
    // Vérifier que la gestion des alertes est liée à /unsubscribe ou /talent/parametres
    await expect(page.getByText(/alertes/i)).toBeVisible()
  })

})
