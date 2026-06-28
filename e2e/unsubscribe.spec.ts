/**
 * E2E — Route unsubscribe alertes (D3 RGPD)
 * Couvre : token valide, token invalide, accès direct sans params
 */
import { test, expect } from '@playwright/test'

test.describe('Unsubscribe alertes email @smoke', () => {

  test('Accès direct sans token affiche la page par défaut', async ({ page }) => {
    await page.goto('/unsubscribe')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page).not.toHaveURL(/\/connexion/)
    await expect(page).not.toHaveURL(/error=/)
  })

  test('Token invalide affiche un message d\'erreur', async ({ page }) => {
    await page.goto('/unsubscribe?error=invalid')
    await expect(page.getByRole('heading', { name: /lien invalide/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /se connecter/i })).toBeVisible()
  })

  test('Succès affiche la confirmation de désabonnement', async ({ page }) => {
    await page.goto('/unsubscribe?success=1')
    await expect(page.getByRole('heading', { name: /désabonnement confirmé/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /gérer mes préférences/i })).toBeVisible()
  })

  test('La page unsubscribe est accessible sans authentification', async ({ page }) => {
    const response = await page.goto('/unsubscribe')
    expect(response?.status()).toBe(200)
  })

  test('Le lien API unsubscribe avec token invalide redirige vers /unsubscribe?error=invalid', async ({ page }) => {
    await page.goto('/api/unsubscribe?id=fake-id&token=fake-token')
    await expect(page).toHaveURL(/\/unsubscribe\?error=invalid/)
  })

})
