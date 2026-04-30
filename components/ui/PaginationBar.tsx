'use client'

export type PaginationBarProps = {
  page: number
  pageSize: number
  total: number
  onPageChange: (page: number) => void
  className?: string
}

export function PaginationBar({ page, pageSize, total, onPageChange, className }: PaginationBarProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const safePage = Math.min(Math.max(1, page), totalPages)
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1
  const to = Math.min(safePage * pageSize, total)

  return (
    <div
      className={`flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500 ${className ?? ''}`}
      role="navigation"
      aria-label="Paginación"
    >
      <span>{total === 0 ? 'Sin resultados' : `${from}–${to} de ${total}`}</span>
      <div className="flex items-center gap-2">
        <button
          type="button"
          disabled={safePage <= 1}
          onClick={() => onPageChange(safePage - 1)}
          className="rounded-full border border-gray-200 px-3 py-1.5 font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
        >
          Anterior
        </button>
        <span className="tabular-nums text-gray-600 min-w-[4.5rem] text-center">
          {safePage} / {totalPages}
        </span>
        <button
          type="button"
          disabled={safePage >= totalPages}
          onClick={() => onPageChange(safePage + 1)}
          className="rounded-full border border-gray-200 px-3 py-1.5 font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-40 disabled:pointer-events-none"
        >
          Siguiente
        </button>
      </div>
    </div>
  )
}
