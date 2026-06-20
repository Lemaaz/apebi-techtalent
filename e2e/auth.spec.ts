/**
 * E2E — Flux d'authentification
 * Couvre : inscription talent, connexion, déconnexion
 *
 * Note : Ces tests utilisent un compte de test configuré via variables d'env.
 * PLAYWRIGHT_TEST_EMAIL / PLAYWRIGHT_TEST_PASSWORD doivent exister dans la DB Supabase.
 */
import { test, expect } from '@playwright/test'

const TEST_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL ?? 'e2e-talent@test.apebi.ma'
const TEST_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? 'TestPassword123!'

test.describe('Authentification', () => {

  test('La page de connexion est accessible', async ({ page }) => {
    await page.goto('/connexion')
    await expect(page).toHaveTitle(/Connexion|APEBI/)
    await expect(page.getByRole('heading', { name: /connexion/i })).toBeVisible()
  })

  test('Erreur avec des identifiants incorrects', async ({ page }) => {
    await page.goto('/connexion')
    await page.getByLabel(/email/i).fill('mauvais@email.com')
    await page.getByLabel(/mot de passe/i).fill('mauvaismdp')
    await page.getByRole('button', { name: /se connecter/i }).click()

    // Should show an error message
    await expect(page.getByRole('alert').or(page.locator('[aria-live]'))).toBeVisible({ timeout: 8000 })
  })

  test('Connexion réussie avec un compte de test', async ({ page }) => {
    await page.goto('/connexion')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/mot de passe/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /se connecter/i }).click()

    // After login, should redirect away from /connexion
    await expect(page).not.toHaveURL(/\/connexion/, { timeout: 10000 })
  })

  test('Déconnexion depuis le menu utilisateur', async ({ page }) => {
    // Login first
    await page.goto('/connexion')
    await page.getByLabel(/email/i).fill(TEST_EMAIL)
    await page.getByLabel(/mot de passe/i).fill(TEST_PASSWORD)
    await page.getByRole('button', { name: /se connecter/i }).click()
    await page.waitForURL((url) => !url.pathname.includes('/connexion'), { timeout: 10000 })

    // Open user menu and sign out
    await page.getByRole('button', { name: /déconnexion|mon compte/i }).click()
    const signoutBtn = page.getByRole('menuitem', { name: /déconnexion/i })
    if (await signoutBtn.isVisible()) {
      await signoutBtn.click()
    } else {
      await page.getByRole('button', { name: /déconnexion/i }).click()
    }

    // Should return to home or connexion
    await expect(page).toHaveURL(/\/$|\/connexion/, { timeout: 8000 })
  })

  test('La page mot de passe oublié est accessible', async ({ page }) => {
    await page.goto('/mot-de-passe-oublie')
    await expect(page.getByRole('heading')).toBeVisible()
    await expect(page.getByLabel(/email/i)).toBeVisible()
  })

})
