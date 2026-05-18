'use client'

import { Palette } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useCallback, useEffect, useMemo, useState } from 'react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
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

export function PartnerBrandView() {
  const router = useRouter()
  const { show: toast, ToastPortal } = useToast()
  const [loading, setLoading] = useState(true)
  const [needsProvision, setNeedsProvision] = useState(false)
  const [tenant, setTenant] = useState<PartnerTenantPayload | null>(null)
  const [blocked, setBlocked] = useState<string | null>(null)

  const [provisionSubdomain, setProvisionSubdomain] = useState('')
  const [provisioning, setProvisioning] = useState(false)

  const [displayName, setDisplayName] = useState('')
  const [seoTitleSuffix, setSeoTitleSuffix] = useState('')
  const [seoDescription, setSeoDescription] = useState('')
  const [primaryColor, setPrimaryColor] = useState('')
  const [secondaryColor, setSecondaryColor] = useState('')
  const [logoUrl, setLogoUrl] = useState('')
  const [faviconUrl, setFaviconUrl] = useState('')
  const [accentContrastText, setAccentContrastText] = useState('')

  const [savingBrand, setSavingBrand] = useState(false)

  const [hostnameDraft, setHostnameDraft] = useState('')
  const [creatingDomain, setCreatingDomain] = useState(false)
  const [verifyingId, setVerifyingId] = useState<string | null>(null)
  const [challengeByHostname, setChallengeByHostname] = useState<Record<string, string>>({})

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

  const primaryCanon = useMemo(() => coerceBrandHex(primaryColor) ?? '', [primaryColor])
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

  useEffect(() => {
    if (process.env.NEXT_PUBLIC_DEBUG_TENANT_THEME !== '1') return
    const manualCanon = coerceBrandHex(accentContrastText.trim())
    const ratio =
      primaryBackdropLive.length > 0 && manualCanon
        ? wcagContrastBetweenHex(manualCanon, primaryBackdropLive)
        : null
    console.warn('[nubapay organizer-accent] marca / formulario (botones borrador)', {
      primaryInput: primaryColor,
      accentContrastInput: accentContrastText,
      primaryCoerced: primaryCanon || null,
      primaryBackdropLive: primaryBackdropLive || null,
      suggestedAuto: accentAutoHex,
      effectivePreview: accentEffectiveHex,
      buttonDraftSurface: brandAccentBtn,
      manualContrastRatio: ratio,
    })
  }, [
    primaryColor,
    accentContrastText,
    primaryCanon,
    primaryBackdropLive,
    accentAutoHex,
    accentEffectiveHex,
    brandAccentBtn,
  ])

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
      const res = await browserFetch(partnerTenantPaths.provision(), {
        method: 'POST',
        headers: authHeadersJson(),
        body: JSON.stringify({ subdomain: raw }),
      })
      const body = (await res.json()) as TenantApiBody & { code?: string }
      if (!res.ok) {
        toast(body.error ?? 'No se pudo crear el espacio', 'error')
        return
      }
      if (body.tenant) {
        applyTenant(body.tenant)
        setNeedsProvision(false)
        setProvisionSubdomain('')
        await refreshAuthProfile()
        toast('Listo: ya tenés un espacio dedicado para tu marca y catálogo.', 'success')
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

  const handleDeleteDomain = async (domainId: string, hostname: string) => {
    try {
      const res = await browserFetch(partnerTenantPaths.domain(domainId), {
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
    return (
      <div className="max-w-3xl mx-auto px-4 py-10">
        <OrganizerToolHeading
          prefix={<Palette size={24} strokeWidth={1.75} />}
          title="Activá tu marca blanca"
          description={
            <>
              Tu cuenta está en la instancia compartida de Nubapay. Creá un <strong>subdominio dedicado</strong> para
              tu organización (tu catálogo y panel quedarán bajo ese espacio cuando uses el mismo host público que
              definas en DNS).
            </>
          }
        />

        <div className="mb-8 rounded-2xl border border-gray-200 bg-white px-4 py-5">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-600">Identificador (subdominio)</span>
            <input
              className={`${inputClass} mt-2 font-mono`}
              value={provisionSubdomain}
              onChange={e => { setProvisionSubdomain(e.target.value.trim().toLowerCase()) }}
              placeholder="ej. festival-costa"
              autoComplete="off"
            />
          </label>
          <p className="mt-3 text-[13px] text-gray-600 leading-relaxed">
            Solo letras minúsculas, números y guiones medios (2–63 caracteres). No podés usar palabras reservadas como{' '}
            <code className="text-xs">platform</code> ni <code className="text-xs">www</code>. Los eventos de tu cuenta
            y el equipo sólo-organizador ligado pasan automáticamente a este tenant.
          </p>
          <button
            type="button"
            onClick={() => void handleProvision()}
            disabled={provisioning}
            className="mt-6 w-full sm:w-auto rounded-full px-6 py-3 text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50 transition"
          >
            {provisioning ? 'Creando…' : 'Crear espacio dedicado'}
          </button>
        </div>

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
        title="Marca y dominios"
        description="Colores y metadatos visibles cuando el programa de marca blanca está activado para tu subdominio o dominio verificado."
        actions={
          <button
            type="button"
            onClick={handleSaveBranding}
            disabled={savingBrand}
            className="rounded-full px-5 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50 transition"
            style={{ backgroundColor: brandAccentBtn.bg, color: brandAccentBtn.fg }}
          >
            {savingBrand ? 'Guardando…' : 'Guardar marca'}
          </button>
        }
      />

      {whitelabelOff && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
          El whitelabel público no está habilitado para tu tenant todavía. Podés cargar marca y registrar dominios; el
          público sigue viendo identidad Nubapay hasta que se active desde operaciones/soporte.
        </div>
      )}

      <div className="mb-10 rounded-2xl border border-gray-200 bg-gray-50/60 px-4 py-3 text-xs text-gray-600">
        <span className="font-semibold text-gray-900">Subdominio de la cuenta:</span>{' '}
        <code className="rounded-md bg-white px-1.5 py-0.5 border border-gray-200">{tenant.subdomain}</code>
      </div>

      <section className="flex flex-col gap-4 mb-14">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Identidad visual</h2>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-600">Nombre visible</span>
          <input className={`${inputClass} mt-2`} value={displayName} onChange={e => { setDisplayName(e.target.value) }} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-600">Sufijo título SEO (opcional)</span>
          <input className={`${inputClass} mt-2`} value={seoTitleSuffix} onChange={e => { setSeoTitleSuffix(e.target.value) }} />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-600">Descripción SEO (opcional)</span>
          <textarea
            className={`${textareaClass} mt-2`}
            value={seoDescription}
            onChange={e => {
              setSeoDescription(e.target.value)
            }}
            rows={3}
            placeholder="Breve texto para meta description del catálogo y del panel en tu dominio."
          />
          <p className="mt-1.5 text-[11px] text-gray-500 leading-relaxed">
            Si está vacío, el sitio arma una descripción por defecto según el nombre visible o subdominio.
          </p>
        </label>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-600">Color principal (hex)</span>
            <input
              type="text"
              className={`${inputClass} mt-2 font-mono`}
              value={primaryColor}
              onChange={e => { setPrimaryColor(e.target.value) }}
              placeholder="#000000"
            />
          </label>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-600">Color secundario (hex)</span>
            <input
              type="text"
              className={`${inputClass} mt-2 font-mono`}
              value={secondaryColor}
              onChange={e => { setSecondaryColor(e.target.value) }}
              placeholder="#000000"
            />
          </label>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-white px-4 py-4 flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-600">
              Texto sobre el color principal
            </span>
            <p className="text-[11px] text-gray-500 leading-relaxed">
              Vacío = automático (
              {accentAutoHex ? (
                <>
                  sugerido <code className="rounded bg-gray-100 px-1 py-0.5 font-mono text-[10px]">{accentAutoHex}</code>
                </>
              ) : (
                'ingresá el color principal (con o sin #)'
              )}
              ). Con #hex válido distinto del principal siempre se usa tu color (vacío ⇒ automático). Ratio WCAG bajo también se aplica: acá sólo recomendamos legibilidad.
            </p>
          </div>
          <label className="block">
            <span className="text-[11px] font-medium text-gray-600 mb-1.5 block">Override manual (#hex)</span>
            <input
              type="text"
              className={`${inputClass} font-mono`}
              value={accentContrastText}
              onChange={e => {
                setAccentContrastText(e.target.value)
              }}
              placeholder="Vacío = automático"
              autoComplete="off"
            />
          </label>
          {accentManualLowContrast ? (
            <p className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
              Ese texto sobre el fondo principal tiene menos contraste habitual (menos de 3:1 según WCAG). Lo aplicamos si
              lo querés como marca — revisá cómo se lee en vivo.
            </p>
          ) : null}
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <span className="text-[11px] font-medium text-gray-500">
              En uso: <code className="font-mono text-gray-800">{accentEffectiveHex}</code>
            </span>
            <span
              className="inline-flex rounded-full px-4 py-2 text-sm font-semibold shadow-sm ring-1 ring-black/5"
              style={{
                backgroundColor: primaryBackdropLive || '#e5e7eb',
                color: accentEffectiveHex,
              }}
            >
              Vista previa
            </span>
          </div>
        </div>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-600">URL logo</span>
          <input className={`${inputClass} mt-2`} value={logoUrl} onChange={e => { setLogoUrl(e.target.value) }} placeholder="https://..." />
        </label>

        <label className="block">
          <span className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-600">URL favicon</span>
          <input className={`${inputClass} mt-2`} value={faviconUrl} onChange={e => { setFaviconUrl(e.target.value) }} placeholder="https://..." />
        </label>
      </section>

      <section className="flex flex-col gap-4 mb-24">
        <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-gray-400">Dominios externos</h2>

        <p className="text-sm text-gray-600">
          Agregá un hostname (sin protocolo). Creá un registro TXT con el valor que te damos para verificar. Vercel y tu
          proveedor DNS deben apuntar el host a este proyecto.
        </p>

        <p className="text-[11px] text-gray-500">
          Conservá una copia del valor TXT después de registrar un dominio: por seguridad no lo volvemos a mostrar al
          recargar.
        </p>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <label className="block flex-1">
            <span className="text-xs font-semibold uppercase tracking-[0.1em] text-gray-600">Hostname</span>
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
            {creatingDomain ? '…' : 'Registrar'}
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
                        type="CNAME"
                        name={d.hostname}
                        value="cname.vercel-dns.com"
                      />
                      {challengeByHostname[d.hostname] ? (
                        <DnsRow
                          type="TXT"
                          name={d.hostname}
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
                  {!d.verified ? (
                    <button
                      type="button"
                      onClick={() => void handleVerifyDomain(d.id)}
                      disabled={verifyingId === d.id}
                      className="rounded-full px-4 py-2 text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                      style={{ backgroundColor: brandAccentBtn.bg, color: brandAccentBtn.fg }}
                    >
                      {verifyingId === d.id ? '…' : 'Verificar'}
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => void handleDeleteDomain(d.id, d.hostname)}
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

      <ToastPortal />
    </div>
  )
}
