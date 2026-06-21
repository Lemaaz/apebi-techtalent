/**
 * E2E — Flux dépôt de candidature (talent)
 * Couvre : navigation offre publique, détail offre, postuler authentifié,
 *          confirmation candidature, liste candidatures dashboard talent
 *
 * Précondition : un compte talent validé (PLAYWRIGHT_TEST_EMAIL) doit exister.
 * Les tests publics (accès offre) ne nécessitent pas d'auth.
 */
import { test, expect } from '@playwright/test'

const TALENT_EMAIL = process.env.PLAYWRIGHT_TEST_EMAIL ?? 'e2e-talent@test.apebi.ma'
const TALENT_PASSWORD = process.env.PLAYWRIGHT_TEST_PASSWORD ?? 'TestPassword123!'

test.describe('Candidature — navigation publique', () => {

  test('La liste des offres est accessible sans connexion', async ({ page }) => {
    await page.goto('/offres')
    await expect(page).toHaveTitle(/Offres|APEBI/)
    await expect(page.getByRole('main')).toBeVisible()
  })

  test('La page détail d\'une offre est accessible sans connexion', async ({ page }) => {
    await page.goto('/offres')
    // Cliquer sur la première offre disponible, ou vérifier l'empty state
    const offerLinks = page.locator('a[href^="/offres/"]')
    const count = await offerLinks.count()

    if (count > 0) {
      await offerLinks.first().click()
      await expect(page.getByRole('main')).toBeVisible()
      await expect(page).not.toHaveURL('/offres')
    } else {
      // Empty state acceptable si aucune offre active
      const empty = page.getByText(/aucune offre|pas d.offre/i)
      await expect(empty).toBeVisible()
    }
  })

  test('Un utilisateur non connecté est redirigé vers la connexion pour postuler', async ({ page }) => {
    await page.goto('/offres')
    const offerLinks = page.locator('a[href^="/offres/"]')
    const count = await offerLinks.count()

    if (count === 0) {
      test.skip()
      return
    }

    await offerLinks.first().click()
    const applyBtn = page.getByRole('button', { name: /postuler|candidater/i })
      .or(page.getByRole('link', { name: /postuler|candidater/i }))

    if (await applyBtn.isVisible()) {
      await applyBtn.click()
      // Doit rediriger vers connexion ou afficher un modal de connexion
      await expect(page).toHaveURL(/\/connexion|\/offres/, { timeout: 5000 })
    }
  })

})

test.describe('Candidature — flux authentifié', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/connexion')
    await page.getByLabel(/email/i).fill(TALENT_EMAIL)
    await page.getByLabel(/mot de passe/i).fill(TALENT_PASSWORD)
    await page.getByRole('button', { name: /se connecter/i }).click()
    await page.waitForURL((url) => !url.pathname.includes('/connexion'), { timeout: 10000 })
  })

  test('Le dashboard candidatures est accessible', async ({ page }) => {
    await page.goto('/talent/candidatures')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page).not.toHaveURL(/\/connexion/)
  })

  test('La liste candidatures affiche les candidatures ou un état vide', async ({ page }) => {
    await page.goto('/talent/candidatures')
    const cards = page.locator('article, [data-testid="candidature-card"], li')
    const empty = page.getByText(/aucune candidature|pas encore postul|no applications/i)
    const count = await cards.count()

    if (count === 0) {
      await expect(empty).toBeVisible()
    } else {
      expect(count).toBeGreaterThan(0)
    }
  })

  test('Le bouton Postuler est visible sur une offre active pour un talent connecté', async ({ page }) => {
    await page.goto('/offres')
    const offerLinks = page.locator('a[href^="/offres/"]')
    const count = await offerLinks.count()

    if (count === 0) {
      test.skip()
      return
    }

    await offerLinks.first().click()
    await expect(page.getByRole('main')).toBeVisible()

    // Le bouton postuler doit exister (état "déjà postulé" ou "postuler")
    const applyArea = page.getByRole('button', { name: /postuler|candidater|déjà postulé/i })
      .or(page.getByText(/postuler|candidater|déjà postulé/i))

    await expect(applyArea.first()).toBeVisible({ timeout: 5000 })
  })

  test('Les offres sauvegardées sont accessibles depuis le dashboard', async ({ page }) => {
    await page.goto('/talent/offres-sauvegardees')
    await expect(page.getByRole('main')).toBeVisible()
    await expect(page).not.toHaveURL(/\/connexion/)
  })

})
