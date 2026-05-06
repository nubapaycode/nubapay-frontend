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
      className={`flex items-center justify-center gap-2 ${className ?? ''}`}
      role="navigation"
      aria-label="Paginación"
    >
      <button
        type="button"
        disabled={safePage <= 1}
        onClick={() => onPageChange(safePage - 1)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px', borderRadius: '50%',
          border: '1px solid rgba(0,0,0,0.1)', background: '#FFFFFF',
          color: safePage <= 1 ? '#D1D5DB' : '#0A0A0F',
          cursor: safePage <= 1 ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => { if (safePage > 1) e.currentTarget.style.background = '#F5F5F7' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M8.5 3L4.5 7l4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
          <button
            key={p}
            type="button"
            onClick={() => onPageChange(p)}
            style={{
              width: '32px', height: '32px', borderRadius: '50%',
              border: p === safePage ? 'none' : '1px solid rgba(0,0,0,0.08)',
              background: p === safePage ? '#0A0A0F' : '#FFFFFF',
              color: p === safePage ? '#FFFFFF' : '#6B7280',
              fontSize: '13px', fontWeight: p === safePage ? 700 : 500,
              cursor: 'pointer',
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={e => { if (p !== safePage) e.currentTarget.style.background = '#F5F5F7' }}
            onMouseLeave={e => { if (p !== safePage) e.currentTarget.style.background = '#FFFFFF' }}
          >
            {p}
          </button>
        ))}
      </div>

      <button
        type="button"
        disabled={safePage >= totalPages}
        onClick={() => onPageChange(safePage + 1)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          width: '32px', height: '32px', borderRadius: '50%',
          border: '1px solid rgba(0,0,0,0.1)', background: '#FFFFFF',
          color: safePage >= totalPages ? '#D1D5DB' : '#0A0A0F',
          cursor: safePage >= totalPages ? 'not-allowed' : 'pointer',
          transition: 'background 0.15s, border-color 0.15s',
        }}
        onMouseEnter={e => { if (safePage < totalPages) e.currentTarget.style.background = '#F5F5F7' }}
        onMouseLeave={e => { e.currentTarget.style.background = '#FFFFFF' }}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5.5 3L9.5 7l-4 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
    </div>
  )
}
