import type { Metadata } from 'next'

import { AdminGuard } from '@/components/admin/AdminGuard'

export const metadata: Metadata = {
  title: 'Admin de plataforma',
  robots: { index: false, follow: false },
}

export default function PlatformAdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="font-admin antialiased">
      <AdminGuard>{children}</AdminGuard>
    </div>
  )
}
