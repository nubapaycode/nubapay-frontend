import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { AdminGuard } from '@/components/admin/AdminGuard'

const geist = Geist({ subsets: ['latin'], display: 'swap', variable: '--font-geist-sans' })
const geistMono = Geist_Mono({ subsets: ['latin'], display: 'swap', variable: '--font-geist-mono' })

export const metadata: Metadata = {
  title: 'Admin de plataforma',
  robots: { index: false, follow: false },
}

export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${geist.variable} ${geistMono.variable} font-admin antialiased`}>
      <AdminGuard>{children}</AdminGuard>
    </div>
  )
}
