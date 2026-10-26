'use client'

import { AlertTriangle, Check, Copy, Download, ExternalLink, QrCode } from 'lucide-react'
import { QRCodeCanvas } from 'qrcode.react'
import { useRef, useState } from 'react'

import { cn } from '@/lib/utils'

/** Link público de tickets con copiar, abrir y un QR descargable (para flyers, redes o la puerta). */
export function ShareLinkCard({
  url,
  hasCover,
  fileName,
  onError,
}: {
  url: string
  hasCover: boolean
  fileName: string
  onError: (msg: string) => void
}) {
  const [copied, setCopied] = useState(false)
  const [qrOpen, setQrOpen] = useState(false)
  const qrRef = useRef<HTMLCanvasElement>(null)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      onError('No se pudo copiar. Copiá el enlace manualmente.')
    }
  }

  const downloadQr = () => {
    const canvas = qrRef.current
    if (!canvas) return
    const a = document.createElement('a')
    a.href = canvas.toDataURL('image/png')
    a.download = `${fileName}-qr.png`
    a.click()
  }

  const display = url.replace(/^https?:\/\//, '')

  return (
    <section className="nb-rise mb-6 overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
      <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <p className="text-[12px] font-medium text-gray-500">Link para vender tickets</p>
          <p className="mt-0.5 truncate text-[14px] font-medium text-gray-900" title={url}>
            {display}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => void copy()}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            {copied ? <Check size={14} strokeWidth={2} className="text-emerald-600" aria-hidden /> : <Copy size={14} strokeWidth={1.75} aria-hidden />}
            {copied ? 'Copiado' : 'Copiar'}
          </button>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-[12px] font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:text-gray-900"
          >
            <ExternalLink size={14} strokeWidth={1.75} aria-hidden />
            Abrir
          </a>
          <button
            type="button"
            aria-expanded={qrOpen}
            onClick={() => setQrOpen(o => !o)}
            className={cn(
              'inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-medium transition-colors',
              qrOpen ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900',
            )}
          >
            <QrCode size={14} strokeWidth={1.75} aria-hidden />
            QR
          </button>
        </div>
      </div>

      {qrOpen && (
        <div className="nb-pop flex flex-col items-center gap-4 border-t border-gray-100 bg-gray-50/60 p-4 sm:flex-row">
          <div className="rounded-xl border border-gray-200 bg-white p-3">
            <QRCodeCanvas ref={qrRef} value={url} size={132} marginSize={1} aria-label="Código QR del link de tickets" />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <p className="text-[13px] font-medium text-gray-900">Escaneá para comprar</p>
            <p className="mt-0.5 text-[12px] text-gray-500">Usalo en flyers, historias o en la puerta del evento.</p>
            <button
              type="button"
              onClick={downloadQr}
              className="mt-3 inline-flex h-8 items-center gap-1.5 rounded-lg bg-gray-900 px-3 text-[12px] font-semibold text-white transition-colors hover:bg-gray-800"
            >
              <Download size={14} strokeWidth={1.75} aria-hidden />
              Descargar PNG
            </button>
          </div>
        </div>
      )}

      {!hasCover && (
        <p className="flex items-center gap-2 border-t border-amber-100 bg-amber-50/70 px-4 py-2.5 text-[12px] text-amber-800">
          <AlertTriangle size={14} strokeWidth={1.75} className="shrink-0" aria-hidden />
          Este evento todavía no tiene portada: el link no va a estar disponible hasta que la cargues en Storefront.
        </p>
      )}
    </section>
  )
}
