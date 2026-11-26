'use client'

import { useState } from 'react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { useParkingOwnerAccount } from '@/components/parkingOwner/ParkingOwnerAccountContext'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { usePublicOrigin } from '@/lib/hooks/usePublicOrigin'
import { patchParkingOwnerAccount } from '@/lib/parkingOwner'

/** Mientras se escribe: minúsculas y guiones (el backend termina de normalizarlo al guardar). */
function draftSlug(v: string): string {
  return v.toLowerCase().replace(/\s+/g, '-').replace(/[^\p{L}\p{N}-]/gu, '').replace(/-{2,}/g, '-')
}

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-gray-400'

/** Datos generales del estacionamiento. El mapa se carga en Vehículos; los cobros, en Cobros. */
export function ParkingOwnerSettingsView() {
  const { account, setAccount } = useParkingOwnerAccount()
  const origin = usePublicOrigin()
  const [name, setName] = useState(account.name)
  const [slug, setSlug] = useState(account.slug)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const { show, ToastPortal } = useToast()

  const trimmedName = name.trim()
  const cleanSlug = slug.replace(/^-+|-+$/g, '')
  const nameChanged = trimmedName !== account.name
  const slugChanged = cleanSlug !== account.slug
  const nameValid = trimmedName.length >= 2
  const slugValid = cleanSlug.length >= 3
  const dirty = nameChanged || slugChanged

  const save = async () => {
    if (!dirty || !nameValid || !slugValid || saving) return
    setSaving(true)
    setError('')
    const r = await patchParkingOwnerAccount({
      ...(nameChanged ? { name: trimmedName } : {}),
      ...(slugChanged ? { slug: cleanSlug } : {}),
    })
    setSaving(false)
    if (r.ok) {
      setAccount(r.data)
      setName(r.data.name)
      setSlug(r.data.slug)
      show('Cambios guardados.', 'success')
    } else {
      setError(r.error)
    }
  }

  return (
    <div className="max-w-xl">
      <OrganizerToolHeading
        title="Configuración"
        description="Datos generales de tu estacionamiento. Los ven los organizadores en el formulario de solicitud."
      />

      <form
        onSubmit={e => {
          e.preventDefault()
          void save()
        }}
        className="space-y-5 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
      >
        <div>
          <label htmlFor="parking-name" className="mb-1.5 block text-[12px] font-semibold text-gray-600">
            Nombre del estacionamiento
          </label>
          <input
            id="parking-name"
            type="text"
            value={name}
            maxLength={150}
            onChange={e => setName(e.target.value)}
            className={inputClass}
          />
          {!nameValid && <p className="mt-1 text-[12px] text-red-600">Ingresá al menos 2 caracteres.</p>}
        </div>

        <div>
          <label htmlFor="parking-slug" className="mb-1.5 block text-[12px] font-semibold text-gray-600">
            Link para solicitar eventos
          </label>
          <div className="flex items-stretch overflow-hidden rounded-xl border border-gray-200 focus-within:border-gray-400">
            <span className="hidden shrink-0 items-center bg-gray-50 px-3 text-[13px] text-gray-400 sm:flex">
              {(origin || '').replace(/^https?:\/\//, '')}/parking/
            </span>
            <input
              id="parking-slug"
              type="text"
              value={slug}
              maxLength={180}
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              onChange={e => {
                setSlug(draftSlug(e.target.value))
                setError('')
              }}
              className="min-w-0 flex-1 px-3 py-2 text-[14px] outline-none"
            />
            <span className="hidden shrink-0 items-center bg-gray-50 px-3 text-[13px] text-gray-400 sm:flex">
              /solicitar-evento
            </span>
          </div>
          {!slugValid ? (
            <p className="mt-1 text-[12px] text-red-600">Usá al menos 3 letras o números.</p>
          ) : (
            <p className="mt-1 text-[12px] text-gray-500">
              Si lo cambiás, el link anterior deja de funcionar: compartí el nuevo con los organizadores.
            </p>
          )}
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-700">
            {error}
          </p>
        )}

        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={saving} disabled={!dirty || !nameValid || !slugValid}>
            Guardar
          </Button>
        </div>
      </form>
      <ToastPortal />
    </div>
  )
}
