import type { Metadata } from 'next'

import { ScannerDisplay } from '@/components/organizer/scanner/ScannerDisplay'

export const metadata: Metadata = { title: 'Pantalla del escáner' }

/** Ventana para un monitor a la vista del público: verde o rojo con la patente grande, según cada lectura. */
export default function ScannerDisplayPage() {
  return <ScannerDisplay />
}
