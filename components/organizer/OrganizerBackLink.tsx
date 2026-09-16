import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'

import { cn } from '@/lib/utils'

/** Link "Volver a …" para herramientas a las que se entra desde otra página (Cuenta, Cobros). */
export function OrganizerBackLink({ href, label, className }: { href: string; label: string; className?: string }) {
  return (
    <Link
      href={href}
      className={cn('inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors', className)}
    >
      <ChevronLeft size={15} aria-hidden />
      {label}
    </Link>
  )
}
