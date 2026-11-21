/**
 * Textos cuando el comprador no puede comprar. Hay dos causas distintas:
 * - switch global de plataforma (temporal): "Compra inhabilitada".
 * - cierre del organizador X horas antes del inicio: "Compra cerrada".
 */
export type BuyAction = 'add' | 'pay' | 'addOrPay'

const ACTION_TAIL: Record<BuyAction, { disabled: string; closed: string }> = {
  add: { disabled: 'No es posible agregar productos en este momento.', closed: 'Ya no es posible agregar productos.' },
  pay: { disabled: 'No es posible pagar en este momento.', closed: 'Ya no es posible pagar.' },
  addOrPay: {
    disabled: 'No es posible agregar productos ni pagar en este momento.',
    closed: 'Ya no es posible agregar productos ni pagar.',
  },
}

export function buyBlockedMessage(purchaseClosed: boolean | undefined, action: BuyAction): string {
  return purchaseClosed
    ? `La compra para este evento está cerrada. ${ACTION_TAIL[action].closed}`
    : `Compra inhabilitada temporalmente. ${ACTION_TAIL[action].disabled}`
}

export function buyBlockedLabel(purchaseClosed: boolean | undefined): string {
  return purchaseClosed ? 'Compra cerrada' : 'Compra inhabilitada'
}
