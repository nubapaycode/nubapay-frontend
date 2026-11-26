'use client'

import { useState } from 'react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { useParkingOwnerAccount } from '@/components/parkingOwner/ParkingOwnerAccountContext'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { patchParkingOwnerAccount } from '@/lib/parkingOwner'

/** Datos generales del estacionamiento. El mapa se carga en Vehículos; los cobros, en Cobros. */
export function ParkingOwnerSettingsView() {
  const { account, setAccount } = useParkingOwnerAccount()
  const [name, setName] = useState(account.name)
  const [saving, setSaving] = useState(false)
  const { show, ToastPortal } = useToast()

  const trimmed = name.trim()
  const dirty = trimmed !== account.name
  const valid = trimmed.length >= 2

  const save = async () => {
    if (!dirty || !valid || saving) return
    setSaving(true)
    const r = await patchParkingOwnerAccount({ name: trimmed })
    setSaving(false)
    if (r.ok) {
      setAccount(r.data)
      setName(r.data.name)
      show('Cambios guardados.', 'success')
    } else {
      show(r.error, 'error')
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
        className="space-y-4 rounded-2xl border border-gray-200/80 bg-white p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04)]"
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
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-[14px] outline-none focus:border-gray-400"
          />
          {!valid && <p className="mt-1 text-[12px] text-red-600">Ingresá al menos 2 caracteres.</p>}
        </div>
        <div className="flex justify-end">
          <Button type="submit" size="sm" loading={saving} disabled={!dirty || !valid}>
            Guardar
          </Button>
        </div>
      </form>
      <ToastPortal />
    </div>
  )
}
