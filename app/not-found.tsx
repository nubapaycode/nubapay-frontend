import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: '404 — Página no encontrada',
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center px-6 py-16 text-center font-[family-name:var(--font-dm-sans)]">

      <div className="mb-10 flex items-center justify-center">
        <div className="relative grid grid-cols-3 gap-1.5 opacity-10">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className={`rounded-sm bg-gray-900 ${
                [0, 2, 4, 6, 8].includes(i) ? 'size-8' : 'size-8 opacity-30'
              }`}
            />
          ))}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="size-6 rounded-sm bg-gray-900" />
          </div>
        </div>
      </div>

      <span className="mb-5 inline-block rounded-full border border-gray-200 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-gray-400">
        Error 404
      </span>

      <h1 className="mb-5 text-[clamp(32px,7vw,56px)] font-black leading-[0.95] tracking-[-0.04em] text-gray-950 whitespace-nowrap">
        ¿Perdiste el QR?
      </h1>

      <p className="mb-10 max-w-sm text-[17px] leading-relaxed text-gray-500">
        Esta página no existe o fue movida.<br className="hidden sm:block" />
        Volvé al inicio y seguí explorando.
      </p>

      <Link
        href="/"
        className="group inline-flex items-center gap-2 rounded-full px-7 py-3.5 text-[15px] font-semibold text-[#0A0F00] transition-opacity hover:opacity-80 active:scale-[0.98]"
        style={{ background: '#C6FF00' }}
      >
        Volver al inicio
        <svg
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="transition-transform group-hover:translate-x-0.5"
        >
          <path
            d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5"
            stroke="#0A0F00"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </Link>

      <p className="mt-12 text-xs text-gray-300 tracking-wide">nubapay</p>
    </div>
  )
}
