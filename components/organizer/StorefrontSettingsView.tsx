'use client'

import { Copy, Download, ImageUp, Link2, QrCode, Trash2 } from 'lucide-react'
import Image from 'next/image'
import { QRCodeSVG } from 'qrcode.react'
import { useCallback, useEffect, useRef, useState } from 'react'

import { fetchOrganizerEventDetail, patchOrganizerEvent } from '@/lib/organizerEvents'
import { catalogPublicPath, getPublicSiteOriginForUi } from '@/lib/siteOrigin'
import { uploadEventCoverImage } from '@/lib/supabase/uploadEventCover'
import type { OrganizerEventDetail } from '@/lib/types/organizer'
import { getAuthUser } from '@/lib/authSession'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'

const CATALOG_QR_SIZE = 240

function downloadSvgAsPng(svg: SVGSVGElement, filename: string, pixelSize = CATALOG_QR_SIZE) {
  const svgData = new XMLSerializer().serializeToString(svg)
  const img = new window.Image()
  img.onload = () => {
    const canvas = document.createElement('canvas')
    canvas.width = pixelSize
    canvas.height = pixelSize
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, pixelSize, pixelSize)
    ctx.drawImage(img, 0, 0, pixelSize, pixelSize)
    const link = document.createElement('a')
    link.download = filename
    link.href = canvas.toDataURL('image/png')
    link.click()
  }
  img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgData)}`
}

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition'

export function StorefrontSettingsView({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OrganizerEventDetail | null>(null)
  const [slugDraft, setSlugDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingSlug, setSavingSlug] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [copyMsg, setCopyMsg] = useState('')
  const [qrModalOpen, setQrModalOpen] = useState(false)
  const qrContainerRef = useRef<HTMLDivElement>(null)
  const { show: showToast, ToastPortal } = useToast()

  const load = useCallback(async () => {
    const res = await fetchOrganizerEventDetail(eventId)
    if (!res.ok) {
      showToast(res.error, 'error')
      setEvent(null)
    } else {
      setEvent(res.event)
      setSlugDraft(res.event.slug)
    }
    setLoading(false)
  }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    // Carga inicial (patrón como OrdersView)
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch inicial vía load()
    void load()
  }, [load])

  const hasCover = Boolean(event?.cover_image_url)
  const [browserOrigin, setBrowserOrigin] = useState<string | null>(null)
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setBrowserOrigin(window.location.origin))
    return () => window.cancelAnimationFrame(id)
  }, [])

  const user = getAuthUser()
  const partnerOrigin =
    user?.tenant_partner_whitelabel_enabled && user?.tenant_subdomain
      ? `https://${user.tenant_subdomain}.nubapay.app`
      : null

  const publicOriginUi = partnerOrigin ?? browserOrigin ?? getPublicSiteOriginForUi()
  const slugForUrl = slugDraft.trim() || event?.slug || ''
  const publicUrl =
    hasCover && publicOriginUi && slugForUrl ? `${publicOriginUi}${catalogPublicPath(slugForUrl)}` : ''

  const handleSaveSlug = async () => {
    if (!hasCover) return
    const next = slugDraft.trim()
    if (next.length < 2) {
      showToast('El identificador del enlace debe tener al menos 2 caracteres.', 'error')
      return
    }
    setSavingSlug(true)
    const res = await patchOrganizerEvent(eventId, { slug: next })
    setSavingSlug(false)
    if (!res.ok) {
      showToast(res.error, 'error')
      return
    }
    setEvent(res.event)
    setSlugDraft(res.event.slug)
  }

  const handleCoverFile = async (file: File | null) => {
    if (!file) return
    setUploadingCover(true)
    const up = await uploadEventCoverImage(eventId, file)
    if (!up.ok) {
      setUploadingCover(false)
      showToast(up.error, 'error')
      return
    }
    const res = await patchOrganizerEvent(eventId, { cover_image_url: up.publicUrl })
    setUploadingCover(false)
    if (!res.ok) {
      showToast(res.error, 'error')
      return
    }
    setEvent(res.event)
  }

  const handleRemoveCover = async () => {
    setUploadingCover(true)
    const res = await patchOrganizerEvent(eventId, { cover_image_url: null })
    setUploadingCover(false)
    if (!res.ok) {
      showToast(res.error, 'error')
      return
    }
    setEvent(res.event)
  }

  const handleCopyLink = async () => {
    if (!hasCover || !publicUrl) return
    try {
      await navigator.clipboard.writeText(publicUrl)
      setCopyMsg('Copiado')
      setTimeout(() => setCopyMsg(''), 2000)
    } catch {
      showToast('No se pudo copiar. Copiá el enlace manualmente.', 'error')
    }
  }

  const handleDownloadQr = () => {
    const svg = qrContainerRef.current?.querySelector('svg')
    if (!svg) {
      showToast('No se pudo generar la imagen del QR.', 'error')
      return
    }
    const safeSlug = (slugForUrl || 'catalogo').replace(/[^a-z0-9-]/gi, '-')
    downloadSvgAsPng(svg, `catalogo-${safeSlug}.png`)
  }

  if (loading) {
    return (
      <div className="max-w-2xl flex flex-col items-center justify-center py-24 gap-3 mx-auto px-4">
        <Spinner size="lg" className="text-gray-900" />
        <p className="text-sm text-gray-400">Cargando…</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <ToastPortal />
        <p className="text-sm text-gray-400">No se pudo cargar el evento.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-8">
      <ToastPortal />
      <OrganizerToolHeading
        title="Link del catálogo"
        description="Empezá con una foto de portada: la usamos para el menú público. Cuando esté lista, podés definir el texto corto del enlace y compartirlo con tu gente."
      />

      <section style={{ borderRadius: '20px', border: '1px solid rgba(0,0,0,0.07)', background: '#FFFFFF', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '18px 20px 14px', borderBottom: '1px solid rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '30px', height: '30px', borderRadius: '8px', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <ImageUp className="h-4 w-4 text-gray-500" aria-hidden />
            </div>
            <div>
              <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0F', margin: 0, letterSpacing: '-0.01em' }}>Portada del catálogo</p>
              <p style={{ fontSize: '12px', color: '#9A9AA8', margin: 0, marginTop: '1px' }}>La imagen que verán tus clientes al abrir el menú</p>
            </div>
          </div>
          {event.cover_image_url && (
            <button
              type="button"
              onClick={() => void handleRemoveCover()}
              disabled={uploadingCover}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', background: 'none', border: 'none', cursor: uploadingCover ? 'not-allowed' : 'pointer', fontSize: '12px', fontWeight: 500, color: '#EF4444', opacity: uploadingCover ? 0.4 : 1, padding: '4px 0', flexShrink: 0 }}
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden />
              Quitar
            </button>
          )}
        </div>

        {/* Image area */}
        {event.cover_image_url ? (
          <div style={{ position: 'relative', width: '100%', height: '200px', background: '#F5F5F7', overflow: 'hidden' }}>
            <Image
              src={event.cover_image_url}
              alt="Portada del catálogo"
              fill
              style={{ objectFit: 'cover' }}
              unoptimized
            />
            {uploadingCover && (
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '13px', color: '#6B7280', fontWeight: 500 }}>Subiendo…</span>
              </div>
            )}
          </div>
        ) : (
          <label style={{ display: 'block', cursor: uploadingCover ? 'not-allowed' : 'pointer' }}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
              className="sr-only"
              disabled={uploadingCover}
              onChange={e => void handleCoverFile(e.target.files?.[0] ?? null)}
            />
            <div style={{ height: '180px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', background: '#FAFAFA', borderBottom: 'none', transition: 'background 0.15s' }}
              onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = '#F5F5F7' }}
              onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = '#FAFAFA' }}
            >
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#F0F0F2', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <ImageUp className="h-5 w-5 text-gray-400" aria-hidden />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0F', margin: 0 }}>{uploadingCover ? 'Subiendo…' : 'Subir imagen'}</p>
                <p style={{ fontSize: '12px', color: '#9A9AA8', margin: '3px 0 0 0' }}>JPG, PNG o WEBP · Tocá para elegir</p>
              </div>
            </div>
          </label>
        )}

        {/* Footer action when image exists */}
        {event.cover_image_url && (
          <div style={{ padding: '12px 20px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
            <label style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', cursor: uploadingCover ? 'not-allowed' : 'pointer' }}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif,image/heic,image/heif"
                className="sr-only"
                disabled={uploadingCover}
                onChange={e => void handleCoverFile(e.target.files?.[0] ?? null)}
              />
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px', fontWeight: 500, color: '#6B7280', opacity: uploadingCover ? 0.5 : 1 }}>
                <ImageUp className="h-3.5 w-3.5" aria-hidden />
                {uploadingCover ? 'Subiendo…' : 'Cambiar imagen'}
              </span>
            </label>
          </div>
        )}
      </section>

      <section
        className={`space-y-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm ${
          !hasCover ? 'opacity-70' : ''
        }`}
      >
        <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
          <Link2 className="h-4 w-4 text-gray-500" aria-hidden />
          Tu enlace público
        </div>

        {!hasCover ? (
          <p className="text-sm text-gray-600 leading-relaxed">
            Subí una imagen de portada en la sección de arriba. Recién ahí vas a poder elegir el texto del link y
            copiarlo para WhatsApp, Instagram o donde quieras.
          </p>
        ) : (
          <>
            <p className="text-xs text-gray-500">
              Solo letras minúsculas, números y guiones. No puede repetirse con otro evento.
            </p>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                className={inputClass}
                value={slugDraft}
                onChange={e => setSlugDraft(e.target.value)}
                placeholder="mi-festival-2026"
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => void handleSaveSlug()}
                disabled={savingSlug || slugDraft.trim() === event.slug}
                className="shrink-0 rounded-full bg-gray-900 text-white text-sm font-medium px-5 py-3 hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none"
              >
                {savingSlug ? 'Guardando…' : 'Guardar'}
              </button>
            </div>

            <div className="rounded-xl bg-gray-50 px-4 py-3 space-y-2">
              <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                Enlace para compartir · Generar QR
              </p>
              {publicUrl ? (
                <div className="flex flex-col gap-2">
                  <p className="text-sm text-gray-800 break-all font-mono">{publicUrl}</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void handleCopyLink()}
                      className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-100"
                    >
                      <Copy className="h-3.5 w-3.5" aria-hidden />
                      {copyMsg || 'Copiar'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setQrModalOpen(true)}
                      className="inline-flex items-center justify-center gap-1.5 shrink-0 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-900 hover:bg-gray-100"
                    >
                      <QrCode className="h-3.5 w-3.5" aria-hidden />
                      Generar QR
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  Acá vas a ver el link completo cuando tu sitio tenga una dirección configurada.
                </p>
              )}
            </div>
          </>
        )}
      </section>

      <Modal
        isOpen={qrModalOpen && Boolean(publicUrl)}
        onClose={() => setQrModalOpen(false)}
        title="QR del catálogo"
      >
        <div className="flex flex-col items-center gap-4">
          <p className="text-sm text-gray-500 text-center">
            Escaneá este código para abrir el menú público del evento.
          </p>
          <div
            ref={qrContainerRef}
            className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
          >
            {publicUrl ? (
              <QRCodeSVG
                value={publicUrl}
                size={240}
                bgColor="#ffffff"
                fgColor="#111111"
                level="M"
              />
            ) : null}
          </div>
          <p className="text-xs text-gray-400 font-mono break-all text-center max-w-full">{publicUrl}</p>
          <div className="flex w-full flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={handleDownloadQr}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gray-900 px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
            >
              <Download className="h-4 w-4" aria-hidden />
              Descargar QR
            </button>
            <button
              type="button"
              onClick={() => setQrModalOpen(false)}
              className="inline-flex flex-1 items-center justify-center rounded-full border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Cerrar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
