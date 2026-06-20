import type { Metadata } from 'next'
import { Poppins, Hind } from 'next/font/google'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getMessages } from 'next-intl/server'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
})

const hind = Hind({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-hind',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'APEBI TechTalent — Talents tech & entreprises numériques au Maroc',
    template: '%s | APEBI TechTalent',
  },
  description:
    "La plateforme officielle de l'APEBI pour connecter les talents tech marocains aux entreprises membres de la fédération.",
  keywords: ['talents tech', 'recrutement Maroc', 'APEBI', 'numérique', 'emploi tech', 'TechTalent'],
  openGraph: {
    type: 'website',
    locale: 'fr_MA',
    alternateLocale: 'en_US',
    siteName: 'APEBI TechTalent',
  },
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const locale = await getLocale()
  const messages = await getMessages()

  return (
    <html lang={locale} suppressHydrationWarning>
      <body className={`${poppins.variable} ${hind.variable} font-sans antialiased`}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
          <Toaster position="bottom-right" richColors />
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
