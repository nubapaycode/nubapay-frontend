import { ChevronRight } from 'lucide-react'
import Link from 'next/link'

/** Los cobros de un evento de un estacionamiento son los del dueño: no se configuran en el evento. */
export function InheritedPaymentsNotice() {
  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-sm font-semibold text-gray-900">Este evento cobra con los medios de tu estacionamiento</p>
      <p className="mt-1 text-sm text-gray-500">
        Las pasarelas se conectan una sola vez en el panel del estacionamiento y valen para todos tus eventos.
      </p>
      <Link
        href="/estacionamiento/cobros/metodos-pago"
        className="mt-4 inline-flex h-9 items-center gap-1.5 rounded-xl bg-gray-900 px-4 text-[13px] font-semibold text-white transition-colors hover:bg-gray-800"
      >
        Ir a los cobros del estacionamiento
        <ChevronRight size={14} aria-hidden />
      </Link>
    </section>
  )
}
