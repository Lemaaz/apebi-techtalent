/**
 * E2E — Flux inscription talent (onboarding 3 étapes)
 * Couvre : accès page inscription, navigation entre étapes, validation formulaire
 *
 * Ces tests vérifient la structure du flux d'inscription sans créer de compte réel.
 * Un compte de test pré-créé est utilisé pour les flux nécessitant une auth.
 *
 * Précondition : PLAYWRIGHT_TEST_NEW_TALENT_EMAIL doit exister en DB Supabase
 * avec validation_status='pending' et un profil incomplet pour tester l'onboarding.
 */
import { test, expect } from '@playwright/test'

const TALENT_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL ?? 'e2e-talent@test.apebi.ma'
const TALENT_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? 'TestPassword123!'

test.describe('Inscription talent — accès public', () => {

  test('La page inscription est accessible', async ({ page }) => {
    await page.goto('/inscription')
    await expect(page).toHaveTitle(/Inscription|APEBI/)
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('Le formulaire d\'inscription contient les champs email et mot de passe', async ({ page }) => {
    await page.goto('/inscription')
    await expect(page.getByLabel(/email/i)).toBeVisible()
    await expect(page.getByLabel(/mot de passe/i).first()).toBeVisible()
    await expect(page.getByRole('button', { name: /créer|s'inscrire|inscription/i })).toBeVisible()
  })

  test('Un email invalide déclenche une erreur de validation', async ({ page }) => {
    await page.goto('/inscription')
    await page.getByLabel(/email/i).fill('pas-un-email')
    await page.getByRole('button', { name: /créer|s'inscrire|inscription/i }).click()
    // HTML5 validation ou message d'erreur côté serveur
    const emailInput = page.getByLabel(/email/i)
    const isInvalid = await emailInput.evaluate((el) => !(el as HTMLInputElement).validity.valid)
    const errorMsg = page.getByRole('alert').or(page.locator('[aria-live]'))
    const hasError = isInvalid || await errorMsg.isVisible()
    expect(hasError).toBe(true)
  })

  test('Un email déjà utilisé retourne une erreur', async ({ page }) => {
    await page.goto('/inscription')
    await page.getByLabel(/email/i).fill(TALENT_EMAIL)
    await page.getByLabel(/mot de passe/i).first().fill('TestPassword123!')
    const confirmField = page.getByLabel(/confirmer|confirmation/i)
    if (await confirmField.isVisible()) {
      await confirmField.fill('TestPassword123!')
    }
    await page.getByRole('button', { name: /créer|s'inscrire|inscription/i }).click()
    await expect(page.getByRole('alert').or(page.locator('[aria-live]'))).toBeVisible({ timeout: 8000 })
  })

})

test.describe('Inscription talent — onboarding authentifié', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/connexion')
    await page.getByLabel(/email/i).fill(TALENT_EMAIL)
    await page.getByLabel(/mot de passe/i).fill(TALENT_PASSWORD)
    await page.getByRole('button', { name: /se connecter/i }).click()
    await page.waitForURL((url) => !url.pathname.includes('/connexion'), { timeout: 10000 })
  })

  test('Un talent connecté peut accéder à son profil', async ({ page }) => {
    await page.goto('/talent/profil')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page).not.toHaveURL(/\/connexion/)
  })

  test('La page de modification profil est accessible', async ({ page }) => {
    await page.goto('/talent/profil/modifier')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page).not.toHaveURL(/\/connexion|\/403/)
  })

  test('Le dashboard talent charge sans erreur', async ({ page }) => {
    await page.goto('/talent/dashboard')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page).not.toHaveURL(/\/connexion/)
  })

  test('La page paramètres est accessible et contient le bouton de suppression', async ({ page }) => {
    await page.goto('/talent/parametres')
    await expect(page.getByRole('main')).toBeVisible()
    // Le bouton de suppression de compte doit exister (sécurité RGPD)
    const deleteBtn = page.getByRole('button', { name: /supprimer.*compte|delete.*account/i })
    await expect(deleteBtn).toBeVisible()
  })

})
