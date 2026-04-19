import type { Metadata } from 'next'
import { ScannerView } from '@/components/organizer/ScannerView'

export const metadata: Metadata = {
  title: 'Scanner — Nubapay',
}

export default function ScannerPage() {
  return (
    <main className="p-4 pt-6 md:p-6 md:pl-[35px] md:pt-[64px]">
      <ScannerView />
    </main>
  )
}
