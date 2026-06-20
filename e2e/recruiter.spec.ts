/**
 * E2E — Flux recruteur : recherche talents, favoris, dashboard
 * Couvre : recherche talents, mise en favoris, tableau de bord candidatures
 */
import { test, expect } from '@playwright/test'

const RECRUITER_EMAIL = process.env.PLAYWRIGHT_TEST_RECRUITER_EMAIL ?? 'e2e-entreprise@test.apebi.ma'
const RECRUITER_PASSWORD = process.env.PLAYWRIGHT_TEST_RECRUITER_PASSWORD ?? 'TestPassword123!'

test.describe('Recruteur — recherche talents', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/connexion')
    await page.getByLabel(/email/i).fill(RECRUITER_EMAIL)
    await page.getByLabel(/mot de passe/i).fill(RECRUITER_PASSWORD)
    await page.getByRole('button', { name: /se connecter/i }).click()
    await page.waitForURL((url) => !url.pathname.includes('/connexion'), { timeout: 10000 })
  })

  test('La page recherche talents est accessible pour un recruteur', async ({ page }) => {
    await page.goto('/entreprise/recherche-talents')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page).not.toHaveURL(/\/connexion/)
    await expect(page).not.toHaveURL(/\/403|\/unauthorized/)
  })

  test('La page favoris talents est accessible', async ({ page }) => {
    await page.goto('/entreprise/favoris')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page).not.toHaveURL(/\/connexion/)
  })

  test('Le dashboard entreprise est accessible', async ({ page }) => {
    await page.goto('/entreprise/dashboard')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page).not.toHaveURL(/\/connexion/)
  })

  test('La page de gestion des offres est accessible', async ({ page }) => {
    await page.goto('/entreprise/offres')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page).not.toHaveURL(/\/connexion/)
  })

})

test.describe('Entreprises — pages publiques', () => {

  test('La liste des entreprises est accessible publiquement', async ({ page }) => {
    await page.goto('/entreprises')
    await expect(page).toHaveTitle(/Entreprises|APEBI/)
    await expect(page.getByRole('main')).toBeVisible()
  })

})
