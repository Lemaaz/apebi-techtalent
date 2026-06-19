import { describe, it, expect, vi, beforeEach } from 'vitest'

// ── Mock du client Supabase service-role ─────────────────────
// verifyLabelToken interroge company_profiles puis talent_profiles.
// On contrôle la réponse de maybeSingle() par table via mockResolve.
const mockResolve = vi.fn<(table: string) => { data: unknown }>()

vi.mock('@/lib/supabase/server', () => ({
  createAdminClient: () => ({
    from: (table: string) => ({
      select: () => ({
        eq: () => ({
          maybeSingle: () => Promise.resolve(mockResolve(table)),
        }),
      }),
    }),
  }),
}))

import { verifyLabelToken } from './label'

const VALID_TOKEN = '11111111-1111-4111-8111-111111111111'
const futureDate = new Date(Date.now() + 365 * 86_400_000).toISOString().slice(0, 10)
const pastDate = '2020-01-01'

function companyRow(over: Record<string, unknown> = {}) {
  return { data: { name: 'Infosys Maroc', has_techtalent_label: true, label_valid_until: futureDate, ...over } }
}
function talentRow(over: Record<string, unknown> = {}) {
  return { data: { first_name: 'Sara', last_name: 'El Amrani', has_techtalent_label: true, label_valid_until: futureDate, ...over } }
}
const empty = { data: null }

describe('verifyLabelToken', () => {
  beforeEach(() => mockResolve.mockReset())

  it('rejette un token au mauvais format sans toucher la BDD', async () => {
    const res = await verifyLabelToken('pas-un-uuid')
    expect(res).toBeNull()
    expect(mockResolve).not.toHaveBeenCalled()
  })

  it('retourne un Label entreprise VALIDE (date future)', async () => {
    mockResolve.mockImplementation((t) => (t === 'company_profiles' ? companyRow() : empty))
    const res = await verifyLabelToken(VALID_TOKEN)
    expect(res).toEqual({
      type: 'enterprise',
      name: 'Infosys Maroc',
      status: 'valid',
      validUntil: futureDate,
    })
  })

  it('marque EXPIRÉ un label dont la date est passée', async () => {
    mockResolve.mockImplementation((t) =>
      t === 'company_profiles' ? companyRow({ label_valid_until: pastDate }) : empty,
    )
    const res = await verifyLabelToken(VALID_TOKEN)
    expect(res?.status).toBe('expired')
  })

  it('marque RÉVOQUÉ un label dont has_techtalent_label = false', async () => {
    mockResolve.mockImplementation((t) =>
      t === 'company_profiles' ? companyRow({ has_techtalent_label: false }) : empty,
    )
    const res = await verifyLabelToken(VALID_TOKEN)
    expect(res?.status).toBe('revoked')
  })

  it('bascule sur le talent si aucune entreprise ne correspond', async () => {
    mockResolve.mockImplementation((t) => (t === 'talent_profiles' ? talentRow() : empty))
    const res = await verifyLabelToken(VALID_TOKEN)
    expect(res).toEqual({
      type: 'talent',
      name: 'Sara El Amrani',
      status: 'valid',
      validUntil: futureDate,
    })
  })

  it('retourne null si ni entreprise ni talent ne correspond', async () => {
    mockResolve.mockImplementation(() => empty)
    const res = await verifyLabelToken(VALID_TOKEN)
    expect(res).toBeNull()
  })

  it('traite un label sans date d’expiration comme valide', async () => {
    mockResolve.mockImplementation((t) =>
      t === 'company_profiles' ? companyRow({ label_valid_until: null }) : empty,
    )
    const res = await verifyLabelToken(VALID_TOKEN)
    expect(res?.status).toBe('valid')
    expect(res?.validUntil).toBeNull()
  })
})
