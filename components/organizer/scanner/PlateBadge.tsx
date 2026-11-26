import { cn } from '@/lib/utils'

/**
 * Patente con forma de chapa Mercosur (franja azul arriba, letras negras): se lee de un vistazo.
 * `xl` es para la pantalla del público; `sm` para las listas.
 */
export function PlateBadge({ plate, size = 'sm', className }: { plate: string; size?: 'sm' | 'xl'; className?: string }) {
  const xl = size === 'xl'
  return (
    <span
      className={cn(
        'inline-flex flex-col overflow-hidden bg-white text-[#0A0A0F] shadow-[0_1px_2px_rgba(16,24,40,0.08)]',
        xl ? 'rounded-[1.6vw] border-[0.45vw] border-[#0A0A0F] shadow-[0_2vw_5vw_-1vw_rgba(0,0,0,0.45)]' : 'rounded-md border-2 border-[#0A0A0F]',
        className,
      )}
    >
      <span
        aria-hidden
        className={cn(
          'flex items-center justify-center bg-[#1d4ed8] font-semibold uppercase tracking-[0.2em] text-white',
          xl ? 'h-[2.4vw] text-[1.3vw]' : 'h-[7px] text-[0px]',
        )}
      >
        {xl ? 'Argentina' : ''}
      </span>
      <span
        className={cn(
          'font-mono font-black uppercase leading-none tracking-[0.08em]',
          xl ? 'px-[3vw] pb-[1.2vw] pt-[1vw] text-[12vw]' : 'px-2 pb-1 pt-0.5 text-[15px]',
        )}
      >
        {plate}
      </span>
    </span>
  )
}
