'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { ORGANIZER_ACCENT_BACKGROUND, organizerAccentFilledButtonStyle } from '@/lib/organizerAccentCss'
import { clearCatalogBlockBanner, uploadCatalogBlockBanner } from '@/lib/supabase/uploadCatalogBlockBanner'
import {
  createCatalogBlock,
  deleteCatalogBlock,
  fetchAllCategories,
  fetchAllWorkspaceProducts,
  fetchCatalogBlocks,
  patchCatalogBlock,
  putCatalogBlockProducts,
  type WorkspaceCatalogBlock,
  type WorkspaceCategory,
  type WorkspaceProduct,
} from '@/lib/organizerWorkspace'

function ToggleSwitch({ checked, disabled, onChange }: { checked: boolean; disabled?: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-busy={disabled ?? false}
      disabled={disabled}
      onClick={onChange}
      className={`rounded-full shrink-0 relative overflow-hidden transition-colors duration-200 ease-out ${
        disabled ? 'opacity-55 cursor-not-allowed' : ''
      }`}
      style={{ width: '40px', height: '22px', background: checked ? ORGANIZER_ACCENT_BACKGROUND : '#E5E7EB' }}
    >
      <span
        className={`absolute top-[3px] w-4 h-4 rounded-full bg-white shadow-md ring-1 ring-black/10 ease-out ${
          disabled ? '' : 'transition-[left] duration-200 ease-out'
        }`}
        style={{ left: checked ? '20px' : '3px' }}
      />
    </button>
  )
}

type CatalogGroupRow = {
  key: string
  label: string
  fullProducts: WorkspaceProduct[]
  displayProducts: WorkspaceProduct[]
}

export function BlocksView({ eventId }: { eventId: string }) {
  const [blocks, setBlocks] = useState<WorkspaceCatalogBlock[]>([])
  const [catalog, setCatalog] = useState<WorkspaceProduct[]>([])
  const [categories, setCategories] = useState<WorkspaceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(null)
  const [drawerVisible, setDrawerVisible] = useState<'create' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formTitle, setFormTitle] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(() => new Set())
  const [productSearch, setProductSearch] = useState('')
  const [detailExpandedKeys, setDetailExpandedKeys] = useState<Set<string>>(() => new Set())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [pendingImageFile, setPendingImageFile] = useState<File | null>(null)
  const [pendingImagePreviewUrl, setPendingImagePreviewUrl] = useState<string | null>(null)
  const [imageUploading, setImageUploading] = useState(false)
  const [editingBannerUrl, setEditingBannerUrl] = useState<string | null>(null)

  const [deleteTarget, setDeleteTarget] = useState<WorkspaceCatalogBlock | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const [togglePending, setTogglePending] = useState<Set<string>>(() => new Set())

  const loadAll = useCallback(async () => {
    setError('')
    const [bl, pr, cat] = await Promise.all([
      fetchCatalogBlocks(eventId),
      fetchAllWorkspaceProducts(eventId),
      fetchAllCategories(eventId),
    ])
    if (!bl.ok) setError(bl.error)
    else setBlocks(bl.blocks)
    if (!pr.ok) setError(e => e || pr.error)
    else setCatalog(pr.products)
    if (!cat.ok) setError(e => e || cat.error)
    else setCategories(cat.categories)
    setLoading(false)
  }, [eventId])

  useEffect(() => {
    setLoading(true)
    loadAll()
  }, [loadAll])

  useEffect(() => {
    if (drawerMode) { setDrawerVisible(drawerMode); return }
    const t = window.setTimeout(() => setDrawerVisible(null), 300)
    return () => window.clearTimeout(t)
  }, [drawerMode])

  useEffect(() => {
    if (!drawerMode) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') closeDrawer() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [drawerMode]) // eslint-disable-line react-hooks/exhaustive-deps

  const clearPendingImage = () => {
    if (pendingImagePreviewUrl) URL.revokeObjectURL(pendingImagePreviewUrl)
    setPendingImagePreviewUrl(null)
    setPendingImageFile(null)
  }

  const closeDrawer = () => {
    setDrawerMode(null)
    setEditingId(null)
    setFormTitle('')
    setSelectedProductIds(new Set())
    setProductSearch('')
    setDetailExpandedKeys(new Set())
    setFormError('')
    clearPendingImage()
    setEditingBannerUrl(null)
    setImageUploading(false)
  }

  const openCreate = () => {
    setFormError('')
    setFormTitle('')
    setSelectedProductIds(new Set())
    setProductSearch('')
    setDetailExpandedKeys(new Set())
    setEditingId(null)
    clearPendingImage()
    setEditingBannerUrl(null)
    setDrawerMode('create')
  }

  const openEdit = (b: WorkspaceCatalogBlock) => {
    setFormError('')
    setFormTitle(b.title)
    setSelectedProductIds(new Set(b.products.filter(x => x.is_active).map(x => x.product_id)))
    setProductSearch('')
    setDetailExpandedKeys(new Set())
    setEditingId(b.id)
    clearPendingImage()
    setEditingBannerUrl(b.banner_image_url)
    setDrawerMode('edit')
  }

  const catalogGroups = useMemo((): CatalogGroupRow[] => {
    const q = productSearch.trim().toLowerCase()
    const byCat = new Map<string, WorkspaceProduct[]>()
    for (const p of catalog) {
      const k = p.category_id ?? '__none__'
      const arr = byCat.get(k)
      if (arr) arr.push(p)
      else byCat.set(k, [p])
    }
    for (const arr of byCat.values()) arr.sort((a, b) => a.name.localeCompare(b.name))

    const catMeta = new Map(categories.map(c => [c.id, c]))
    const orderedKeys: string[] = []
    const seen = new Set<string>()
    for (const c of [...categories].sort((a, b) => a.sort_order - b.sort_order)) {
      if (byCat.has(c.id)) {
        orderedKeys.push(c.id)
        seen.add(c.id)
      }
    }
    const orphanKeys = [...byCat.keys()]
      .filter(k => k !== '__none__' && !seen.has(k))
      .sort((a, b) => {
        const la = byCat.get(a)![0]?.category_name ?? a
        const lb = byCat.get(b)![0]?.category_name ?? b
        return la.localeCompare(lb)
      })
    orderedKeys.push(...orphanKeys)
    if (byCat.has('__none__')) orderedKeys.push('__none__')

    const matchesSearch = (p: WorkspaceProduct) => {
      if (!q) return true
      return (
        p.name.toLowerCase().includes(q)
        || (p.category_name?.toLowerCase().includes(q) ?? false)
        || (p.type === 'combo' ? 'combo'.includes(q) : false)
      )
    }

    const rows: CatalogGroupRow[] = []
    for (const key of orderedKeys) {
      const fullProducts = byCat.get(key)!
      const displayProducts = q ? fullProducts.filter(matchesSearch) : fullProducts
      if (q && displayProducts.length === 0) continue

      let label: string
      if (key === '__none__') {
        label = 'Sin categoría'
      } else if (catMeta.has(key)) {
        label = catMeta.get(key)!.name
      } else {
        label = fullProducts[0]?.category_name ?? 'Categoría'
      }
      rows.push({ key, label, fullProducts, displayProducts })
    }
    return rows
  }, [catalog, categories, productSearch])

  const toggleCategoryProducts = (fullProducts: WorkspaceProduct[], add: boolean) => {
    const ids = fullProducts.map(p => p.id)
    setSelectedProductIds(prev => {
      const next = new Set(prev)
      if (add) for (const id of ids) next.add(id)
      else for (const id of ids) next.delete(id)
      return next
    })
  }

  const toggleDetailExpanded = (groupKey: string) => {
    setDetailExpandedKeys(prev => {
      const next = new Set(prev)
      if (next.has(groupKey)) next.delete(groupKey)
      else next.add(groupKey)
      return next
    })
  }

  const toggleProductSelected = (productId: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev)
      if (next.has(productId)) next.delete(productId)
      else next.add(productId)
      return next
    })
  }

  const pickPendingImage = (file: File | null) => {
    if (!file) return
    if (pendingImagePreviewUrl) URL.revokeObjectURL(pendingImagePreviewUrl)
    setPendingImagePreviewUrl(URL.createObjectURL(file))
    setPendingImageFile(file)
    setFormError('')
  }

  const onReplaceBanner = async (file: File | null) => {
    if (!file || !editingId) return
    setImageUploading(true)
    setFormError('')
    const res = await uploadCatalogBlockBanner(eventId, editingId, file)
    setImageUploading(false)
    if (!res.ok) {
      setFormError(res.error)
      return
    }
    setEditingBannerUrl(res.block.banner_image_url)
    setBlocks(list => list.map(x => (x.id === res.block.id ? res.block : x)))
  }

  const onClearBanner = async () => {
    if (!editingId) return
    setImageUploading(true)
    setFormError('')
    const res = await clearCatalogBlockBanner(eventId, editingId)
    setImageUploading(false)
    if (!res.ok) {
      setFormError(res.error)
      return
    }
    setEditingBannerUrl(null)
    setBlocks(list => list.map(x => (x.id === res.block.id ? res.block : x)))
  }

  const handleSave = async () => {
    const title = formTitle.trim()
    if (title.length < 2) {
      setFormError('El título debe tener al menos 2 caracteres')
      return
    }
    setSaving(true)
    setFormError('')
    const ids = [...selectedProductIds]

    if (drawerMode === 'create') {
      const res = await createCatalogBlock(eventId, { title, product_ids: ids })
      if (!res.ok) {
        setSaving(false)
        setFormError(res.error)
        return
      }
      let created = res.block
      if (pendingImageFile) {
        const up = await uploadCatalogBlockBanner(eventId, created.id, pendingImageFile)
        if (up.ok) created = up.block
      }
      setSaving(false)
      setBlocks(prev => [...prev, created].sort((a, b) => a.sort_order - b.sort_order))
      closeDrawer()
      return
    }

    if (drawerMode === 'edit' && editingId) {
      const resPatch = await patchCatalogBlock(eventId, editingId, { title })
      if (!resPatch.ok) {
        setSaving(false)
        setFormError(resPatch.error)
        return
      }
      const resPut = await putCatalogBlockProducts(eventId, editingId, ids)
      setSaving(false)
      if (!resPut.ok) {
        setFormError(resPut.error)
        return
      }
      setBlocks(prev => prev.map(x => (x.id === editingId ? resPut.block : x)))
      closeDrawer()
    }
  }

  const toggleBlockActive = async (b: WorkspaceCatalogBlock) => {
    if (togglePending.has(b.id)) return
    setTogglePending(s => new Set(s).add(b.id))
    const next = !b.is_active
    setBlocks(list => list.map(x => (x.id === b.id ? { ...x, is_active: next } : x)))
    const res = await patchCatalogBlock(eventId, b.id, { is_active: next })
    if (!res.ok) {
      setBlocks(list => list.map(x => (x.id === b.id ? { ...x, is_active: b.is_active } : x)))
      setError(res.error)
    } else {
      setBlocks(list => list.map(x => (x.id === b.id ? res.block : x)))
    }
    setTogglePending(s => {
      const n = new Set(s)
      n.delete(b.id)
      return n
    })
  }

  const confirmDelete = async () => {
    if (!deleteTarget || deleteSubmitting) return
    setDeleteSubmitting(true)
    const res = await deleteCatalogBlock(eventId, deleteTarget.id)
    setDeleteSubmitting(false)
    if (!res.ok) {
      setError(res.error)
      setDeleteTarget(null)
      return
    }
    setBlocks(prev => prev.filter(x => x.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  const bannerPreview = pendingImagePreviewUrl ?? editingBannerUrl

  if (loading) {
    return (
      <div className="w-full min-w-0 flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" className="text-gray-900" />
        <p className="text-sm text-gray-400">Cargando bloques…</p>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-none" style={{ fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}>
      <style>{`
        .nb-input:focus { border-color: #0A0A0F !important; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
        .nb-block-card { transition: border-color 0.15s, box-shadow 0.15s, transform 0.15s; }
        .nb-block-card:hover { border-color: rgba(0,0,0,0.16) !important; box-shadow: 0 4px 16px rgba(0,0,0,0.04); transform: translateY(-1px); }
      `}</style>

      <OrganizerToolHeading
        title="Bloques personalizados"
        description="Armá secciones destacadas del catálogo con banner propio y productos elegidos a mano."
        actions={
          <button
            type="button"
            onClick={openCreate}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', color: 'rgba(0,0,0,0.5)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '100px', padding: '10px 20px', fontSize: '14px', fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap', flexShrink: 0, transition: 'color 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#000000' }}
            onMouseLeave={e => { e.currentTarget.style.color = 'rgba(0,0,0,0.5)' }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
            Nuevo bloque
          </button>
        }
      />

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {blocks.length === 0 ? (
          <div className="col-span-full" style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '64px 24px', textAlign: 'center' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="3" y="3" width="16" height="9" rx="2" stroke="#C8C8D0" strokeWidth="1.5"/>
                <rect x="3" y="14.5" width="7" height="4.5" rx="1.5" stroke="#C8C8D0" strokeWidth="1.5"/>
                <rect x="12" y="14.5" width="7" height="4.5" rx="1.5" stroke="#C8C8D0" strokeWidth="1.5"/>
              </svg>
            </div>
            <p style={{ fontSize: '15px', fontWeight: 600, color: '#0A0A0F', margin: '0 0 6px 0' }}>Sin bloques personalizados</p>
            <p style={{ fontSize: '13px', color: '#9A9AA8', margin: '0 0 24px 0' }}>Creá el primero para destacar productos con un banner propio.</p>
            <button
              type="button"
              onClick={openCreate}
              style={{ ...organizerAccentFilledButtonStyle(), border: 'none', borderRadius: '100px', padding: '10px 24px', fontSize: '14px', fontWeight: 700, cursor: 'pointer' }}
            >
              Crear bloque
            </button>
          </div>
        ) : (
          blocks.map(b => {
            const activeProducts = b.products.filter(x => x.is_active)
            return (
              <div
                key={b.id}
                className="nb-block-card"
                style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '18px', overflow: 'hidden', display: 'flex', flexDirection: 'column', opacity: b.is_active ? 1 : 0.6 }}
              >
                <div style={{ width: '100%', paddingTop: '43.75%', background: '#F5F5F7', position: 'relative' }}>
                  <div style={{ position: 'absolute', inset: 0 }}>
                    {b.banner_image_url ? (
                      <img src={b.banner_image_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#D1D1D8" strokeWidth="1.5"/><circle cx="8.5" cy="10" r="1.5" stroke="#D1D1D8" strokeWidth="1.5"/><path d="M21 15l-5-5-9 9" stroke="#D1D1D8" strokeWidth="1.5"/></svg>
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontSize: '15px', fontWeight: 600, color: '#0A0A0F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{b.title}</p>
                        {!b.is_active && (
                          <span style={{ fontSize: '10px', fontWeight: 700, background: 'rgba(0,0,0,0.06)', color: '#9A9AA8', padding: '2px 8px', borderRadius: '100px', textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap' }}>Pausado</span>
                        )}
                      </div>
                    </div>
                    <ToggleSwitch checked={b.is_active} disabled={togglePending.has(b.id)} onChange={() => toggleBlockActive(b)} />
                  </div>
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: '#9A9AA8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 8px 0' }}>
                      {activeProducts.length === 0 ? 'Sin productos elegidos' : `${activeProducts.length} producto${activeProducts.length === 1 ? '' : 's'}`}
                    </p>
                    {activeProducts.length === 0 ? (
                      <p style={{ fontSize: '12px', color: '#C8C8D0', margin: 0 }}>Elegí desde "Editar".</p>
                    ) : (
                      <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', listStyle: 'none', padding: 0, margin: 0 }}>
                        {activeProducts.slice(0, 6).map(x => (
                          <li
                            key={x.product_id}
                            title={x.name}
                            style={{ fontSize: '11px', color: '#0A0A0F', background: '#F5F5F7', padding: '3px 9px', borderRadius: '100px', maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                          >
                            {x.name}
                            {x.type === 'combo' && <span style={{ color: '#9A9AA8', marginLeft: '4px' }}>· combo</span>}
                          </li>
                        ))}
                        {activeProducts.length > 6 && (
                          <li style={{ fontSize: '11px', color: '#9A9AA8', background: 'transparent', padding: '3px 6px' }}>
                            +{activeProducts.length - 6}
                          </li>
                        )}
                      </ul>
                    )}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginTop: 'auto', paddingTop: '4px', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <button
                      type="button"
                      onClick={() => openEdit(b)}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px 0', fontSize: '13px', fontWeight: 600, color: '#0A0A0F' }}
                    >
                      <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                        <path d="M2 12h2L11 5l-2-2L2 10v2zM9 3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget(b)}
                      aria-label={`Eliminar ${b.title}`}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: '#C8C8D0', display: 'flex', alignItems: 'center', transition: 'background 0.15s, color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#DC2626' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#C8C8D0' }}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M2 3.5h10M4.5 3.5V2.5a.5.5 0 0 1 .5-.5h4a.5.5 0 0 1 .5.5v1M3.5 3.5l.75 7.5h5.5l.75-7.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            )
          })
        )}
      </div>


      <div
        role="presentation"
        onClick={closeDrawer}
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${drawerMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(10,10,15,0.55)' }}
      />

      <div
        className={`fixed top-0 right-0 h-full z-50 w-[min(100vw,28rem)] bg-white shadow-2xl transition-transform duration-300 flex flex-col ${drawerMode ? 'translate-x-0' : 'translate-x-full'}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)', borderTopLeftRadius: '24px', borderBottomLeftRadius: '24px', fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
      >
        {drawerVisible && (
          <>
            {/* Header */}
            <div style={{ padding: '24px 24px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexShrink: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A0A0F', letterSpacing: '-0.02em', margin: 0 }}>
                  {drawerVisible === 'create' ? 'Nuevo bloque' : 'Editar bloque'}
                </h2>
                <p style={{ fontSize: '12px', color: '#9A9AA8', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                  Banner + productos que se muestran juntos arriba del catálogo.
                </p>
              </div>
              <button
                type="button"
                onClick={closeDrawer}
                aria-label="Cerrar"
                style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#F5F5F7', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#6B7280', flexShrink: 0, transition: 'background 0.15s, color 0.15s' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#E5E7EB'; e.currentTarget.style.color = '#0A0A0F' }}
                onMouseLeave={e => { e.currentTarget.style.background = '#F5F5F7'; e.currentTarget.style.color = '#6B7280' }}
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#9A9AA8', marginBottom: '6px' }}>Título</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={e => { setFormTitle(e.target.value); setFormError('') }}
                  placeholder="Ej: Lo más pedido"
                  className="nb-input"
                  style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', padding: '11px 14px', fontSize: '13px', color: '#0A0A0F', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                  disabled={saving || imageUploading}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#9A9AA8', marginBottom: '8px' }}>
                  Banner <span style={{ fontWeight: 500, color: '#C8C8D0' }}>· opcional</span>
                </label>
                {bannerPreview ? (
                  <div style={{ position: 'relative', width: '100%', paddingTop: '43.75%', borderRadius: '14px', overflow: 'hidden', background: '#F5F5F7' }}>
                    <img src={bannerPreview} alt="" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                    {imageUploading && (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Spinner size="sm" className="text-gray-900" />
                      </div>
                    )}
                    <label
                      style={{ position: 'absolute', bottom: '8px', right: '8px', background: 'rgba(10,10,15,0.75)', color: '#fff', fontSize: '11px', fontWeight: 600, padding: '6px 12px', borderRadius: '100px', cursor: saving || imageUploading ? 'not-allowed' : 'pointer' }}
                    >
                      {imageUploading ? 'Subiendo…' : 'Cambiar'}
                      <input
                        type="file"
                        accept="image/*"
                        hidden
                        disabled={saving || imageUploading}
                        onChange={e => {
                          const file = e.target.files?.[0] ?? null
                          if (drawerMode === 'edit') void onReplaceBanner(file)
                          else pickPendingImage(file)
                          e.target.value = ''
                        }}
                      />
                    </label>
                    <button
                      type="button"
                      disabled={saving || imageUploading}
                      onClick={() => {
                        if (drawerMode === 'edit') void onClearBanner()
                        else clearPendingImage()
                      }}
                      style={{ position: 'absolute', top: '8px', right: '8px', background: 'rgba(10,10,15,0.6)', color: '#fff', border: 'none', width: '26px', height: '26px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: saving || imageUploading ? 'not-allowed' : 'pointer' }}
                      aria-label="Quitar banner"
                    >
                      <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/></svg>
                    </button>
                  </div>
                ) : (
                  <label
                    style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '6px', width: '100%', aspectRatio: '16/7', borderRadius: '14px', border: '1.5px dashed rgba(0,0,0,0.15)', background: '#FAFAFA', cursor: saving || imageUploading ? 'not-allowed' : 'pointer', transition: 'background 0.15s' }}
                    onMouseEnter={e => { if (!saving && !imageUploading) (e.currentTarget as HTMLLabelElement).style.background = '#F5F5F7' }}
                    onMouseLeave={e => { (e.currentTarget as HTMLLabelElement).style.background = '#FAFAFA' }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="5" width="18" height="14" rx="2" stroke="#9A9AA8" strokeWidth="1.5"/><circle cx="8.5" cy="10" r="1.5" stroke="#9A9AA8" strokeWidth="1.5"/><path d="M21 15l-5-5-9 9" stroke="#9A9AA8" strokeWidth="1.5"/></svg>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: '#6B7280' }}>{imageUploading ? 'Subiendo…' : 'Subir banner'}</span>
                    <span style={{ fontSize: '11px', color: '#C8C8D0' }}>Medida recomendada: 1200 × 525 px</span>
                    <input
                      type="file"
                      accept="image/*"
                      hidden
                      disabled={saving || imageUploading}
                      onChange={e => {
                        const file = e.target.files?.[0] ?? null
                        if (drawerMode === 'edit') void onReplaceBanner(file)
                        else pickPendingImage(file)
                        e.target.value = ''
                      }}
                    />
                  </label>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#9A9AA8', marginBottom: '8px' }}>Productos del bloque</label>
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#C8C8D0', pointerEvents: 'none' }}>
                    <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
                    <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                  <input
                    type="text"
                    value={productSearch}
                    onChange={e => setProductSearch(e.target.value)}
                    placeholder="Buscar categoría o producto…"
                    className="nb-input"
                    style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', padding: '11px 14px 11px 38px', fontSize: '13px', color: '#0A0A0F', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                    disabled={saving}
                  />
                </div>
                <div style={{ borderRadius: '14px', border: '1px solid rgba(0,0,0,0.07)', background: '#FAFAFA', overflow: 'hidden' }}>
                  {catalog.length === 0 ? (
                    <p style={{ padding: '20px', fontSize: '12px', color: '#9A9AA8', textAlign: 'center', margin: 0 }}>No hay productos en el catálogo.</p>
                  ) : catalogGroups.length === 0 ? (
                    <p style={{ padding: '20px', fontSize: '12px', color: '#9A9AA8', textAlign: 'center', margin: 0 }}>Sin coincidencias.</p>
                  ) : (
                    catalogGroups.map((group, gi) => {
                      const total = group.fullProducts.length
                      const selectedCount = group.fullProducts.reduce((n, p) => n + (selectedProductIds.has(p.id) ? 1 : 0), 0)
                      const expanded = detailExpandedKeys.has(group.key)
                      const allChecked = selectedCount === total && total > 0
                      return (
                        <div key={group.key} style={{ background: '#FFFFFF', borderTop: gi === 0 ? 'none' : '1px solid rgba(0,0,0,0.05)' }}>
                          <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <button
                                type="button"
                                disabled={saving || total === 0}
                                onClick={() => toggleCategoryProducts(group.fullProducts, !allChecked)}
                                aria-checked={allChecked}
                                role="checkbox"
                                style={{ width: '18px', height: '18px', borderRadius: '5px', border: allChecked ? 'none' : '1.5px solid rgba(0,0,0,0.18)', background: allChecked ? '#0A0A0F' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                              >
                                {allChecked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5 5.5-5.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                              </button>
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>{group.label}</p>
                                <p style={{ fontSize: '11px', color: '#9A9AA8', margin: '2px 0 0 0' }}>
                                  {allChecked ? (
                                    <>Todos · {total}</>
                                  ) : selectedCount > 0 ? (
                                    <>{selectedCount} de {total} seleccionados</>
                                  ) : (
                                    <>{total} producto{total !== 1 ? 's' : ''}</>
                                  )}
                                </p>
                              </div>
                              <button
                                type="button"
                                disabled={saving}
                                onClick={() => toggleDetailExpanded(group.key)}
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', color: '#9A9AA8', display: 'flex', alignItems: 'center', flexShrink: 0, transition: 'transform 0.15s' }}
                                aria-label={expanded ? 'Ocultar productos' : 'Mostrar productos'}
                                aria-expanded={expanded}
                              >
                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: expanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
                                  <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              </button>
                            </div>
                          </div>
                          {expanded && (
                            group.displayProducts.length === 0 ? (
                              <p style={{ padding: '12px 14px', fontSize: '11px', color: '#9A9AA8', borderTop: '1px solid rgba(0,0,0,0.05)', background: '#FAFAFA', margin: 0 }}>
                                Sin coincidencias con la búsqueda.
                              </p>
                            ) : (
                              <ul style={{ borderTop: '1px solid rgba(0,0,0,0.05)', background: '#FAFAFA', listStyle: 'none', padding: 0, margin: 0 }}>
                                {group.displayProducts.map((prod, pi) => {
                                  const checked = selectedProductIds.has(prod.id)
                                  return (
                                    <li key={prod.id} style={{ borderTop: pi === 0 ? 'none' : '1px solid rgba(0,0,0,0.04)' }}>
                                      <label style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 14px 10px 32px', cursor: 'pointer' }}>
                                        <button
                                          type="button"
                                          onClick={() => toggleProductSelected(prod.id)}
                                          aria-checked={checked}
                                          role="checkbox"
                                          style={{ width: '16px', height: '16px', borderRadius: '4px', border: checked ? 'none' : '1.5px solid rgba(0,0,0,0.18)', background: checked ? '#0A0A0F' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                                        >
                                          {checked && <svg width="9" height="7" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5 5.5-5.5" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                                        </button>
                                        <span style={{ flex: 1, minWidth: 0 }}>
                                          <span style={{ display: 'block', fontSize: '13px', color: '#0A0A0F', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{prod.name}</span>
                                          <span style={{ display: 'block', fontSize: '11px', color: '#9A9AA8', marginTop: '1px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                            {prod.type === 'combo' ? 'Combo' : 'Producto'}
                                            {!prod.is_active && ' · inactivo'}
                                          </span>
                                        </span>
                                      </label>
                                    </li>
                                  )
                                })}
                              </ul>
                            )
                          )}
                        </div>
                      )
                    })
                  )}
                </div>
              </div>
              {formError && (
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#DC2626' }}>
                  {formError}
                </div>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(0,0,0,0.06)', flexShrink: 0, background: '#FFFFFF' }}>
              <button
                type="button"
                disabled={saving || imageUploading}
                onClick={handleSave}
                style={{ width: '100%', borderRadius: '100px', ...organizerAccentFilledButtonStyle(), border: 'none', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: saving || imageUploading ? 'not-allowed' : 'pointer', opacity: saving || imageUploading ? 0.6 : 1, letterSpacing: '-0.01em' }}
              >
                {saving ? 'Guardando…' : drawerVisible === 'create' ? 'Crear bloque' : 'Guardar cambios'}
              </button>
            </div>
          </>
        )}
      </div>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => {
          if (!deleteSubmitting) setDeleteTarget(null)
        }}
        title="Eliminar bloque"
        containerClassName="z-[70]"
      >
        {deleteTarget && (
          <>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              ¿Eliminar «<span className="font-medium text-gray-900">{deleteTarget.title}</span>»? Los productos no se
              eliminan del catálogo, solo dejan de mostrarse agrupados en este bloque.
            </p>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={() => setDeleteTarget(null)}
                className="rounded-full border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={deleteSubmitting}
                onClick={confirmDelete}
                className="rounded-full bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
              >
                {deleteSubmitting ? 'Eliminando…' : 'Eliminar'}
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  )
}
