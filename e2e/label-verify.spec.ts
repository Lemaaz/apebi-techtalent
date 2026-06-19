import { test, expect } from '@playwright/test'

// Smoke e2e de la page publique de vérification du Label (T4).
// ⚠️ Nécessite serveur dev + base joignable (migrations 004-008 appliquées).

test.describe('Vérification publique du Label', () => {
  test('un token inexistant affiche « Label introuvable »', async ({ page }) => {
    await page.goto('/label/verify/00000000-0000-4000-8000-000000000000')
    await expect(
      page.getByRole('heading', { name: 'Label introuvable' }),
    ).toBeVisible()
  })

  test('un token au mauvais format affiche « Label introuvable »', async ({ page }) => {
    await page.goto('/label/verify/pas-un-uuid')
    await expect(
      page.getByRole('heading', { name: 'Label introuvable' }),
    ).toBeVisible()
  })
})
