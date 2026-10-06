import { Spinner } from '@/components/ui/Spinner'
import { BUYER_COLORS, BUYER_FONT } from '@/lib/buyerUi'

export default function Loading() {
  return (
    <div
      className="flex min-h-dvh flex-col items-center justify-center gap-4"
      style={{ background: BUYER_COLORS.bg, fontFamily: BUYER_FONT, color: BUYER_COLORS.text }}
    >
      <Spinner size="lg" />
      <p className="text-[14px] font-semibold">
        Cargando tu pedido...
      </p>
    </div>
  )
}
