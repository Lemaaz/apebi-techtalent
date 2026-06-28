import type { MetadataRoute } from 'next'
import { createAdminClient } from '@/lib/supabase/server'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://techtalent-apebi.vercel.app'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createAdminClient()

  // Pages statiques publiques
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: APP_URL, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${APP_URL}/offres`, lastModified: new Date(), changeFrequency: 'hourly', priority: 0.9 },
    { url: `${APP_URL}/entreprises`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${APP_URL}/observatoire`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    { url: `${APP_URL}/events`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.7 },
    { url: `${APP_URL}/formation`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.6 },
    { url: `${APP_URL}/a-propos`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.4 },
    { url: `${APP_URL}/mentions-legales`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
    { url: `${APP_URL}/politique-confidentialite`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.2 },
  ]

  // Offres actives (pages dynamiques)
  const { data: jobs } = await supabase
    .from('job_postings')
    .select('slug, updated_at')
    .eq('status', 'active')
    .limit(200)

  const jobRoutes: MetadataRoute.Sitemap = (jobs ?? []).map((job) => ({
    url: `${APP_URL}/offres/${job.slug}`,
    lastModified: job.updated_at ? new Date(job.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))

  // Vitrines entreprises approuvées
  const { data: companies } = await supabase
    .from('company_profiles')
    .select('slug, updated_at')
    .eq('validation_status', 'approved')
    .limit(200)

  const companyRoutes: MetadataRoute.Sitemap = (companies ?? []).map((c) => ({
    url: `${APP_URL}/entreprises/${c.slug}`,
    lastModified: c.updated_at ? new Date(c.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.6,
  }))

  return [...staticRoutes, ...jobRoutes, ...companyRoutes]
}
