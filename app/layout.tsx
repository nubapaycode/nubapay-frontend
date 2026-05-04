import type { Metadata } from 'next'
import { DM_Sans, Inter } from 'next/font/google'
import './globals.css'
import { SITE_DESCRIPTION, SITE_NAME, resolveMetadataBase } from '@/lib/seo'

const inter = Inter({ subsets: ['latin'], display: 'swap' })
const dmSans = DM_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-dm-sans',
  weight: ['300', '400', '500', '600', '700', '800', '900'],
})

const metadataBase = resolveMetadataBase()

export const metadata: Metadata = {
  ...(metadataBase ? { metadataBase } : {}),
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml', sizes: 'any' }],
  },
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: 'summary_large_image',
    title: SITE_NAME,
    description: SITE_DESCRIPTION,
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={dmSans.variable}>
      <body className={`${inter.className} bg-gray-50 text-gray-900`} style={{ fontFamily: "-apple-system, 'SF Pro Text', 'SF Pro Display', BlinkMacSystemFont, 'Inter', sans-serif" }}>
        {children}
      </body>
    </html>
  )
}
