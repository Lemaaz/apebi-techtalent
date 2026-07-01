import type { MetadataRoute } from 'next'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://apebi-techtalent.vercel.app'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/offres',
          '/offres/',
          '/entreprises',
          '/entreprises/',
          '/events',
          '/events/',
          '/formation',
          '/formation/',
          '/observatoire',
          '/a-propos',
          '/mentions-legales',
          '/politique-confidentialite',
        ],
        disallow: [
          '/admin/',
          '/talent/',
          '/entreprise/',
          '/api/',
          '/auth/',
          '/onboarding/',
          '/r/',
        ],
      },
    ],
    sitemap: `${APP_URL}/sitemap.xml`,
  }
}
