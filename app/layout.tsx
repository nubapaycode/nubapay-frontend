import type { Metadata, Viewport } from 'next'
import { DM_Sans, Inter } from 'next/font/google'
import './globals.css'
import { OG_IMAGE, SITE_DESCRIPTION, SITE_NAME, SITE_URL, resolveMetadataBase } from '@/lib/seo'

const inter = Inter({ subsets: ['latin'], display: 'swap' })
const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
})

export const metadata: Metadata = {
  metadataBase: resolveMetadataBase(),
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' }],
    apple: [{ url: '/favicon.svg' }],
  },
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  appleWebApp: {
    capable: true,
    title: SITE_NAME,
    statusBarStyle: 'black-translucent',
  },
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [{ url: OG_IMAGE, width: 1200, height: 630, alt: 'Nubapay' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
    images: [OG_IMAGE],
  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: SITE_URL,
  },
}

export const viewport: Viewport = {
  themeColor: '#0A0A0F',
}

const ORG_JSONLD = JSON.stringify({
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://nubapay.app/#organization',
      name: 'Nubapay',
      url: 'https://nubapay.app',
      logo: { '@type': 'ImageObject', url: 'https://nubapay.app/favicon.svg' },
      sameAs: ['https://www.instagram.com/nubapay.app'],
      contactPoint: {
        '@type': 'ContactPoint',
        email: 'contacto@nubapay.app',
        contactType: 'customer service',
        availableLanguage: 'Spanish',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://nubapay.app/#website',
      url: 'https://nubapay.app',
      name: 'Nubapay',
      publisher: { '@id': 'https://nubapay.app/#organization' },
      inLanguage: 'es-AR',
    },
    {
      '@type': 'SoftwareApplication',
      '@id': 'https://nubapay.app/#software',
      name: 'Nubapay',
      url: 'https://nubapay.app',
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description:
        'Plataforma para eventos masivos: menú digital, pagos móviles y retiro de pedidos con código QR antifraude. Sin cajas, sin filas y sin descargar una app.',
      inLanguage: 'es-AR',
      publisher: { '@id': 'https://nubapay.app/#organization' },
      featureList: [
        'Menú digital sin descargar app',
        'Pagos móviles online',
        'Retiro con QR único de un solo uso',
        'Validación antifraude en tiempo real',
        'Múltiples puntos de retiro',
        'Panel de organizador con ventas en tiempo real',
      ],
      offers: {
        '@type': 'Offer',
        priceCurrency: 'ARS',
        price: '0',
        description: 'Sin costos fijos. Comisión por transacción sobre cada venta.',
      },
    },
  ],
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  // ORG_JSONLD is a static string built from a hardcoded object — safe for script injection
  const jsonLdHtml = { __html: ORG_JSONLD }
  return (
    <html lang="es" className={dmSans.variable}>
      <body className={`${inter.className} bg-gray-50 text-gray-900`} style={{ fontFamily: "-apple-system, 'SF Pro Text', 'SF Pro Display', BlinkMacSystemFont, 'Inter', sans-serif" }}>
        {/* eslint-disable-next-line react/no-danger */}
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml} />
        {children}
      </body>
    </html>
  )
}
