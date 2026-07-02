import type { NextConfig } from "next";
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./src/i18n/request.ts');

// ── Security headers ────────────────────────────────────────
// Applied on every route. CSP est intentionnellement permissif
// pour Supabase, Resend, Google Fonts et les analytics.
const securityHeaders = [
  // Empêche le clickjacking — la page ne peut pas être embarquée dans une iframe
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Empêche le MIME-sniffing des réponses
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Force HTTPS pour 1 an, inclut les sous-domaines
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Contrôle les infos envoyées dans le Referer header
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Désactive les permissions inutiles au navigateur
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // DNS prefetch désactivé (évite la fuite d'info)
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  // Content Security Policy
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts : self + Next.js inline + unsafe-eval en dev (React/Turbopack callstacks)
      `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}`,
      // Styles : self + Google Fonts + inline (Tailwind)
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      // Fonts
      "font-src 'self' https://fonts.gstatic.com",
      // Images : self + Supabase storage + LinkedIn + Google profile pics + data URIs
      "img-src 'self' data: blob: https://*.supabase.co https://media.licdn.com https://lh3.googleusercontent.com https://apebi.org.ma",
      // Connexions API : Supabase, Resend (via API), app elle-même
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.resend.com https://www.linkedin.com https://api.linkedin.com",
      // Frames : SAMEORIGIN seulement
      "frame-ancestors 'self'",
      // Formulaires : self uniquement
      "form-action 'self'",
      // Manifest
      "manifest-src 'self'",
    ].join('; '),
  },
]

const nextConfig: NextConfig = {
  // N'annonce pas le framework/version dans les headers (fingerprinting)
  poweredByHeader: false,

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'media.licdn.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },

  async headers() {
    return [
      {
        // Appliquer sur toutes les routes
        source: '/:path*',
        headers: securityHeaders,
      },
    ]
  },
};

export default withNextIntl(nextConfig);
