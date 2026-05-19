'use client'

import { Check, ChevronDown, ChevronUp, Copy, Globe, Lock, Palette, Pencil, ShoppingCart } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { authPaths, partnerTenantPaths } from '@/lib/api'
import type { AuthUser } from '@/lib/authSession'
import { authHeadersJson, getAuthToken, setAuthSession } from '@/lib/authSession'
import { browserFetch } from '@/lib/browserFetch'
import {
  approximateAccentBackgroundHex,
  coerceBrandHex,
  resolvedAccentContrastTextLive,
  suggestedContrastOnAccentHex,
  wcagContrastBetweenHex,
} from '@/lib/accentContrastText'
import { organizerAccentColorsFromDraft } from '@/lib/organizerAccentCss'

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition'

const textareaClass = `${inputClass} min-h-[88px] resize-y leading-relaxed`

type TenantDomainRow = {
  id: string
  hostname: string
  verified: boolean
}

type PartnerTenantPayload = {
  id: string
  subdomain: string
  partner_whitelabel_enabled: boolean
  branding: Record<string, unknown>
  domains: TenantDomainRow[]
}

type TenantApiBody = {
  needs_provision?: boolean
  tenant?: PartnerTenantPayload
  error?: string
}

function isApex(hostname: string): boolean {
  return hostname.split('.').length === 2
}

function dnsNameLabel(hostname: string): string {
  if (isApex(hostname)) return '@'
  return hostname.split('.')[0]
}

function DnsRow({ type, name, value }: { type: string; name: string; value: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2.5 text-[11px] leading-relaxed">
      <div className="grid grid-cols-[40px_1fr] gap-x-3 gap-y-1">
        <span className="font-semibold text-gray-500 uppercase tracking-wide">Tipo</span>
        <code className="font-mono text-gray-900">{type}</code>
        <span className="font-semibold text-gray-500 uppercase tracking-wide">Nombre</span>
        <code className="font-mono text-gray-900 break-all">{name}</code>
        <span className="font-semibold text-gray-500 uppercase tracking-wide">Valor</span>
        <code className="font-mono text-gray-900 break-all">{value}</code>
      </div>
    </div>
  )
}

function strField(v: unknown): string {
  return typeof v === 'string' ? v : ''
}

function ImagePreview({ url, label }: { url: string; label: string }) {
  const [resolvedUrl, setResolvedUrl] = useState<string | null>(null)
  const [failedUrl, setFailedUrl] = useState<string | null>(null)
  const canon = coerceBrandHex(url)
  const trimmed = url.trim()

  useEffect(() => {
    if (!trimmed || canon) return
    let cancelled = false
    const img = new Image()
    img.onload = () => { if (!cancelled) setResolvedUrl(trimmed) }
    img.onerror = () => { if (!cancelled) setFailedUrl(trimmed) }
    img.src = trimmed
    return () => { cancelled = true }
  }, [trimmed, canon])

  if (!trimmed || canon) return null

  const isPending = resolvedUrl !== trimmed && failedUrl !== trimmed
  const isOk = resolvedUrl === trimmed
  const isError = failedUrl === trimmed

  return (
    <div className="mt-2 flex items-center gap-3">
      {isPending && <Spinner size="sm" className="text-gray-400" />}
      {isOk && (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={trimmed} alt={label} className="h-10 w-auto rounded-lg border border-gray-200 object-contain bg-gray-50" />
      )}
      {isError && (
        <p className="text-[11px] text-red-600">No se pudo cargar la imagen</p>
      )}
    </div>
  )
}

function ColorInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder?: string
}) {
  const pickerRef = useRef<HTMLInputElement>(null)
  const canon = coerceBrandHex(value)

  return (
    <label className="block">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      <div className="relative mt-2 flex items-center gap-2">
        <button
          type="button"
          aria-label="Abrir selector de color"
          onClick={() => pickerRef.current?.click()}
          className="shrink-0 h-10 w-10 rounded-lg border border-gray-200 shadow-sm transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gray-900"
          style={{ backgroundColor: canon ?? '#e5e7eb' }}
        />
        <input
          type="color"
          ref={pickerRef}
          className="sr-only"
          value={canon ?? '#000000'}
          onChange={e => { onChange(e.target.value) }}
        />
        <input
          type="text"
          className={inputClass + ' font-mono'}
          value={value}
          onChange={e => { onChange(e.target.value) }}
          placeholder={placeholder ?? '#000000'}
        />
      </div>
    </label>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => { setCopied(false) }, 2500)
    } catch {
      /* ignore */
    }
  }
  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="ml-1 inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-100 transition"
      title="Copiar"
    >
      {copied ? <Check size={12} className="text-green-600" /> : <Copy size={12} />}
      {copied ? 'Copiado' : 'Copiar'}
    </button>
  )
}

const FAQS = [
  {
    q: '¿Puedo cambiar el nombre después?',
    a: 'Sí, podés cambiarlo cuando quieras desde esta misma pantalla usando el ícono de lápiz.',
  },
  {
    q: '¿Qué ven mis compradores con mi marca?',
    a: 'Van a ver tu logo, tus colores y el nombre de tu organización en el catálogo y en todas las pantallas del proceso de compra.',
  },
  {
    q: '¿Necesito tener mi propio dominio?',
    a: 'No. Tu catálogo funciona desde el primer momento en tu dirección de Nubapay. El dominio propio es opcional para quienes quieren una experiencia completamente personalizada.',
  },
  {
    q: '¿Cuándo se activa mi marca?',
    a: 'Una vez que completás la configuración y el equipo de Nubapay habilita tu cuenta. Mientras tanto podés dejar todo listo de antemano.',
  },
]

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        onClick={() => { setOpen(v => !v) }}
        className="flex w-full items-center justify-between py-3.5 text-left text-sm font-medium text-gray-800 hover:text-gray-900 transition"
      >
        <span>{q}</span>
        <ChevronDown
          size={15}
          className="shrink-0 text-gray-400 transition-transform duration-300"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)' }}
        />
      </button>
      <div
        className="grid transition-all duration-300 ease-in-out"
        style={{ gridTemplateRows: open ? '1fr' : '0fr' }}
      >
        <div className="overflow-hidden">
          <p className="pb-4 text-sm text-gray-500 leading-relaxed">{a}</p>
        </div>
      </div>
    </div>
  )
}

function FaqSection() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-gray-50 px-4 mt-2 mb-6">
      <p className="pt-4 pb-1 text-xs font-semibold text-gray-400">Preguntas frecuentes</p>
      {FAQS.map(f => <FaqItem key={f.q} q={f.q} a={f.a} />)}
    </div>
  )
}

export function PartnerBrandView() {
  const router = useRouter()
  const { show: toast, ToastPortal } = useToast()
  const [loading, setLoading] = useState(true)
  const [needsProvision, setNeedsProvision] = useState(false)
  const [tenant, setTenant] = useState<PartnerTenantPayload | null>(null)
  const [blocked, setBlocked] = useState<string | null>(null)

  const [provisionSubdomain, setProvisionSubdomain] = useState('')
  const [provisioning, setProvisioning] = useState(false)
  const [isEditingSubdomain, setIsEditingSubdomain] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [seoTitleSuffix, setSeoTitleSuffix] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [primaryColor, setPrimaryColor] = useState('')
  const [secondaryColor, setSecondaryColor] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [faviconUrl, setFaviconUrl] = useState('')
  const [accentContrastText, setAccentContrastText] = useState('')
  const [showAdvancedAccent, setShowAdvancedAccent] = useState(false)

  const [savingBrand, setSavingBrand] = useState(false)

  const [hostnameDraft, setHostnameDraft] = useState('')
  const [creatingDomain, setCreatingDomain] = useState(false)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [challengeByHostname, setChallengeByHostname] = useState<Record<string, string>>({})

  const [deleteTarget, setDeleteTarget] = useState<TenantDomainRow | null>(null)
  const [showDnsGuide, setShowDnsGuide] = useState(false)


  const refreshAuthProfile = useCallback(async () => {
    const token = getAuthToken()
    if (!token) return
    try {
      const res = await browserFetch(authPaths.me(), { headers: authHeadersJson() })
      if (!res.ok) return
      const body = (await res.json()) as {
        user?: AuthUser
        staff_memberships?: AuthUser['staff_memberships']
      }
      if (!body.user) return
      setAuthSession(token, {
        ...body.user,
        staff_memberships: body.staff_memberships ?? body.user.staff_memberships,
      })
    } catch {
      /* ignore */
    }
  }, [])

  const applyTenant = useCallback((t: PartnerTenantPayload) => {
    setTenant(t)
    const b = t.branding ?? {}
    setDisplayName(strField(b.displayName))
    setSeoTitleSuffix(strField(b.seoTitleSuffix))
    setSeoDescription(strField(b.seoDescription))
    setPrimaryColor(strField(b.primaryColor))
    setSecondaryColor(strField(b.secondaryColor))
    setLogoUrl(strField(b.logoUrl))
    setFaviconUrl(strField(b.faviconUrl))
    setAccentContrastText(strField(b.accentContrastText))
  }, [])

  const primaryBackdropLive = useMemo(
    () => coerceBrandHex(primaryColor) ?? approximateAccentBackgroundHex(primaryColor) ?? '',
    [primaryColor],
  )

  const accentAutoHex = useMemo(() => {
    if (!primaryBackdropLive) return null
    return suggestedContrastOnAccentHex(primaryBackdropLive)
  }, [primaryBackdropLive])

  const accentEffectiveHex = useMemo(() => {
    return resolvedAccentContrastTextLive(primaryColor, accentContrastText)
  }, [primaryColor, accentContrastText])

  const accentManualLowContrast = useMemo(() => {
    if (!primaryBackdropLive) return false
    const manualCanon = coerceBrandHex(accentContrastText.trim())
    if (!manualCanon) return false
    const ratio = wcagContrastBetweenHex(manualCanon, primaryBackdropLive)
    return ratio !== null && ratio < 3
  }, [primaryBackdropLive, accentContrastText])

  const brandAccentBtn = useMemo(
    () => organizerAccentColorsFromDraft(primaryColor, accentContrastText),
    [primaryColor, accentContrastText],
  )

  const load = useCallback(async () => {
    setLoading(true)
    setBlocked(null)
    try {
      const res = await browserFetch(partnerTenantPaths.tenant(), { headers: authHeadersJson() })
      const body = (await res.json()) as TenantApiBody

      if (res.ok) {
        if (body.needs_provision) {
          setNeedsProvision(true)
          setTenant(null)
          setBlocked(null)
          return
        }
        if (body.tenant) {
          setNeedsProvision(false)
          applyTenant(body.tenant)
          setBlocked(null)
          return
        }
        setNeedsProvision(false)
        setTenant(null)
        setBlocked(body.error ?? 'Respuesta inválida del servidor.')
        return
      }

      setNeedsProvision(false)
      setTenant(null)
      setBlocked(body.error ?? `No se pudo cargar (${res.status}).`)
    } catch {
      setNeedsProvision(false)
      setTenant(null)
      setBlocked('No se pudo contactar al servidor.')
    } finally {
      setLoading(false)
    }
  }, [applyTenant])

  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      void load()
    })
    return () => window.cancelAnimationFrame(id)
  }, [load])

  const handleProvision = async () => {
    const raw = provisionSubdomain.trim().toLowerCase()
    if (raw.length < 2) {
      toast('El subdominio debe tener al menos 2 caracteres.', 'error')
      return
    }
    setProvisioning(true)
    try {
      const res = isEditingSubdomain
        ? await browserFetch(partnerTenantPaths.tenant(), {
            method: 'PATCH',
            headers: authHeadersJson(),
            body: JSON.stringify({ subdomain: raw }),
          })
        : await browserFetch(partnerTenantPaths.provision(), {
            method: 'POST',
            headers: authHeadersJson(),
            body: JSON.stringify({ subdomain: raw }),
          })
      const body = (await res.json()) as TenantApiBody & { code?: string }
      if (!res.ok) {
        toast(body.error ?? (isEditingSubdomain ? 'No se pudo actualizar el subdominio' : 'No se pudo crear el espacio'), 'error')
        return
      }
      if (body.tenant) {
        applyTenant(body.tenant)
        setNeedsProvision(false)
        setIsEditingSubdomain(false)
        setProvisionSubdomain('')
        await refreshAuthProfile()
        toast(isEditingSubdomain ? 'Subdominio actualizado' : 'Listo: ya tenés un espacio dedicado para tu marca y catálogo.', 'success')
        router.refresh()
        return
      }
      toast('No se recibieron datos del servidor', 'error')
    } catch {
      toast('No se pudo contactar al servidor', 'error')
    } finally {
      setProvisioning(false)
    }
  }

  const handleSaveBranding = async () => {
    if (!tenant) return
    if (!seoTitleSuffix.trim()) {
      toast('El título en el navegador es requerido.', 'error')
      return
    }
    if (!seoDescription.trim()) {
      toast('La descripción es requerida.', 'error')
      return
    }
    const trimmedAccent = accentContrastText.trim()
    setSavingBrand(true)
    try {
      const res = await browserFetch(partnerTenantPaths.tenant(), {
        method: 'PATCH',
        headers: authHeadersJson(),
        body: JSON.stringify({
          branding: {
            displayName: displayName.trim() || null,
            seoTitleSuffix: seoTitleSuffix.trim() || null,
            seoDescription: seoDescription.trim() || null,
            primaryColor:
              coerceBrandHex(primaryColor) ?? (primaryColor.trim().length ? primaryColor.trim() : null),
            secondaryColor:
              coerceBrandHex(secondaryColor) ??
              (secondaryColor.trim().length ? secondaryColor.trim() : null),
            logoUrl: logoUrl.trim() || null,
            faviconUrl: faviconUrl.trim() || null,
            accentContrastText:
              trimmedAccent.length === 0 ? null : coerceBrandHex(trimmedAccent) ?? trimmedAccent,
          },
        }),
      })
      const body = (await res.json()) as { tenant?: PartnerTenantPayload; error?: string }
      if (!res.ok || !body.tenant) {
        toast(body.error ?? 'No se pudo guardar', 'error')
        return
      }
      applyTenant(body.tenant)
      router.refresh()
      toast('Marca actualizada', 'success')
    } catch {
      toast('No se pudo contactar al servidor', 'error')
    } finally {
      setSavingBrand(false)
    }
  }

  const handleAddDomain = async () => {
    const host = hostnameDraft.trim().toLowerCase()
    if (host.length < 3) {
      toast('Ingresá un hostname válido', 'error')
      return
    }
    setCreatingDomain(true)
    try {
      const res = await browserFetch(partnerTenantPaths.domains(), {
        method: 'POST',
        headers: authHeadersJson(),
        body: JSON.stringify({ hostname: host }),
      })
      const body = (await res.json()) as {
        domain?: TenantDomainRow & { dns_txt_challenge?: string; vercel_warning?: string }
        error?: string
      }
      if (!res.ok || !body.domain) {
        toast(body.error ?? 'No se pudo registrar el dominio', 'error')
        return
      }
      if (body.domain.dns_txt_challenge) {
        setChallengeByHostname(prev => ({ ...prev, [body.domain!.hostname]: body.domain!.dns_txt_challenge! }))
      }
      setHostnameDraft('')
      if (body.domain.vercel_warning) {
        toast(body.domain.vercel_warning, 'error')
      } else {
        toast('Dominio registrado y agregado a Vercel. Ahora agregá los DNS y verificá.', 'success')
      }
      await load()
    } catch {
      toast('No se pudo contactar al servidor', 'error')
    } finally {
      setCreatingDomain(false)
    }
  }

  const handleVerifyDomain = async (domainId: string) => {
    setVerifyingId(domainId)
    try {
      const res = await browserFetch(partnerTenantPaths.domainVerify(domainId), {
        method: 'POST',
        headers: authHeadersJson(),
      })
      const body = (await res.json()) as { domain?: TenantDomainRow; error?: string; already_verified?: boolean }
      if (!res.ok) {
        toast(body.error ?? 'No se pudo verificar', 'error')
        return
      }
      toast(body.already_verified ? 'Ya estaba verificado' : 'Dominio verificado', 'success')
      await load()
    } catch {
      toast('No se pudo contactar al servidor', 'error')
    } finally {
      setVerifyingId(null)
    }
  }

  const handleDeleteDomain = async () => {
    if (!deleteTarget) return
    const { id, hostname } = deleteTarget
    setDeleteTarget(null)
    try {
      const res = await browserFetch(partnerTenantPaths.domain(id), {
        method: 'DELETE',
        headers: authHeadersJson(),
      })
      if (!res.ok) {
        const body = (await res.json()) as { error?: string }
        toast(body.error ?? 'No se pudo eliminar', 'error')
        return
      }
      setChallengeByHostname(prev => {
        const next = { ...prev }
        delete next[hostname]
        return next
      })
      toast('Dominio eliminado', 'success')
      await load()
    } catch {
      toast('No se pudo contactar al servidor', 'error')
    }
  }

  if (loading) {
    return (
      <div className="flex max-w-3xl flex-col items-center justify-center gap-3 py-24 mx-auto px-4">
        <Spinner size="lg" className="text-gray-900" />
        <p className="text-sm text-gray-400">Cargando marca…</p>
        <ToastPortal />
      </div>
    )
  }

  if (needsProvision) {
    const previewSubdomain = provisionSubdomain.trim().toLowerCase()

    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <OrganizerToolHeading
          prefix={<Palette size={24} strokeWidth={1.75} />}
          title={isEditingSubdomain ? 'Cambiar subdominio' : 'Personalizá tu marca'}
          description={
            isEditingSubdomain
              ? 'Elegí el nuevo nombre corto para tu espacio en Nubapay.'
              : 'Agregá el logo, los colores y el nombre de tu organización. Tus compradores los van a ver en el catálogo.'
          }
        />

        {!isEditingSubdomain && (
          <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-3 text-sm text-gray-600">
            {[
              { icon: <Palette size={16} strokeWidth={1.75} />, label: 'Colores y logo propios' },
              { icon: <Globe size={16} strokeWidth={1.75} />, label: 'Tu propio dominio web' },
              { icon: <ShoppingCart size={16} strokeWidth={1.75} />, label: 'Catálogo con tu identidad' },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2.5 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3">
                <span className="text-gray-500 shrink-0">{icon}</span>
                <span className="text-[14px] font-medium text-gray-700">{label}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white px-4 py-5">
          <p className="text-sm font-medium text-gray-900 mb-4">
            {isEditingSubdomain ? 'Nuevo nombre de subdominio' : 'Primero, elegí un nombre corto para tu organización.'}
          </p>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-gray-700">Nombre de tu organización</span>
            <div className="flex gap-2 items-center">
              <input
                className={`${inputClass} font-mono`}
                value={provisionSubdomain}
                onChange={e => { setProvisionSubdomain(e.target.value.toLowerCase().replace(/\s/g, '-').slice(0, 25)) }}
                placeholder="ej. festival-costa"
                autoComplete="off"
              />
              {isEditingSubdomain && (
                <button
                  type="button"
                  onClick={() => { setNeedsProvision(false); setIsEditingSubdomain(false) }}
                  disabled={provisioning}
                  className="shrink-0 rounded-full px-5 py-3 text-sm font-semibold border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition"
                >
                  Cancelar
                </button>
              )}
              <button
                type="button"
                onClick={() => void handleProvision()}
                disabled={provisioning || previewSubdomain.length < 2}
                className="shrink-0 rounded-full px-5 py-3 text-sm font-semibold bg-[#c6ff00] text-[#0a0a0f] hover:opacity-90 disabled:opacity-40 transition"
              >
                {provisioning ? (isEditingSubdomain ? 'Guardando…' : 'Configurando…') : 'Confirmar'}
              </button>
            </div>
            <p className="text-[11px] text-gray-400">
              Letras minúsculas, números y guiones. Mínimo 2 caracteres.
            </p>
            <div
              className="grid transition-all duration-300 ease-in-out"
              style={{ gridTemplateRows: previewSubdomain.length >= 18 ? '1fr' : '0fr' }}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col gap-1 pt-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[11px] font-medium transition-colors duration-300 ${previewSubdomain.length === 25 ? 'text-red-500' : 'text-amber-500'}`}>
                      {previewSubdomain.length === 25 ? 'Límite alcanzado' : `Te quedan ${25 - previewSubdomain.length} caracteres`}
                    </span>
                    <span className={`text-[11px] tabular-nums font-mono transition-colors duration-300 ${previewSubdomain.length === 25 ? 'text-red-500' : 'text-amber-500'}`}>
                      {previewSubdomain.length}/25
                    </span>
                  </div>
                  <div className="h-1 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${previewSubdomain.length === 25 ? 'bg-red-400' : 'bg-amber-400'}`}
                      style={{ width: `${(previewSubdomain.length / 25) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div
            className="grid transition-all duration-300 ease-in-out"
            style={{ gridTemplateRows: previewSubdomain.length >= 2 ? '1fr' : '0fr' }}
          >
            <div className="overflow-hidden">
              <div className="mt-3 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                {/* Chrome bar */}
                <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50 px-3 py-2">
                  <div className="flex gap-1.5 shrink-0">
                    <span className="h-2.5 w-2.5 rounded-full bg-red-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                    <span className="h-2.5 w-2.5 rounded-full bg-green-400" />
                  </div>
                  {/* Address bar */}
                  <div className="flex flex-1 items-center gap-1.5 rounded-md bg-white border border-gray-200 px-2.5 py-1 min-w-0">
                    <Lock size={10} className="shrink-0 text-gray-400" />
                    <span className="text-[11px] font-mono text-gray-500 truncate">
                      <span className="text-gray-400">https://</span>
                      <span className="font-semibold text-gray-800">{previewSubdomain}</span>
                      <span className="text-gray-500">.nubapay.com</span>
                    </span>
                  </div>
                </div>
                {/* Page skeleton */}
                <div className="px-4 py-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div className="h-6 w-6 rounded-md bg-gray-100 shrink-0" />
                    <div className="h-3 w-28 rounded-full bg-gray-100" />
                  </div>
                  <div className="mt-1 h-2.5 w-3/4 rounded-full bg-gray-100" />
                  <div className="h-2.5 w-1/2 rounded-full bg-gray-100" />
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    <div className="h-14 rounded-lg bg-gray-100" />
                    <div className="h-14 rounded-lg bg-gray-100" />
                    <div className="h-14 rounded-lg bg-gray-100" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {!isEditingSubdomain && <FaqSection />}
        <ToastPortal />
      </div>
    )
  }

  if (blocked || !tenant) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <OrganizerToolHeading
          prefix={<Palette size={24} strokeWidth={1.75} />}
          title="Marca y dominios"
          description="Gestión de identidad para tu cuenta."
        />
        <p className="text-sm text-gray-600">{blocked ?? 'No disponible.'}</p>
        <ToastPortal />
      </div>
    )
  }

  const whitelabelOff = !tenant.partner_whitelabel_enabled

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <OrganizerToolHeading
        prefix={<Palette size={24} strokeWidth={1.75} />}
        title="Tu marca"
        description="Personalizá cómo ven tu organización los compradores: colores, logo y nombre."
      />

      {whitelabelOff && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          Tu marca todavía no está visible al público. Podés configurarla ahora y se activará cuando el equipo de Nubapay habilite tu cuenta.
        </div>
      )}

      <div className="mb-10 rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-xs text-gray-600">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-gray-900">Tu dirección en Nubapay:</span>{' '}
            <code className="rounded-md bg-white px-1.5 py-0.5 border border-gray-200">{tenant.subdomain}.nubapay.com</code>
          </div>
          <button
            type="button"
            aria-label="Cambiar nombre"
            onClick={() => { setProvisionSubdomain(tenant.subdomain); setIsEditingSubdomain(true); setNeedsProvision(true) }}
            className="ml-3 shrink-0 rounded-lg p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-200 transition"
          >
            <Pencil size={13} />
          </button>
        </div>
      </div>

      {/* ── Identidad visual ── */}
      <section className="flex flex-col gap-8 mb-14">
        <h2 className="text-sm font-semibold text-gray-400">Identidad visual</h2>

        {/* Subsección: Texto */}
        <div className="flex flex-col gap-4">
          <p className="text-xs font-semibold text-gray-400 border-b border-gray-100 pb-2">Nombre y descripción</p>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Nombre visible</span>
            <input className={`${inputClass} mt-2`} value={displayName} onChange={e => { setDisplayName(e.target.value) }} />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Título en el navegador</span>
            <input className={`${inputClass} mt-2`} value={seoTitleSuffix} onChange={e => { setSeoTitleSuffix(e.target.value) }} placeholder="ej. · Festival Costa" />
            {/* Tab bar preview */}
            <div className="mt-2 rounded-xl border border-gray-200 bg-[#e8eaed] overflow-hidden">
              {/* Tab strip */}
              <div className="flex items-end px-2 pt-2 gap-0.5">
                {/* Active tab */}
                <div className="relative flex items-center gap-1.5 bg-white rounded-t-lg px-3 py-1.5 min-w-0 max-w-[240px] shadow-sm border border-b-0 border-gray-200">
                  {/* Favicon placeholder */}
                  <div className="shrink-0 h-3.5 w-3.5 rounded-sm bg-gray-200" />
                  <span className="text-[11px] text-gray-800 truncate font-medium leading-none">
                    {seoTitleSuffix.trim()
                      ? `Catálogo ${seoTitleSuffix.trim()}`
                      : <span className="text-gray-400 italic">Catálogo</span>}
                  </span>
                  <button type="button" tabIndex={-1} className="ml-1 shrink-0 rounded-full p-0.5 text-gray-400 hover:bg-gray-100 pointer-events-none">
                    <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1 1l6 6M7 1L1 7" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/></svg>
                  </button>
                </div>
                {/* Inactive tab */}
                <div className="flex items-center gap-1.5 rounded-t-lg px-3 py-1.5 min-w-0 max-w-[160px] opacity-60">
                  <div className="shrink-0 h-3.5 w-3.5 rounded-sm bg-gray-300" />
                  <span className="text-[11px] text-gray-500 truncate leading-none">Nueva pestaña</span>
                </div>
              </div>
              {/* Address bar row */}
              <div className="bg-white border-t border-gray-200 px-3 py-1.5 flex items-center gap-2">
                <div className="flex gap-1">
                  <div className="h-4 w-4 rounded-full bg-gray-100" />
                  <div className="h-4 w-4 rounded-full bg-gray-100" />
                  <div className="h-4 w-4 rounded-full bg-gray-100" />
                </div>
                <div className="flex-1 flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-1">
                  <Lock size={9} className="text-gray-400 shrink-0" />
                  <span className="text-[10px] text-gray-500 font-mono truncate">{tenant.subdomain}.nubapay.com</span>
                </div>
              </div>
            </div>
          </label>

          <label className="block">
            <span className="text-sm font-medium text-gray-700">Descripción</span>
            <textarea
              className={`${textareaClass} mt-2`}
              value={seoDescription}
              onChange={e => { setSeoDescription(e.target.value) }}
              rows={3}
              placeholder="Describí brevemente tu organización o evento."
            />
            <p className="mt-1.5 text-[11px] text-gray-500 leading-relaxed">
              Aparece en buscadores y al compartir el link del catálogo.
            </p>
          </label>
        </div>

        {/* Subsección: Colores — aparece cuando hay nombre, título y descripción */}
        <div
          className="grid transition-all duration-500 ease-in-out"
          style={{ gridTemplateRows: displayName.trim() && seoTitleSuffix.trim() && seoDescription.trim() ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-4 pt-1">
              <p className="text-xs font-semibold text-gray-400 border-b border-gray-100 pb-2">Colores</p>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <ColorInput label="Color principal" value={primaryColor} onChange={setPrimaryColor} />
                <ColorInput label="Color secundario" value={secondaryColor} onChange={setSecondaryColor} />
              </div>

              <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-[11px] font-medium text-gray-500">Texto sobre color principal:</span>
                    <span
                      className="inline-flex rounded-full px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-black/5"
                      style={{ backgroundColor: primaryBackdropLive || '#e5e7eb', color: accentEffectiveHex }}
                    >
                      Vista previa
                    </span>
                    <code className="text-[11px] font-mono text-gray-500">{accentEffectiveHex}</code>
                  </div>
                  <button
                    type="button"
                    onClick={() => { setShowAdvancedAccent(v => !v) }}
                    className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-700 transition shrink-0"
                  >
                    Avanzado {showAdvancedAccent ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </button>
                </div>
                {showAdvancedAccent && (
                  <div className="flex flex-col gap-2 pt-1 border-t border-gray-100">
                    <p className="text-[11px] text-gray-500 leading-relaxed">
                      Por defecto se elige automáticamente (
                      {accentAutoHex ? (
                        <>sugerido <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px]">{accentAutoHex}</code></>
                      ) : ('ingresá el color principal primero')}
                      ). Podés forzarlo con un #hex distinto.
                    </p>
                    <label className="block">
                      <span className="text-[11px] font-medium text-gray-600 mb-1.5 block">Override manual (#hex)</span>
                      <input
                        type="text"
                        className={`${inputClass} font-mono`}
                        value={accentContrastText}
                        onChange={e => { setAccentContrastText(e.target.value) }}
                        placeholder="Vacío = automático"
                        autoComplete="off"
                      />
                    </label>
                    {accentManualLowContrast && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        Ese texto sobre el fondo principal tiene menos contraste habitual (menos de 3:1 según WCAG). Lo aplicamos si
                        lo querés como marca — revisá cómo se lee en vivo.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Subsección: Imágenes — aparece cuando hay color principal */}
        <div
          className="grid transition-all duration-500 ease-in-out"
          style={{ gridTemplateRows: coerceBrandHex(primaryColor) ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <div className="flex flex-col gap-4 pt-1">
              <p className="text-xs font-semibold text-gray-400 border-b border-gray-100 pb-2">Imágenes</p>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Logo</span>
                <input
                  className={`${inputClass} mt-2`}
                  value={logoUrl}
                  onChange={e => { setLogoUrl(e.target.value) }}
                  placeholder="https://..."
                />
                <p className="mt-1.5 text-[11px] text-gray-500">Pegá la dirección de tu logo (PNG o SVG recomendado).</p>
                <ImagePreview url={logoUrl} label="Logo" />
              </label>

              <label className="block">
                <span className="text-sm font-medium text-gray-700">Ícono de la pestaña</span>
                <input
                  className={`${inputClass} mt-2`}
                  value={faviconUrl}
                  onChange={e => { setFaviconUrl(e.target.value) }}
                  placeholder="https://..."
                />
                <p className="mt-1.5 text-[11px] text-gray-500">La imagen pequeña que aparece en la pestaña del navegador (favicon).</p>
                <ImagePreview url={faviconUrl} label="Favicon" />
              </label>
            </div>
          </div>
        </div>

        {/* Guardar — aparece cuando hay imágenes o color */}
        <div
          className="grid transition-all duration-500 ease-in-out"
          style={{ gridTemplateRows: coerceBrandHex(primaryColor) ? '1fr' : '0fr' }}
        >
          <div className="overflow-hidden">
            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => void handleSaveBranding()}
                disabled={savingBrand}
                className="rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
                style={{ backgroundColor: brandAccentBtn.bg, color: brandAccentBtn.fg }}
              >
                {savingBrand ? 'Guardando…' : 'Guardar marca'}
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Dominios externos ── */}
      <section className="flex flex-col gap-4 mb-24">
        <h2 className="text-sm font-semibold text-gray-400">Tu propio dominio</h2>

        <p className="text-sm text-gray-600">
          Si tenés un dominio propio (ej. <code className="text-xs bg-gray-100 rounded px-1">pedidos.tumarca.com</code>), podés conectarlo para que tu catálogo aparezca bajo esa dirección.
        </p>

        {/* Guía DNS colapsable */}
        <div className="rounded-2xl border border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={() => { setShowDnsGuide(v => !v) }}
            className="flex w-full items-center justify-between px-4 py-3 text-[14px] font-semibold text-gray-700 hover:text-gray-900 transition"
          >
            <span>¿Cómo conecto mi dominio?</span>
            {showDnsGuide ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showDnsGuide && (
            <div className="px-4 pb-4 flex flex-col gap-3 text-[14px] text-gray-600 leading-relaxed border-t border-gray-100 pt-3">
              <ol className="flex flex-col gap-3">
                <li className="flex gap-2.5">
                  <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">1</span>
                  <span>Ingresá tu dominio en el campo de abajo y hacé click en <strong>Agregar</strong>. Vamos a darte un código de verificación.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">2</span>
                  <span>Copiá ese código y pegalo como un registro <code className="bg-white border border-gray-200 rounded px-1">TXT</code> en el panel de tu proveedor de dominio (GoDaddy, Namecheap, Cloudflare, etc.).</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">3</span>
                  <span>También creá un registro <code className="bg-white border border-gray-200 rounded px-1">CNAME</code> que apunte tu dominio hacia <code className="bg-white border border-gray-200 rounded px-1 select-all">cname.vercel-dns.com</code>.</span>
                </li>
                <li className="flex gap-2.5">
                  <span className="shrink-0 flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-600">4</span>
                  <span>Volvé acá y presioná <strong>Verificar</strong>. Puede tardar hasta 48 hs en activarse.</span>
                </li>
              </ol>
              <p className="text-[11px] text-gray-900 bg-gray-200 rounded-lg px-3 py-2">
                Guardá el código de verificación antes de cerrar la página — no lo volvemos a mostrar por seguridad.
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="text-sm font-medium text-gray-700">Dirección web</span>
            <input
              className={`${inputClass} mt-2`}
              value={hostnameDraft}
              onChange={e => { setHostnameDraft(e.target.value) }}
              placeholder="pedidos.tumarca.com"
            />
          </label>
          <button
            type="button"
            onClick={() => void handleAddDomain()}
            disabled={creatingDomain}
            className="rounded-full px-5 py-3 text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 shrink-0"
          >
            {creatingDomain ? '…' : 'Agregar'}
          </button>
        </div>

        <ul className="flex flex-col gap-3 mt-2">
          {tenant.domains.map(d => (
            <li key={d.id} className="rounded-2xl border border-gray-200 bg-white p-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{d.hostname}</p>
                  <p className={`text-xs font-medium mt-1 ${d.verified ? 'text-green-700' : 'text-amber-700'}`}>
                    {d.verified ? '✓ Verificado y activo' : 'Pendiente — agregá los registros DNS y luego verificá'}
                  </p>

                  {!d.verified && (
                    <div className="mt-3 flex flex-col gap-2">
                      <DnsRow
                        type={isApex(d.hostname) ? 'A' : 'CNAME'}
                        name={dnsNameLabel(d.hostname)}
                        value={isApex(d.hostname) ? '216.198.79.1' : 'cname.vercel-dns.com'}
                      />
                      {isApex(d.hostname) && (
                        <DnsRow
                          type="CNAME"
                          name="www"
                          value="cname.vercel-dns.com"
                        />
                      )}
                      {challengeByHostname[d.hostname] ? (
                        <DnsRow
                          type="TXT"
                          name={dnsNameLabel(d.hostname)}
                          value={challengeByHostname[d.hostname]}
                        />
                      ) : (
                        <p className="text-[11px] text-gray-400 italic">
                          Recargá la página para volver a ver el valor TXT (guardalo antes de cerrar).
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex gap-2 shrink-0">
                  {!d.verified && (
                    <button
                      type="button"
                      onClick={() => void handleVerifyDomain(d.id)}
                      disabled={verifyingId === d.id}
                      className="rounded-full px-4 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: brandAccentBtn.bg, color: brandAccentBtn.fg }}
                    >
                      {verifyingId === d.id ? '…' : 'Verificar'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { setDeleteTarget(d) }}
                    className="rounded-full px-4 py-2 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100"
                  >
                    Eliminar
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Modal confirmación eliminar dominio */}
      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => { setDeleteTarget(null) }}
        title="¿Eliminar dominio?"
      >
        <p className="text-sm text-gray-600 mb-6">
          Vas a eliminar <strong>{deleteTarget?.hostname}</strong>. Esta acción no se puede deshacer.
        </p>
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => { setDeleteTarget(null) }}
            className="rounded-full px-5 py-2.5 text-sm font-semibold border border-gray-200 hover:bg-gray-50 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={() => void handleDeleteDomain()}
            className="rounded-full px-5 py-2.5 text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition"
          >
            Eliminar
          </button>
        </div>
      </Modal>

      <ToastPortal />
    </div>
  )
}
