import { NextResponse } from 'next/server'
import { verifyLabelToken } from '@/lib/label'

// ── GET /api/label/verify/[token] ────────────────────────────
// Endpoint public de vérification d'un badge Label APEBI TechTalent.
// Cible des QR codes (CV, vitrine, LinkedIn). Aucune auth requise.
// Ne renvoie que des champs publics : type, nom, statut, validité.

type Params = Promise<{ token: string }>

export async function GET(_req: Request, { params }: { params: Params }) {
  const { token } = await params

  try {
    const result = await verifyLabelToken(token)
    if (!result) {
      return NextResponse.json(
        { error: 'Label introuvable' },
        { status: 404 },
      )
    }
    return NextResponse.json(result, {
      // Le statut d'un label change rarement → cache court côté CDN,
      // revalidable côté serveur si révocation (revalidatePath).
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    })
  } catch (err) {
    console.error('[label/verify] Error:', err)
    return NextResponse.json(
      { error: 'Erreur de vérification' },
      { status: 500 },
    )
  }
}
