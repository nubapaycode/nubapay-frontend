'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import { OrganizerToolHeading } from '@/components/organizer/OrganizerToolHeading'
import { Modal } from '@/components/ui/Modal'
import { PaginationBar } from '@/components/ui/PaginationBar'
import { Spinner } from '@/components/ui/Spinner'
import {
  createCategory,
  createWorkspaceProduct,
  deleteCategory,
  deleteWorkspaceProduct,
  fetchAllCategories,
  fetchAllWorkspaceProducts,
  fetchWorkspaceProducts,
  patchWorkspaceProduct,
  type PaginationMeta,
  type WorkspaceCategory,
  type WorkspaceProduct,
} from '@/lib/organizerWorkspace'
import { formatPrice } from '@/lib/utils'

function ToggleSwitch({
  checked,
  disabled,
  onChange,
}: {
  checked: boolean
  disabled?: boolean
  onChange: () => void
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      aria-busy={disabled ?? false}
      disabled={disabled}
      onClick={onChange}
      className={`w-10 h-5.5 rounded-full shrink-0 relative overflow-hidden transition-colors duration-200 ease-out ${
        disabled ? 'opacity-55 cursor-not-allowed' : ''
      }`}
      style={{ width: '40px', height: '22px', background: checked ? '#C6FF00' : '#E5E7EB' }}
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

type NubaSelectOption = { value: string; label: string }

function NubaSelect({
  value,
  onChange,
  options,
  disabled,
  ariaLabel,
  fullWidth,
  minWidth,
}: {
  value: string
  onChange: (v: string) => void
  options: NubaSelectOption[]
  disabled?: boolean
  ariaLabel?: string
  fullWidth?: boolean
  minWidth?: number
}) {
  const [open, setOpen] = useState(false)
  const wrapperRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false)
    }
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('mousedown', handleClick)
    window.addEventListener('keydown', handleKey)
    return () => {
      window.removeEventListener('mousedown', handleClick)
      window.removeEventListener('keydown', handleKey)
    }
  }, [open])

  const current = options.find(o => o.value === value)

  return (
    <div ref={wrapperRef} style={{ position: 'relative', width: fullWidth ? '100%' : 'auto', minWidth: minWidth ?? undefined }}>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={ariaLabel}
        style={{
          width: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          borderRadius: '12px',
          border: '1px solid ' + (open ? '#0A0A0F' : 'rgba(0,0,0,0.1)'),
          background: '#FAFAFA',
          padding: '10px 14px',
          fontSize: '13px',
          color: '#0A0A0F',
          cursor: disabled ? 'not-allowed' : 'pointer',
          opacity: disabled ? 0.6 : 1,
          textAlign: 'left',
          boxShadow: open ? '0 0 0 3px rgba(0,0,0,0.06)' : 'none',
          transition: 'border-color 0.15s, box-shadow 0.15s',
          outline: 'none',
          boxSizing: 'border-box',
        }}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {current?.label ?? options[0]?.label}
        </span>
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0, color: '#6B7280', transform: open ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s' }}>
          <path d="M3 4.5L6 7.5L9 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>
      {open && (
        <div
          role="listbox"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            right: 0,
            zIndex: 60,
            background: '#FFFFFF',
            border: '1px solid rgba(0,0,0,0.1)',
            borderRadius: '14px',
            boxShadow: '0 12px 32px rgba(0,0,0,0.12)',
            padding: '6px',
            maxHeight: '260px',
            overflowY: 'auto',
            animation: 'nb-select-pop 0.15s cubic-bezier(0.16,1,0.3,1)',
          }}
        >
          {options.map(opt => {
            const selected = opt.value === value
            return (
              <button
                key={opt.value || '__none__'}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => { onChange(opt.value); setOpen(false) }}
                className="nb-select-opt"
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '12px',
                  background: selected ? '#F5F5F7' : 'transparent',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '9px 12px',
                  fontSize: '13px',
                  fontWeight: selected ? 600 : 500,
                  color: '#0A0A0F',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{opt.label}</span>
                {selected && (
                  <svg width="12" height="10" viewBox="0 0 12 10" fill="none" style={{ flexShrink: 0, color: '#0A0A0F' }}>
                    <path d="M1 5l3 3 7-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition'

type DeleteConfirmTarget =
  | { kind: 'category'; id: string; name: string }
  | { kind: 'catalog'; id: string; name: string; variant: 'single' | 'combo' }

type ComboPickerEntry = { product_id: string; quantity: number; displayName?: string }

const PRODUCT_PAGE_SIZE = 16

export function ProductsView({ eventId }: { eventId: string }) {
  const [categories, setCategories] = useState<WorkspaceCategory[]>([])
  const [products, setProducts] = useState<WorkspaceProduct[]>([])
  const [productPage, setProductPage] = useState(1)
  const [productPagination, setProductPagination] = useState<PaginationMeta>({
    page: 1,
    page_size: PRODUCT_PAGE_SIZE,
    total: 0,
  })
  const [catalogTab, setCatalogTab] = useState<'products' | 'combos'>('products')
  const [catalogSearchInput, setCatalogSearchInput] = useState('')
  const [catalogSearchQ, setCatalogSearchQ] = useState('')
  const [filterCategoryId, setFilterCategoryId] = useState('')
  const [comboDrawerSingles, setComboDrawerSingles] = useState<WorkspaceProduct[]>([])
  const [comboDrawerSinglesLoading, setComboDrawerSinglesLoading] = useState(false)
  const [loading, setLoading] = useState(true)
  const [listLoading, setListLoading] = useState(false)
  const [error, setError] = useState('')
  const [drawerMode, setDrawerMode] = useState<'product' | 'combo' | 'categories' | null>(null)
  const [drawerContent, setDrawerContent] = useState<'product' | 'combo' | 'categories' | null>(null)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set())
  const [bulkSubmitting, setBulkSubmitting] = useState(false)
  const [bulkConfirm, setBulkConfirm] = useState<null | 'delete' | 'pause' | 'activate'>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)
  const [editingCatalogId, setEditingCatalogId] = useState<string | null>(null)

  const [catName, setCatName] = useState('')

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState<string>('')

  const [comboName, setComboName] = useState('')
  const [comboPrice, setComboPrice] = useState('')
  const [comboPickerItems, setComboPickerItems] = useState<ComboPickerEntry[]>([])
  const [comboPickerQuery, setComboPickerQuery] = useState('')
  const [comboDesc, setComboDesc] = useState('')

  const [productTogglePending, setProductTogglePending] = useState<Set<string>>(() => new Set())

  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [deleteTarget, setDeleteTarget] = useState<DeleteConfirmTarget | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const loadAll = useCallback(async () => {
    setError('')
    const [c, p] = await Promise.all([
      fetchAllCategories(eventId),
      fetchWorkspaceProducts(eventId, {
        page: productPage,
        pageSize: PRODUCT_PAGE_SIZE,
        type: catalogTab === 'products' ? 'single' : 'combo',
        q: catalogSearchQ || undefined,
        categoryId: filterCategoryId || undefined,
      }),
    ])
    if (!c.ok) setError(c.error)
    else setCategories(c.categories)
    if (!p.ok) setError(e => e || p.error)
    else {
      setProducts(p.products)
      setProductPagination(p.pagination)
    }
    setLoading(false)
    setListLoading(false)
  }, [eventId, productPage, catalogTab, catalogSearchQ, filterCategoryId])

  useEffect(() => {
    const t = window.setTimeout(() => setCatalogSearchQ(catalogSearchInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [catalogSearchInput])

  useLayoutEffect(() => {
    setProductPage(1)
    setSelectedIds(new Set())
  }, [catalogTab, catalogSearchQ, filterCategoryId])

  useEffect(() => {
    setListLoading(true)
    loadAll()
  }, [loadAll])

  // Keep last drawer content rendered during slide-out animation
  useEffect(() => {
    if (drawerMode) {
      setDrawerContent(drawerMode)
      return
    }
    const t = window.setTimeout(() => setDrawerContent(null), 300)
    return () => window.clearTimeout(t)
  }, [drawerMode])

  // ESC closes drawer / bulk confirm
  useEffect(() => {
    if (!drawerMode && bulkConfirm === null) return
    const handler = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return
      if (bulkConfirm) setBulkConfirm(null)
      else if (drawerMode) closeDrawer()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [drawerMode, bulkConfirm])

  useEffect(() => {
    if (drawerMode !== 'combo') {
      setComboDrawerSingles([])
      setComboDrawerSinglesLoading(false)
      return
    }
    let cancelled = false
    setComboDrawerSinglesLoading(true)
    fetchAllWorkspaceProducts(eventId, { type: 'single' }).then(res => {
      if (cancelled) return
      setComboDrawerSinglesLoading(false)
      if (!res.ok) {
        setError(res.error)
        setComboDrawerSingles([])
        return
      }
      setComboDrawerSingles(res.products)
    })
    return () => {
      cancelled = true
    }
  }, [drawerMode, eventId])

  const hasCatalogFilters =
    catalogSearchInput.trim().length > 0 || Boolean(filterCategoryId)

  const closeDrawer = () => {
    setDrawerMode(null)
    setEditingCatalogId(null)
    setFormError('')
    setName('')
    setPrice('')
    setDescription('')
    setCategoryId('')
    setComboName('')
    setComboPrice('')
    setComboDesc('')
    setComboPickerItems([])
    setComboPickerQuery('')
  }

  const handleAddCategory = async () => {
    const n = catName.trim()
    if (n.length < 2) return
    const res = await createCategory(eventId, n)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setCategories(prev => [...prev, res.category].sort((a, b) => a.sort_order - b.sort_order || a.name.localeCompare(b.name)))
    setCatName('')
  }

  const handleDeleteCategory = async (id: string) => {
    const res = await deleteCategory(eventId, id)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setCategories(prev => prev.filter(c => c.id !== id))
    loadAll()
  }

  const handleSaveProduct = async () => {
    if (!name.trim() || !price.trim()) {
      setFormError('Nombre y precio son requeridos')
      return
    }
    const pr = Number(price)
    if (Number.isNaN(pr) || pr < 0) {
      setFormError('Precio inválido')
      return
    }
    setSaving(true)
    setFormError('')
    if (editingCatalogId) {
      const res = await patchWorkspaceProduct(eventId, editingCatalogId, {
        name: name.trim(),
        price: pr,
        description: description.trim() || null,
        category_id: categoryId ? categoryId : null,
      })
      setSaving(false)
      if (!res.ok) {
        setFormError(res.error)
        return
      }
      setProducts(list => list.map(x => (x.id === editingCatalogId ? res.product : x)))
      closeDrawer()
      return
    }
    const res = await createWorkspaceProduct(eventId, {
      name: name.trim(),
      price: pr,
      description: description.trim() || undefined,
      category_id: categoryId || undefined,
      type: 'single',
    })
    setSaving(false)
    if (!res.ok) {
      setFormError(res.error)
      return
    }
    setProducts(prev => [...prev, res.product])
    closeDrawer()
  }

  const handleSaveCombo = async () => {
    if (!comboName.trim() || !comboPrice.trim()) {
      setFormError('Nombre y precio son requeridos')
      return
    }
    const pr = Number(comboPrice)
    if (Number.isNaN(pr) || pr < 0) {
      setFormError('Precio inválido')
      return
    }
    const lines = comboPickerItems.map(l => ({
      product_id: l.product_id,
      quantity: Math.max(1, l.quantity),
    }))
    if (lines.length === 0) {
      setFormError('Agregá al menos un producto al combo')
      return
    }
    setSaving(true)
    setFormError('')
    if (editingCatalogId) {
      const res = await patchWorkspaceProduct(eventId, editingCatalogId, {
        name: comboName.trim(),
        price: pr,
        description: comboDesc.trim() || null,
        lines,
      })
      setSaving(false)
      if (!res.ok) {
        setFormError(res.error)
        return
      }
      setProducts(list => list.map(x => (x.id === editingCatalogId ? res.product : x)))
      closeDrawer()
      return
    }
    const res = await createWorkspaceProduct(eventId, {
      name: comboName.trim(),
      price: pr,
      description: comboDesc.trim() || undefined,
      type: 'combo',
      lines,
    })
    setSaving(false)
    if (!res.ok) {
      setFormError(res.error)
      return
    }
    setProducts(prev => [...prev, res.product])
    closeDrawer()
  }

  const toggleActive = async (p: WorkspaceProduct) => {
    if (productTogglePending.has(p.id)) return
    setProductTogglePending(prev => new Set(prev).add(p.id))
    const prev = products
    const nextActive = !p.is_active
    setProducts(list => list.map(x => (x.id === p.id ? { ...x, is_active: nextActive } : x)))
    try {
      const res = await patchWorkspaceProduct(eventId, p.id, { is_active: nextActive })
      if (!res.ok) {
        setProducts(prev)
        setError(res.error)
      } else {
        setProducts(list => list.map(x => (x.id === p.id ? res.product : x)))
      }
    } finally {
      setProductTogglePending(s => {
        const next = new Set(s)
        next.delete(p.id)
        return next
      })
    }
  }

  const addSingleToCombo = (productId: string) => {
    const meta = comboDrawerSingles.find(s => s.id === productId)
    setComboPickerItems(items => {
      const idx = items.findIndex(i => i.product_id === productId)
      if (idx >= 0) {
        const copy = [...items]
        copy[idx] = { ...copy[idx], quantity: copy[idx].quantity + 1 }
        return copy
      }
      return [...items, { product_id: productId, quantity: 1, displayName: meta?.name }]
    })
    setComboPickerQuery('')
    setFormError('')
  }

  const bumpComboItemQty = (productId: string, delta: number) => {
    setComboPickerItems(items => {
      const idx = items.findIndex(i => i.product_id === productId)
      if (idx < 0) return items
      const q = items[idx].quantity + delta
      if (q < 1) return items.filter((_, i) => i !== idx)
      const copy = [...items]
      copy[idx] = { ...copy[idx], quantity: q }
      return copy
    })
  }

  const removeComboItem = (productId: string) => {
    setComboPickerItems(items => items.filter(i => i.product_id !== productId))
  }

  const pickerFilteredSingles = comboDrawerSingles.filter(p => {
    const q = comboPickerQuery.trim().toLowerCase()
    if (!q) return true
    return (
      p.name.toLowerCase().includes(q)
      || (p.category_name?.toLowerCase().includes(q) ?? false)
      || formatPrice(p.price).replace(/\s/g, '').toLowerCase().includes(q.replace(/\s/g, ''))
    )
  })

  const toggleSelected = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const allVisibleSelected = products.length > 0 && products.every(p => selectedIds.has(p.id))

  const toggleSelectAllVisible = () => {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        products.forEach(p => next.delete(p.id))
      } else {
        products.forEach(p => next.add(p.id))
      }
      return next
    })
  }

  const runBulkAction = async (action: 'pause' | 'activate' | 'delete') => {
    const ids = Array.from(selectedIds).filter(id => products.some(p => p.id === id))
    if (ids.length === 0) return
    setBulkSubmitting(true)
    try {
      if (action === 'delete') {
        const results = await Promise.all(ids.map(id => deleteWorkspaceProduct(eventId, id)))
        const failed = results.filter(r => !r.ok).length
        if (failed > 0) setError(`No se pudieron eliminar ${failed} ítems`)
        setProducts(prev => prev.filter(p => !ids.includes(p.id)))
      } else {
        const isActive = action === 'activate'
        const results = await Promise.all(ids.map(id => patchWorkspaceProduct(eventId, id, { is_active: isActive })))
        const failed = results.filter(r => !r.ok).length
        if (failed > 0) setError(`No se pudieron actualizar ${failed} ítems`)
        setProducts(prev => prev.map(p => ids.includes(p.id) ? { ...p, is_active: isActive } : p))
      }
      setSelectedIds(new Set())
      setBulkConfirm(null)
    } finally {
      setBulkSubmitting(false)
    }
  }

  const reorderProducts = async (sourceId: string, targetId: string) => {
    if (sourceId === targetId) return
    setProducts(prev => {
      const sourceIdx = prev.findIndex(p => p.id === sourceId)
      const targetIdx = prev.findIndex(p => p.id === targetId)
      if (sourceIdx === -1 || targetIdx === -1) return prev
      const next = [...prev]
      const [moved] = next.splice(sourceIdx, 1)
      next.splice(targetIdx, 0, moved)
      return next
    })
  }

  const removeProduct = async (id: string) => {
    const res = await deleteWorkspaceProduct(eventId, id)
    if (!res.ok) {
      setError(res.error)
      return
    }
    setProducts(prev => prev.filter(p => p.id !== id))
  }

  const confirmDeleteTarget = async () => {
    if (!deleteTarget || deleteSubmitting) return
    setDeleteSubmitting(true)
    try {
      if (deleteTarget.kind === 'category') {
        await handleDeleteCategory(deleteTarget.id)
      } else {
        await removeProduct(deleteTarget.id)
      }
      setDeleteTarget(null)
    } finally {
      setDeleteSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="w-full min-w-0 flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" className="text-gray-900" />
        <p className="text-sm text-gray-400">Cargando catálogo…</p>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-none">
      <style>{`
        .nb-pill-btn { transition: background 0.15s, color 0.15s, border-color 0.15s; }
        .nb-pill-btn:hover { background: #F5F5F7 !important; color: #0A0A0F !important; border-color: rgba(0,0,0,0.18) !important; }
        .nb-select {
          appearance: none;
          -webkit-appearance: none;
          -moz-appearance: none;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12' fill='none'%3E%3Cpath d='M3 4.5L6 7.5L9 4.5' stroke='%236B7280' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 36px !important;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .nb-select:hover { border-color: rgba(0,0,0,0.18) !important; }
        .nb-select:focus { border-color: #0A0A0F !important; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
        .nb-input { transition: border-color 0.15s, box-shadow 0.15s; }
        .nb-input:focus { border-color: #0A0A0F !important; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
        .nb-select-opt:hover { background: #F5F5F7 !important; }
        @keyframes nb-select-pop { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>

      <OrganizerToolHeading
        title="Catálogo"
        description="Armá el menú con productos, combos y categorías."
        actions={
          <>
          <button
            type="button"
            onClick={() => setDrawerMode('categories')}
            className="nb-pill-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: '#FFFFFF', color: '#6B7280', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '100px', padding: '9px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
            title="Gestionar categorías"
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <rect x="1.5" y="1.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.4"/>
              <rect x="7.5" y="1.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.4"/>
              <rect x="1.5" y="7.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.4"/>
              <rect x="7.5" y="7.5" width="4" height="4" rx="1" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
            Categorías
            {categories.length > 0 && <span style={{ background: '#F5F5F7', color: '#0A0A0F', fontWeight: 700, padding: '1px 7px', borderRadius: '100px', fontSize: '11px' }}>{categories.length}</span>}
          </button>
          <button
            type="button"
            onClick={() => {
              setFormError('')
              setEditingCatalogId(null)
              setName('')
              setPrice('')
              setDescription('')
              setCategoryId('')
              setDrawerMode('product')
            }}
            className="nb-pill-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#FFFFFF', color: '#6B7280', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '100px', padding: '9px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M7 1L1 4v6l6 3 6-3V4L7 1z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
              <path d="M1 4l6 3 6-3M7 7v6" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
            </svg>
            Producto
          </button>
          <button
            type="button"
            onClick={() => {
              setFormError('')
              setEditingCatalogId(null)
              setComboName('')
              setComboPrice('')
              setComboDesc('')
              setComboPickerItems([])
              setComboPickerQuery('')
              setDrawerMode('combo')
            }}
            className="nb-pill-btn"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '7px', background: '#FFFFFF', color: '#6B7280', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '100px', padding: '9px 14px', fontSize: '13px', fontWeight: 500, cursor: 'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <rect x="1.5" y="1.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
              <rect x="8" y="1.5" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
              <rect x="1.5" y="8" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
              <rect x="8" y="8" width="4.5" height="4.5" rx="1" stroke="currentColor" strokeWidth="1.4"/>
            </svg>
            Combo
          </button>
          </>
        }
      />

      {error && (
        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '12px', padding: '10px 14px', fontSize: '13px', color: '#DC2626', marginBottom: '16px' }}>
          {error}
        </div>
      )}


      <div className="min-w-0">
        {/* Tabs */}
        <div
          className="mb-5"
          style={{ position: 'relative', display: 'inline-grid', gridTemplateColumns: '1fr 1fr', gap: '4px', padding: '4px', background: '#F5F5F7', borderRadius: '100px' }}
          role="tablist"
          aria-label="Tipo de ítem del catálogo"
        >
          {/* Sliding pill */}
          <span
            aria-hidden
            style={{
              position: 'absolute',
              top: '4px',
              bottom: '4px',
              left: '4px',
              width: 'calc(50% - 6px)',
              background: '#FFFFFF',
              borderRadius: '100px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
              transform: catalogTab === 'combos' ? 'translateX(calc(100% + 4px))' : 'translateX(0)',
              transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
            }}
          />
          {([
            { key: 'products' as const, label: 'Productos' },
            { key: 'combos' as const, label: 'Combos' },
          ]).map(({ key, label }) => {
            const active = catalogTab === key
            return (
              <button
                key={key}
                type="button"
                role="tab"
                aria-selected={active}
                id={`catalog-tab-${key}`}
                aria-controls={`catalog-panel-${key}`}
                onClick={() => setCatalogTab(key)}
                style={{
                  position: 'relative',
                  zIndex: 1,
                  background: 'transparent',
                  color: active ? '#0A0A0F' : '#9A9AA8',
                  border: 'none',
                  borderRadius: '100px',
                  padding: '7px 22px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  letterSpacing: '-0.01em',
                  transition: 'color 0.2s ease',
                }}
              >
                {label}
              </button>
            )
          })}
        </div>

        {/* Search + filter */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-5">
          <div className="relative flex-1 min-w-[12rem]">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#C8C8D0', pointerEvents: 'none' }}>
              <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9.5 9.5L12.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <input
              id="catalog-search"
              type="search"
              value={catalogSearchInput}
              onChange={e => setCatalogSearchInput(e.target.value)}
              placeholder={`Buscar ${catalogTab === 'products' ? 'productos' : 'combos'}…`}
              style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', padding: '10px 14px 10px 38px', fontSize: '13px', color: '#0A0A0F', background: '#FAFAFA', outline: 'none' }}
              autoComplete="off"
              aria-label="Buscar en catálogo"
            />
          </div>
          <NubaSelect
            value={filterCategoryId}
            onChange={setFilterCategoryId}
            ariaLabel="Filtrar por categoría"
            minWidth={200}
            options={[
              { value: '', label: 'Todas las categorías' },
              { value: 'none', label: 'Sin categoría' },
              ...categories.map(c => ({ value: c.id, label: c.name })),
            ]}
          />
          {hasCatalogFilters && (
            <button
              type="button"
              onClick={() => {
                setCatalogSearchInput('')
                setFilterCategoryId('')
              }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, color: '#9A9AA8', padding: '8px 4px', whiteSpace: 'nowrap' }}
            >
              Limpiar
            </button>
          )}
        </div>

        <div style={{ position: 'relative', minHeight: '120px' }}>
          {listLoading && !loading && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(2px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 5, borderRadius: '16px', pointerEvents: 'none' }}>
              <Spinner className="text-gray-900" />
            </div>
          )}
        {catalogTab === 'products' ? (
          <section
            className="min-w-0"
            role="tabpanel"
            id="catalog-panel-products"
            aria-labelledby="catalog-tab-products"
          >
            {products.length === 0 ? (
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '64px 24px', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <path d="M11 2L3 6v10l8 4 8-4V6L11 2z" stroke="#C8C8D0" strokeWidth="1.5" strokeLinejoin="round"/>
                    <path d="M3 6l8 4 8-4M11 10v10" stroke="#C8C8D0" strokeWidth="1.5"/>
                  </svg>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#0A0A0F', margin: '0 0 6px 0' }}>Sin productos en esta vista</p>
                <p style={{ fontSize: '13px', color: '#9A9AA8', margin: 0, maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
                  {hasCatalogFilters ? 'Probá otra búsqueda o quitá filtros.' : 'Creá tu primer producto con el botón de arriba.'}
                </p>
              </div>
            ) : (
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 12px 10px 18px', background: '#FAFAFA', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
                  <span style={{ width: '10px', flexShrink: 0 }} />
                  <button
                    type="button"
                    onClick={toggleSelectAllVisible}
                    aria-checked={allVisibleSelected}
                    role="checkbox"
                    style={{ width: '18px', height: '18px', borderRadius: '5px', border: allVisibleSelected ? 'none' : '1.5px solid rgba(0,0,0,0.18)', background: allVisibleSelected ? '#0A0A0F' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                  >
                    {allVisibleSelected && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5 5.5-5.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: '#9A9AA8', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
                    {selectedIds.size > 0 ? `${selectedIds.size} seleccionado${selectedIds.size === 1 ? '' : 's'}` : `${products.length} producto${products.length === 1 ? '' : 's'}`}
                  </span>
                </div>
                {products.map((product, idx) => {
                  const checked = selectedIds.has(product.id)
                  const isOver = dragOverId === product.id && draggedId !== product.id
                  return (
                  <div
                    key={product.id}
                    className="group"
                    draggable
                    onDragStart={e => { setDraggedId(product.id); e.dataTransfer.effectAllowed = 'move' }}
                    onDragOver={e => { e.preventDefault(); setDragOverId(product.id); e.dataTransfer.dropEffect = 'move' }}
                    onDragLeave={() => setDragOverId(curr => curr === product.id ? null : curr)}
                    onDrop={e => { e.preventDefault(); if (draggedId) reorderProducts(draggedId, product.id); setDraggedId(null); setDragOverId(null) }}
                    onDragEnd={() => { setDraggedId(null); setDragOverId(null) }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '14px 12px 14px 18px',
                      borderTop: idx === 0 ? 'none' : '1px solid rgba(0,0,0,0.05)',
                      opacity: draggedId === product.id ? 0.4 : (product.is_active ? 1 : 0.55),
                      background: isOver ? 'rgba(198,255,0,0.08)' : 'transparent',
                      transition: 'opacity 0.15s, background 0.1s',
                      cursor: draggedId === product.id ? 'grabbing' : 'default',
                    }}
                  >
                    <span style={{ display: 'flex', alignItems: 'center', cursor: 'grab', color: '#D1D5DB', flexShrink: 0 }} className="nb-drag-handle" title="Arrastrar para reordenar">
                      <svg width="10" height="14" viewBox="0 0 10 14" fill="none">
                        <circle cx="3" cy="3" r="1" fill="currentColor"/>
                        <circle cx="7" cy="3" r="1" fill="currentColor"/>
                        <circle cx="3" cy="7" r="1" fill="currentColor"/>
                        <circle cx="7" cy="7" r="1" fill="currentColor"/>
                        <circle cx="3" cy="11" r="1" fill="currentColor"/>
                        <circle cx="7" cy="11" r="1" fill="currentColor"/>
                      </svg>
                    </span>
                    <button
                      type="button"
                      onClick={() => toggleSelected(product.id)}
                      aria-checked={checked}
                      role="checkbox"
                      style={{ width: '18px', height: '18px', borderRadius: '5px', border: checked ? 'none' : '1.5px solid rgba(0,0,0,0.18)', background: checked ? '#0A0A0F' : '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, padding: 0 }}
                    >
                      {checked && <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4l2.5 2.5 5.5-5.5" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </button>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                        {product.name}
                      </p>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '3px', fontSize: '12px', color: '#9A9AA8' }}>
                        <span style={{ fontWeight: 600, color: '#0A0A0F' }}>{formatPrice(product.price)}</span>
                        {product.category_name && (
                          <>
                            <span style={{ color: '#E0E0E5' }}>·</span>
                            <span>{product.category_name}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                      <button
                        type="button"
                        onClick={() => {
                          setFormError('')
                          setEditingCatalogId(product.id)
                          setName(product.name)
                          setPrice(String(product.price))
                          setDescription(product.description ?? '')
                          setCategoryId(product.category_id ?? '')
                          setDrawerMode('product')
                        }}
                        title="Editar"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: '#9A9AA8', display: 'flex', alignItems: 'center', transition: 'background 0.15s, color 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = '#F5F5F7'; e.currentTarget.style.color = '#0A0A0F' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9A9AA8' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                          <path d="M2 12h2L11 5l-2-2L2 10v2zM9 3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeleteTarget({ kind: 'catalog', id: product.id, name: product.name, variant: 'single' })}
                        aria-label={`Eliminar ${product.name}`}
                        title="Eliminar"
                        style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: '#9A9AA8', display: 'flex', alignItems: 'center', transition: 'background 0.15s, color 0.15s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#DC2626' }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9A9AA8' }}
                      >
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      </button>
                      <div style={{ marginLeft: '6px' }}>
                        <ToggleSwitch
                          checked={product.is_active}
                          disabled={productTogglePending.has(product.id)}
                          onChange={() => toggleActive(product)}
                        />
                      </div>
                    </div>
                  </div>
                  )
                })}
              </div>
            )}
          </section>
        ) : (
          <section
            className="min-w-0"
            role="tabpanel"
            id="catalog-panel-combos"
            aria-labelledby="catalog-tab-combos"
          >
            {products.length === 0 ? (
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '20px', padding: '64px 24px', textAlign: 'center' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: '#F5F5F7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                  <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                    <rect x="3" y="3" width="7" height="7" rx="1.5" stroke="#C8C8D0" strokeWidth="1.5"/>
                    <rect x="12" y="3" width="7" height="7" rx="1.5" stroke="#C8C8D0" strokeWidth="1.5"/>
                    <rect x="3" y="12" width="7" height="7" rx="1.5" stroke="#C8C8D0" strokeWidth="1.5"/>
                    <rect x="12" y="12" width="7" height="7" rx="1.5" stroke="#C8C8D0" strokeWidth="1.5"/>
                  </svg>
                </div>
                <p style={{ fontSize: '15px', fontWeight: 600, color: '#0A0A0F', margin: '0 0 6px 0' }}>Sin combos todavía</p>
                <p style={{ fontSize: '13px', color: '#9A9AA8', margin: 0, maxWidth: '320px', marginLeft: 'auto', marginRight: 'auto' }}>
                  {hasCatalogFilters ? 'Probá otra búsqueda o quitá filtros.' : 'Un combo agrupa varios productos con un precio.'}
                </p>
              </div>
            ) : (
              <div style={{ background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '16px', overflow: 'hidden' }}>
                {products.map((combo, idx) => (
                  <div
                    key={combo.id}
                    style={{
                      display: 'flex', flexDirection: 'column', gap: '8px',
                      padding: '14px 18px',
                      borderTop: idx === 0 ? 'none' : '1px solid rgba(0,0,0,0.05)',
                      opacity: combo.is_active ? 1 : 0.55,
                      transition: 'opacity 0.15s',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '14px', fontWeight: 600, color: '#0A0A0F', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.01em' }}>
                          {combo.name}
                        </p>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: '#0A0A0F', margin: '3px 0 0 0' }}>{formatPrice(combo.price)}</p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setFormError('')
                            setEditingCatalogId(combo.id)
                            setComboName(combo.name)
                            setComboPrice(String(combo.price))
                            setComboDesc(combo.description ?? '')
                            setComboPickerItems(
                              combo.combo_lines.map(l => ({ product_id: l.product_id, quantity: l.quantity, displayName: l.name })),
                            )
                            setComboPickerQuery('')
                            setDrawerMode('combo')
                          }}
                          title="Editar"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: '#9A9AA8', display: 'flex', alignItems: 'center', transition: 'background 0.15s, color 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = '#F5F5F7'; e.currentTarget.style.color = '#0A0A0F' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9A9AA8' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <path d="M2 12h2L11 5l-2-2L2 10v2zM9 3l2 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget({ kind: 'catalog', id: combo.id, name: combo.name, variant: 'combo' })}
                          title="Eliminar"
                          style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '8px', borderRadius: '8px', color: '#9A9AA8', display: 'flex', alignItems: 'center', transition: 'background 0.15s, color 0.15s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#DC2626' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9A9AA8' }}
                        >
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                        </button>
                        <div style={{ marginLeft: '6px' }}>
                          <ToggleSwitch
                            checked={combo.is_active}
                            disabled={productTogglePending.has(combo.id)}
                            onChange={() => toggleActive(combo)}
                          />
                        </div>
                      </div>
                    </div>
                    {combo.combo_lines.length > 0 && (
                      <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', listStyle: 'none', padding: 0, margin: 0 }}>
                        {combo.combo_lines.map(line => (
                          <li
                            key={`${combo.id}-${line.product_id}`}
                            style={{ fontSize: '11px', color: '#6B7280', background: '#F5F5F7', borderRadius: '100px', padding: '3px 9px' }}
                          >
                            <span style={{ fontWeight: 700, color: '#0A0A0F' }}>{line.quantity}×</span> {line.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}
        </div>
      </div>

      {productPagination.total > 0 && (
        <div className="mt-8 max-w-4xl">
          <PaginationBar
            page={productPagination.page}
            pageSize={productPagination.page_size}
            total={productPagination.total}
            onPageChange={setProductPage}
          />
        </div>
      )}

      <div
        role="presentation"
        onClick={closeDrawer}
        className={`fixed inset-0 z-40 transition-opacity duration-300 ${drawerMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        style={{ background: 'rgba(10,10,15,0.55)' }}
      />

      <div
        className={`fixed top-0 right-0 h-full z-50 bg-white shadow-2xl transition-transform duration-300 flex flex-col ${drawerMode ? 'translate-x-0' : 'translate-x-full'} ${drawerContent === 'combo' ? 'w-[min(100vw,30rem)]' : 'w-[min(100vw,24rem)]'}`}
        style={{ transitionTimingFunction: 'cubic-bezier(0.32, 0.72, 0, 1)', borderTopLeftRadius: '24px', borderBottomLeftRadius: '24px', fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)" }}
      >
        {/* ── Drawer header (shared) ── */}
        {drawerContent && (() => {
          const titles = {
            categories: { title: 'Categorías', subtitle: 'Agrupá productos para organizar el menú.' },
            product: { title: editingCatalogId ? 'Editar producto' : 'Nuevo producto', subtitle: editingCatalogId ? null : 'Sumá un ítem simple al catálogo.' },
            combo: { title: editingCatalogId ? 'Editar combo' : 'Nuevo combo', subtitle: editingCatalogId ? null : 'Agrupá productos en un solo precio.' },
          } as const
          const { title, subtitle } = titles[drawerContent]
          return (
            <div style={{ padding: '24px 24px 18px', borderBottom: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px', flexShrink: 0 }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h2 style={{ fontSize: '18px', fontWeight: 600, color: '#0A0A0F', letterSpacing: '-0.02em', margin: 0 }}>{title}</h2>
                {subtitle && <p style={{ fontSize: '12px', color: '#9A9AA8', margin: '4px 0 0 0', lineHeight: 1.5 }}>{subtitle}</p>}
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
          )
        })()}

        {drawerContent === 'categories' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
              <input
                type="text"
                value={catName}
                onChange={e => setCatName(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddCategory() } }}
                placeholder="Nueva categoría…"
                style={{ flex: 1, borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', padding: '11px 14px', fontSize: '13px', color: '#0A0A0F', background: '#FAFAFA', outline: 'none' }}
              />
              <button
                type="button"
                onClick={handleAddCategory}
                disabled={!catName.trim()}
                style={{ background: catName.trim() ? '#C6FF00' : '#F5F5F5', color: catName.trim() ? '#0A0F00' : '#C8C8D0', border: 'none', borderRadius: '12px', padding: '11px 18px', fontSize: '13px', fontWeight: 700, cursor: catName.trim() ? 'pointer' : 'not-allowed', flexShrink: 0 }}
              >
                Agregar
              </button>
            </div>
            {categories.length > 0 && (
              <p style={{ fontSize: '11px', fontWeight: 700, color: '#9A9AA8', letterSpacing: '0.08em', textTransform: 'uppercase', margin: '0 0 10px 0' }}>
                {categories.length} categoría{categories.length === 1 ? '' : 's'}
              </p>
            )}
            {categories.length === 0 ? (
              <div style={{ background: '#FAFAFA', border: '1px dashed rgba(0,0,0,0.1)', borderRadius: '14px', padding: '40px 20px', textAlign: 'center' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                    <rect x="2" y="2" width="6" height="6" rx="1.5" stroke="#C8C8D0" strokeWidth="1.5"/>
                    <rect x="10" y="2" width="6" height="6" rx="1.5" stroke="#C8C8D0" strokeWidth="1.5"/>
                    <rect x="2" y="10" width="6" height="6" rx="1.5" stroke="#C8C8D0" strokeWidth="1.5"/>
                    <rect x="10" y="10" width="6" height="6" rx="1.5" stroke="#C8C8D0" strokeWidth="1.5"/>
                  </svg>
                </div>
                <p style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0F', margin: '0 0 4px 0' }}>Sin categorías</p>
                <p style={{ fontSize: '12px', color: '#9A9AA8', margin: 0 }}>Creá la primera para organizar el menú.</p>
              </div>
            ) : (
              <ul style={{ display: 'flex', flexDirection: 'column', gap: '6px', listStyle: 'none', padding: 0, margin: 0 }}>
                {categories.map(c => (
                  <li
                    key={c.id}
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#FFFFFF', border: '1px solid rgba(0,0,0,0.07)', borderRadius: '12px', padding: '10px 10px 10px 14px' }}
                  >
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#0A0A0F' }}>{c.name}</span>
                    <button
                      type="button"
                      onClick={() => setDeleteTarget({ kind: 'category', id: c.id, name: c.name })}
                      style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '6px', borderRadius: '8px', color: '#9A9AA8', display: 'flex', alignItems: 'center', transition: 'background 0.15s, color 0.15s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(239,68,68,0.08)'; e.currentTarget.style.color = '#DC2626' }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9A9AA8' }}
                      aria-label={`Eliminar categoría ${c.name}`}
                    >
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {drawerContent === 'product' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9A9AA8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Nombre</label>
                  <input type="text" value={name} onChange={e => { setName(e.target.value); setFormError('') }} placeholder="Ej: Cerveza Heineken 500ml" style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', padding: '11px 14px', fontSize: '13px', color: '#0A0A0F', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }} disabled={saving} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9A9AA8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Precio (ARS)</label>
                  <input type="number" value={price} onChange={e => { setPrice(e.target.value); setFormError('') }} placeholder="8000" style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', padding: '11px 14px', fontSize: '13px', color: '#0A0A0F', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }} disabled={saving} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9A9AA8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>Categoría</label>
                  <NubaSelect
                    value={categoryId}
                    onChange={setCategoryId}
                    disabled={saving}
                    fullWidth
                    ariaLabel="Categoría"
                    options={[
                      { value: '', label: 'Sin categoría' },
                      ...categories.map(c => ({ value: c.id, label: c.name })),
                    ]}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: '#9A9AA8', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: '6px' }}>
                    Descripción <span style={{ fontWeight: 500, textTransform: 'none', letterSpacing: 0, color: '#C8C8D0' }}>· opcional</span>
                  </label>
                  <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalle visible en el catálogo" style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', padding: '11px 14px', fontSize: '13px', color: '#0A0A0F', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }} disabled={saving} />
                </div>
                {formError && (
                  <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#DC2626' }}>
                    {formError}
                  </div>
                )}
              </div>
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(0,0,0,0.06)', flexShrink: 0, background: '#FFFFFF' }}>
              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={saving}
                style={{ width: '100%', borderRadius: '100px', background: '#C6FF00', color: '#0A0F00', border: 'none', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, letterSpacing: '-0.01em' }}
              >
                {saving ? 'Guardando…' : editingCatalogId ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </>
        )}

        {drawerContent === 'combo' && (
          <>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <section className="flex flex-col gap-3">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Datos del combo</p>
              <input type="text" value={comboName} onChange={e => { setComboName(e.target.value); setFormError('') }} placeholder="Nombre visible para el cliente" className={inputClass} disabled={saving} />
              <input type="number" value={comboPrice} onChange={e => { setComboPrice(e.target.value); setFormError('') }} placeholder="Precio del combo (ARS)" className={inputClass} disabled={saving} />
              <input type="text" value={comboDesc} onChange={e => setComboDesc(e.target.value)} placeholder="Descripción (opcional)" className={inputClass} disabled={saving} />
            </section>

            <section className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Qué incluye</p>
                {comboPickerItems.length > 0 && (
                  <span className="text-[11px] text-gray-400 tabular-nums">{comboPickerItems.length} ítem{comboPickerItems.length === 1 ? '' : 's'}</span>
                )}
              </div>

              {comboPickerItems.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/90 px-4 py-8 text-center">
                  <p className="text-sm font-medium text-gray-700">Todavía no hay productos en este combo</p>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    Usá el buscador de abajo. Al tocar un producto lo sumamos acá con cantidad editable.
                  </p>
                </div>
              ) : (
                <ul className="flex flex-col gap-2">
                  {comboPickerItems.map(entry => {
                    const rowProduct = comboDrawerSingles.find(s => s.id === entry.product_id)
                    const title = entry.displayName ?? rowProduct?.name ?? 'Producto'
                    const unit = rowProduct?.price
                    const lineTotal = unit != null ? unit * entry.quantity : null
                    return (
                      <li
                        key={entry.product_id}
                        className="rounded-2xl border border-gray-100 bg-white px-3 py-3 shadow-sm flex gap-3 items-center"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 truncate">{title}</p>
                          <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                            {rowProduct
                              ? (
                                  <>
                                    {formatPrice(rowProduct.price)} c/u
                                    {rowProduct.category_name ? ` · ${rowProduct.category_name}` : ''}
                                  </>
                                )
                              : (
                                  <span className="italic">Precio no disponible en el catálogo</span>
                                )}
                          </p>
                          {lineTotal != null && (
                            <p className="text-xs font-medium text-gray-700 mt-1 tabular-nums">
                              Subtotal · {formatPrice(lineTotal)}
                            </p>
                          )}
                        </div>
                        <div className="flex flex-col items-end gap-2 shrink-0">
                          <div className="flex items-center rounded-full border border-gray-200 bg-gray-50 p-0.5">
                            <button
                              type="button"
                              className="w-9 h-9 rounded-full text-base leading-none text-gray-700 hover:bg-white disabled:opacity-40"
                              disabled={saving}
                              aria-label="Menos cantidad"
                              onClick={() => bumpComboItemQty(entry.product_id, -1)}
                            >
                              −
                            </button>
                            <span className="min-w-[2rem] text-center text-sm font-semibold tabular-nums text-gray-900">{entry.quantity}</span>
                            <button
                              type="button"
                              className="w-9 h-9 rounded-full text-base leading-none text-gray-700 hover:bg-white disabled:opacity-40"
                              disabled={saving}
                              aria-label="Más cantidad"
                              onClick={() => bumpComboItemQty(entry.product_id, 1)}
                            >
                              +
                            </button>
                          </div>
                          <button
                            type="button"
                            className="text-[11px] font-medium text-gray-400 hover:text-red-600"
                            disabled={saving}
                            onClick={() => removeComboItem(entry.product_id)}
                          >
                            Quitar
                          </button>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              )}
            </section>

            <section className="flex flex-col gap-2">
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider">Sumar desde el catálogo</p>
              <input
                type="text"
                value={comboPickerQuery}
                onChange={e => { setComboPickerQuery(e.target.value); setFormError('') }}
                placeholder="Buscar por nombre, categoría o precio…"
                className={inputClass}
                disabled={saving || comboDrawerSinglesLoading || comboDrawerSingles.length === 0}
                autoComplete="off"
                aria-label="Buscar productos para el combo"
              />
              <div className="rounded-2xl border border-gray-100 bg-gray-50/50 overflow-hidden">
                <ul className="max-h-52 overflow-y-auto divide-y divide-gray-100">
                  {comboDrawerSinglesLoading ? (
                    <li className="px-3 py-6 text-xs text-gray-400 text-center">Cargando productos…</li>
                  ) : comboDrawerSingles.length === 0 ? (
                    <li className="px-3 py-4 text-xs text-gray-400 text-center">No hay productos simples para elegir.</li>
                  ) : pickerFilteredSingles.length === 0 ? (
                    <li className="px-3 py-4 text-xs text-gray-400 text-center">Sin coincidencias con esa búsqueda.</li>
                  ) : (
                    pickerFilteredSingles.map(p => (
                      <li key={p.id}>
                        <button
                          type="button"
                          disabled={saving}
                          className="w-full text-left px-3 py-3 flex gap-3 items-center hover:bg-white active:bg-gray-100 transition-colors min-h-[52px]"
                          onClick={() => addSingleToCombo(p.id)}
                        >
                          <span className="flex-1 min-w-0">
                            <span className="block text-sm font-medium text-gray-900 truncate">{p.name}</span>
                            <span className="block text-[11px] text-gray-400 truncate mt-0.5">
                              {formatPrice(p.price)}
                              {p.category_name ? ` · ${p.category_name}` : ''}
                            </span>
                          </span>
                          <span className="text-[11px] font-semibold text-gray-900 shrink-0 px-2 py-1 rounded-full bg-gray-100">
                            +
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
              <p className="text-[11px] text-gray-400 leading-snug">
                Cada toque suma una unidad del mismo producto; después ajustás la cantidad con − / + en la lista de arriba.
              </p>
            </section>

            {formError && (
              <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.15)', borderRadius: '10px', padding: '10px 14px', fontSize: '13px', color: '#DC2626' }}>
                {formError}
              </div>
            )}
            {!editingCatalogId && !comboDrawerSinglesLoading && comboDrawerSingles.length === 0 && (
              <div style={{ background: 'rgba(245,158,11,0.06)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: '10px', padding: '10px 14px', fontSize: '12px', color: '#92400E' }}>
                Creá al menos un producto simple antes de armar un combo.
              </div>
            )}
            </div>
            <div style={{ padding: '16px 24px', borderTop: '1px solid rgba(0,0,0,0.06)', flexShrink: 0, background: '#FFFFFF' }}>
              <button
                type="button"
                onClick={handleSaveCombo}
                disabled={saving || (!editingCatalogId && (comboDrawerSinglesLoading || comboDrawerSingles.length === 0))}
                style={{ width: '100%', borderRadius: '100px', background: '#C6FF00', color: '#0A0F00', border: 'none', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: (saving || (!editingCatalogId && (comboDrawerSinglesLoading || comboDrawerSingles.length === 0))) ? 0.6 : 1, letterSpacing: '-0.01em' }}
              >
                {saving ? 'Guardando…' : editingCatalogId ? 'Guardar cambios' : 'Crear combo'}
              </button>
            </div>
          </>
        )}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div
          style={{
            position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)',
            zIndex: 30, background: '#0A0A0F', color: '#FFFFFF',
            borderRadius: '100px', padding: '8px 8px 8px 22px',
            display: 'flex', alignItems: 'center', gap: '14px',
            boxShadow: '0 12px 40px rgba(0,0,0,0.25)',
            fontFamily: "var(--font-dm-sans, 'DM Sans', sans-serif)",
          }}
          role="region"
          aria-label="Acciones masivas"
        >
          <span style={{ fontSize: '13px', fontWeight: 600, letterSpacing: '-0.01em' }}>
            {selectedIds.size} seleccionado{selectedIds.size === 1 ? '' : 's'}
          </span>
          <span style={{ width: '1px', height: '20px', background: 'rgba(255,255,255,0.12)' }} />
          <button
            type="button"
            onClick={() => runBulkAction('activate')}
            disabled={bulkSubmitting}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 500, cursor: bulkSubmitting ? 'not-allowed' : 'pointer', padding: '6px 4px' }}
          >
            Activar
          </button>
          <button
            type="button"
            onClick={() => runBulkAction('pause')}
            disabled={bulkSubmitting}
            style={{ background: 'transparent', border: 'none', color: 'rgba(255,255,255,0.85)', fontSize: '13px', fontWeight: 500, cursor: bulkSubmitting ? 'not-allowed' : 'pointer', padding: '6px 4px' }}
          >
            Pausar
          </button>
          <button
            type="button"
            onClick={() => setBulkConfirm('delete')}
            disabled={bulkSubmitting}
            style={{ background: 'rgba(239,68,68,0.18)', border: '1px solid rgba(239,68,68,0.4)', color: '#FCA5A5', fontSize: '13px', fontWeight: 600, cursor: bulkSubmitting ? 'not-allowed' : 'pointer', padding: '6px 14px', borderRadius: '100px' }}
          >
            Eliminar
          </button>
          <button
            type="button"
            onClick={() => setSelectedIds(new Set())}
            disabled={bulkSubmitting}
            style={{ background: 'rgba(255,255,255,0.08)', border: 'none', color: '#FFFFFF', cursor: 'pointer', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            aria-label="Cancelar selección"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M3 3l6 6M9 3l-6 6" stroke="white" strokeWidth="1.6" strokeLinecap="round"/></svg>
          </button>
        </div>
      )}

      {/* Bulk delete confirm */}
      <Modal
        isOpen={bulkConfirm === 'delete'}
        onClose={() => { if (!bulkSubmitting) setBulkConfirm(null) }}
        title="Eliminar seleccionados"
        containerClassName="z-[70]"
      >
        <p className="text-sm text-gray-600 mb-6 leading-relaxed">
          ¿Eliminar <span className="font-medium text-gray-900">{selectedIds.size}</span> ítem{selectedIds.size === 1 ? '' : 's'}? No se puede deshacer.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button
            type="button"
            disabled={bulkSubmitting}
            onClick={() => setBulkConfirm(null)}
            className="rounded-full border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={bulkSubmitting}
            onClick={() => runBulkAction('delete')}
            className="rounded-full bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-60"
          >
            {bulkSubmitting ? 'Eliminando…' : 'Eliminar'}
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => {
          if (!deleteSubmitting) setDeleteTarget(null)
        }}
        title="Confirmar eliminación"
        containerClassName="z-[70]"
      >
        {deleteTarget && (
          <>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              {deleteTarget.kind === 'category' ? (
                <>
                  ¿Eliminar la categoría «<span className="font-medium text-gray-900">{deleteTarget.name}</span>»? Si hay
                  productos asignados, el servidor puede rechazar la operación.
                </>
              ) : deleteTarget.variant === 'combo' ? (
                <>
                  ¿Eliminar el combo «<span className="font-medium text-gray-900">{deleteTarget.name}</span>»? No podrás
                  recuperarlo.
                </>
              ) : (
                <>
                  ¿Eliminar el producto «<span className="font-medium text-gray-900">{deleteTarget.name}</span>»? Si forma
                  parte de combos, el servidor puede rechazar la operación.
                </>
              )}
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
                onClick={confirmDeleteTarget}
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
