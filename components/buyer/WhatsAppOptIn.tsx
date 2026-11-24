'use client'

import { useId } from 'react'

import { BUYER_COLORS } from '@/lib/buyerUi'

/**
 * Consentimiento para recibir el QR por WhatsApp. Va **sin marcar**: WhatsApp exige que el comprador lo acepte
 * de forma clara. Solo se muestra si el organizador tiene WhatsApp activo (`event.whatsappEnabled`).
 */
export function WhatsAppOptIn({
  checked,
  onChange,
  hint = 'Te lo mandamos además del email. Usamos tu teléfono solo para eso.',
}: {
  checked: boolean
  onChange: (value: boolean) => void
  hint?: string
}) {
  const id = useId()
  return (
    <label
      htmlFor={id}
      className="flex cursor-pointer items-start gap-3 rounded-[12px] border px-4 py-3"
      style={{ borderColor: BUYER_COLORS.border, background: '#fff' }}
    >
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="mt-0.5 h-5 w-5 flex-shrink-0 cursor-pointer"
        style={{ accentColor: BUYER_COLORS.accent }}
      />
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold" style={{ color: BUYER_COLORS.text }}>
          Quiero recibir mi QR por WhatsApp
        </span>
        <span className="mt-0.5 block text-[13px]" style={{ color: BUYER_COLORS.muted }}>
          {hint}
        </span>
      </span>
    </label>
  )
}
