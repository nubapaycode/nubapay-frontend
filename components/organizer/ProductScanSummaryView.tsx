'use client'

import { useCallback, useEffect, useState } from 'react'
import { RefreshCw } from 'lucide-react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { Spinner } from '@/components/ui/Spinner'
import { fetchProductScanSummary } from '@/lib/organizerWorkspace'
import type { ProductScanSummaryItem } from '@/lib/organizerWorkspace'

export function ProductScanSummaryView({ eventId }: { eventId: string }) {
  const [products, setProducts] = useState<ProductScanSummaryItem[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    else setRefreshing(true)
    setError('')
    const res = await fetchProductScanSummary(eventId)
    if (!res.ok) {
      setError(res.error)
      if (!silent) setProducts([])
    } else {
      setProducts(res.products)
      setLastRefresh(new Date())
    }
    setLoading(false)
    setRefreshing(false)
  }, [eventId])

  useEffect(() => { void load() }, [load])

  const q = searchInput.trim().toLowerCase()
  const displayProducts = q
    ? products.filter(p => p.name.toLowerCase().includes(q))
    : products

  return (
    <div style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>
      <style>{`
        @keyframes nb-spin { to { transform: rotate(360deg); } }
        .nb-scan-row { transition: background 0.12s; }
        .nb-scan-row:hover { background: #FAFAFA !important; }
        .nb-search-input:focus { outline: none; border-color: #0A0A0F !important; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }

        @media (max-width: 768px) {
          .nb-scan-table-header { display: none !important; }
          .nb-scan-row {
            grid-template-columns: 1fr auto auto !important;
            padding: 14px 16px !important;
            gap: 4px !important;
          }
        }
      `}</style>

      <OrganizerToolHeading
        title="Escaneos"
        description={
          <p style={{ fontSize: '13px', color: '#9A9AA8', margin: 0 }}>
            Comprados vs. escaneados por producto
            {lastRefresh && (
              <span style={{ marginLeft: '8px', color: '#C4C4CF' }}>
                · última: {lastRefresh.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </span>
            )}
          </p>
        }
        actions={
          <button
            onClick={() => void load(true)}
            disabled={refreshing || loading}
            style={{
              display: 'flex', alignItems: 'center', gap: '6px',
              background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.1)',
              borderRadius: '100px', padding: '7px 14px',
              fontSize: '13px', fontWeight: 500, color: '#6B7280',
              cursor: refreshing || loading ? 'not-allowed' : 'pointer',
              opacity: refreshing ? 0.6 : 1,
            }}
          >
            <RefreshCw size={13} style={{ animation: refreshing ? 'nb-spin 0.7s linear infinite' : 'none' }} />
            Actualizar
          </button>
        }
      />

      <div style={{ marginBottom: '20px' }}>
        <div style={{ position: 'relative' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
            style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#9A9AA8', pointerEvents: 'none' }}>
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.4"/>
            <path d="M9.5 9.5L12 12" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
          </svg>
          <input
            type="text"
            className="nb-search-input"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Buscar producto…"
            style={{
              width: '100%', maxWidth: '360px', boxSizing: 'border-box',
              paddingLeft: '38px', paddingRight: '14px', paddingTop: '10px', paddingBottom: '10px',
              border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px',
              fontSize: '13px', color: '#0A0A0F', background: '#FFFFFF',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
          />
        </div>
      </div>

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', gap: '12px' }}>
          <Spinner size="lg" className="text-gray-900" />
          <p style={{ fontSize: '13px', color: '#9A9AA8', margin: 0 }}>Cargando escaneos…</p>
        </div>
      ) : displayProducts.length === 0 ? (
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '64px 24px', textAlign: 'center' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <rect x="3" y="3" width="6" height="6" stroke="#C8C8D0" strokeWidth="1.5" strokeLinejoin="round"/>
              <rect x="13" y="3" width="6" height="6" stroke="#C8C8D0" strokeWidth="1.5" strokeLinejoin="round"/>
              <rect x="3" y="13" width="6" height="6" stroke="#C8C8D0" strokeWidth="1.5" strokeLinejoin="round"/>
              <path d="M14 15h5M16.5 12.5v5" stroke="#C8C8D0" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <p style={{ fontSize: '15px', fontWeight: 600, color: '#0A0A0F', margin: '0 0 6px 0' }}>Sin datos todavía</p>
          <p style={{ fontSize: '13px', color: '#9A9AA8', margin: 0 }}>
            {q ? 'Probá otra búsqueda.' : 'Los productos comprados y escaneados aparecerán acá.'}
          </p>
        </div>
      ) : (
        <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', overflow: 'hidden', position: 'relative' }}>
          {refreshing && (
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '2px', background: 'rgba(0,0,0,0.06)' }} />
          )}

          <div className="nb-scan-table-header" style={{ display: 'grid', gridTemplateColumns: '1fr 140px 140px', gap: '0', padding: '10px 16px', background: '#FAFAFA', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#9A9AA8' }}>Producto</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#9A9AA8', textAlign: 'right' }}>Comprados</span>
            <span style={{ fontSize: '11px', fontWeight: 600, color: '#9A9AA8', textAlign: 'right' }}>Escaneados</span>
          </div>

          {displayProducts.map((p, idx) => {
            const pct = p.purchased > 0 ? Math.min(100, Math.round((p.scanned / p.purchased) * 100)) : 0
            return (
              <div
                key={p.name}
                className="nb-scan-row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: '1fr 140px 140px',
                  gap: '0',
                  padding: '14px 16px',
                  borderTop: idx === 0 ? 'none' : '1px solid rgba(0,0,0,0.04)',
                  background: '#FFFFFF',
                  alignItems: 'center',
                }}
              >
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.name}
                  </p>
                  <div style={{ marginTop: '6px', height: '4px', borderRadius: '100px', background: '#F0F0F3', overflow: 'hidden', maxWidth: '220px' }}>
                    <div style={{ height: '100%', width: `${pct}%`, borderRadius: '100px', background: '#0A0A0F' }} />
                  </div>
                </div>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0F', textAlign: 'right' }}>
                  {p.purchased}
                </span>
                <span style={{ fontSize: '13px', fontWeight: 600, color: '#6B7280', textAlign: 'right' }}>
                  {p.scanned} <span style={{ fontSize: '11px', fontWeight: 500, color: '#9A9AA8' }}>({pct}%)</span>
                </span>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
