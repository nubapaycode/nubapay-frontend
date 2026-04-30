'use client'

import { useCallback, useEffect, useLayoutEffect, useState } from 'react'

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
      className={`w-11 h-6 rounded-full shrink-0 relative overflow-hidden transition-colors duration-200 ease-out ${
        checked ? 'bg-gray-900' : 'bg-gray-200'
      } ${disabled ? 'opacity-55 cursor-not-allowed' : ''}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-md ring-1 ring-black/5 ease-out ${
          disabled ? '' : 'transition-[left] duration-200 ease-out'
        }`}
        style={{ left: checked ? '23px' : '4px' }}
      />
    </button>
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
  const [error, setError] = useState('')
  const [drawerMode, setDrawerMode] = useState<'product' | 'combo' | null>(null)
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
  }, [eventId, productPage, catalogTab, catalogSearchQ, filterCategoryId])

  useEffect(() => {
    const t = window.setTimeout(() => setCatalogSearchQ(catalogSearchInput.trim()), 350)
    return () => window.clearTimeout(t)
  }, [catalogSearchInput])

  useLayoutEffect(() => {
    setProductPage(1)
  }, [catalogTab, catalogSearchQ, filterCategoryId])

  useEffect(() => {
    setLoading(true)
    loadAll()
  }, [loadAll])

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

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 md:-mt-5">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Catálogo</h1>
          <p className="text-xs text-gray-400 mt-1">Armá el menú con pestañas Productos / Combos y categorías abajo.</p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
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
            className="flex items-center gap-2 rounded-full bg-white text-gray-900 border border-gray-900 text-sm font-medium px-4 py-2 hover:bg-gray-50 transition-colors"
          >
            + Producto
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
            className="flex items-center gap-2 rounded-full bg-gray-900 text-white border border-gray-900 text-sm font-medium px-4 py-2 hover:bg-gray-700 transition-colors"
          >
            + Combo
          </button>
        </div>
      </div>

      {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

      <section className="mb-8">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Categorías</p>
        <div className="flex flex-wrap gap-2 mb-3">
          <input
            type="text"
            value={catName}
            onChange={e => setCatName(e.target.value)}
            placeholder="Nueva categoría"
            className={`${inputClass} max-w-xs`}
          />
          <button
            type="button"
            onClick={handleAddCategory}
            className="rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-50"
          >
            Agregar
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.length === 0 ? (
            <p className="text-xs text-gray-400">Sin categorías. Creá una para organizar el menú.</p>
          ) : (
            categories.map(c => (
              <span
                key={c.id}
                className="inline-flex items-center gap-2 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-800"
              >
                {c.name}
                <button
                  type="button"
                  onClick={() => setDeleteTarget({ kind: 'category', id: c.id, name: c.name })}
                  className="text-gray-400 hover:text-red-500"
                  aria-label={`Eliminar categoría ${c.name}`}
                >
                  ×
                </button>
              </span>
            ))
          )}
        </div>
      </section>

      <div className="min-w-0">
        <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-end gap-3 mb-4">
          <div className="flex-1 min-w-[12rem]">
            <label htmlFor="catalog-search" className="sr-only">Buscar en catálogo</label>
            <input
              id="catalog-search"
              type="search"
              value={catalogSearchInput}
              onChange={e => setCatalogSearchInput(e.target.value)}
              placeholder="Buscar por nombre o descripción…"
              className={inputClass}
              autoComplete="off"
            />
          </div>
          <div className="flex flex-wrap gap-2 items-center">
            <select
              value={filterCategoryId}
              onChange={e => setFilterCategoryId(e.target.value)}
              className={`${inputClass} w-auto min-w-[10rem] py-2 text-sm`}
              aria-label="Filtrar por categoría"
            >
              <option value="">Todas las categorías</option>
              <option value="none">Sin categoría</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            {hasCatalogFilters && (
              <button
                type="button"
                onClick={() => {
                  setCatalogSearchInput('')
                  setFilterCategoryId('')
                }}
                className="text-xs font-medium text-gray-500 hover:text-gray-900 px-2 py-2"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        <div
          className="flex gap-6 border-b border-gray-100 mb-4"
          role="tablist"
          aria-label="Tipo de ítem del catálogo"
        >
          <button
            type="button"
            role="tab"
            aria-selected={catalogTab === 'products'}
            id="catalog-tab-products"
            aria-controls="catalog-panel-products"
            onClick={() => setCatalogTab('products')}
            className={`pb-2 text-xs font-medium tracking-wide transition-colors border-b-2 -mb-px ${
              catalogTab === 'products'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Productos
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={catalogTab === 'combos'}
            id="catalog-tab-combos"
            aria-controls="catalog-panel-combos"
            onClick={() => setCatalogTab('combos')}
            className={`pb-2 text-xs font-medium tracking-wide transition-colors border-b-2 -mb-px ${
              catalogTab === 'combos'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Combos
          </button>
        </div>

        {catalogTab === 'products' ? (
          <section
            className="min-w-0"
            role="tabpanel"
            id="catalog-panel-products"
            aria-labelledby="catalog-tab-products"
          >
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {products.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center px-4">
                  <p className="text-sm font-medium text-gray-900">Sin productos en esta vista</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    {hasCatalogFilters
                      ? 'Probá otra búsqueda o quitá filtros. También podés revisar otra página del catálogo.'
                      : 'Creá ítems simples o revisá la pestaña Combos / otra página del catálogo.'}
                  </p>
                </div>
              ) : (
                products.map(product => (
                  <div key={product.id} className="group flex items-center justify-between px-4 py-3.5 gap-3">
                    <div className="min-w-0">
                      <p className={`text-sm font-medium truncate ${!product.is_active ? 'text-gray-300' : 'text-gray-900'}`}>
                        {product.name}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {formatPrice(product.price)}
                        {product.category_name ? ` · ${product.category_name}` : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
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
                        className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                      >
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({
                            kind: 'catalog',
                            id: product.id,
                            name: product.name,
                            variant: 'single',
                          })}
                        aria-label={`Eliminar ${product.name}`}
                        className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                      >
                        Eliminar
                      </button>
                      <ToggleSwitch
                        checked={product.is_active}
                        disabled={productTogglePending.has(product.id)}
                        onChange={() => toggleActive(product)}
                      />
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : (
          <section
            className="min-w-0"
            role="tabpanel"
            id="catalog-panel-combos"
            aria-labelledby="catalog-tab-combos"
          >
            <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
              {products.length === 0 ? (
                <div className="flex flex-col items-center py-12 text-center px-4">
                  <p className="text-sm font-medium text-gray-900">Sin combos en esta vista</p>
                  <p className="text-xs text-gray-400 mt-1 max-w-xs">
                    {hasCatalogFilters
                      ? 'Probá otra búsqueda o quitá filtros.'
                      : 'Un combo agrupa varios productos con un precio. Revisá la pestaña Productos u otra página.'}
                  </p>
                </div>
              ) : (
                products.map(combo => (
                  <div key={combo.id} className="flex flex-col px-4 py-3.5 gap-2">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className={`text-sm font-medium truncate ${!combo.is_active ? 'text-gray-300' : 'text-gray-900'}`}>
                          {combo.name}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">{formatPrice(combo.price)}</p>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setFormError('')
                            setEditingCatalogId(combo.id)
                            setComboName(combo.name)
                            setComboPrice(String(combo.price))
                            setComboDesc(combo.description ?? '')
                            setComboPickerItems(
                              combo.combo_lines.map(l => ({
                                product_id: l.product_id,
                                quantity: l.quantity,
                                displayName: l.name,
                              })),
                            )
                            setComboPickerQuery('')
                            setDrawerMode('combo')
                          }}
                          className="text-xs text-gray-500 hover:text-gray-900 transition-colors"
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setDeleteTarget({
                              kind: 'catalog',
                              id: combo.id,
                              name: combo.name,
                              variant: 'combo',
                            })}
                          className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                        >
                          Eliminar
                        </button>
                        <ToggleSwitch
                          checked={combo.is_active}
                          disabled={productTogglePending.has(combo.id)}
                          onChange={() => toggleActive(combo)}
                        />
                      </div>
                    </div>
                    {combo.combo_lines.length > 0 && (
                      <ul className="text-[11px] text-gray-400 pl-1 space-y-0.5">
                        {combo.combo_lines.map(line => (
                          <li key={`${combo.id}-${line.product_id}`}>
                            {line.quantity}× {line.name}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        )}
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
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${drawerMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      <div
        className={`fixed top-0 right-0 h-full z-50 bg-white rounded-l-3xl shadow-2xl transition-[transform,width] duration-300 ease-out ${drawerMode ? 'translate-x-0' : 'translate-x-full'} ${drawerMode === 'combo' ? 'w-[min(100vw,28rem)]' : 'w-[min(100vw,22rem)]'}`}
      >
        {drawerMode === 'product' && (
          <div className="p-6 overflow-y-auto max-h-full">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-base font-medium text-gray-900">
                {editingCatalogId ? 'Editar producto' : 'Nuevo producto'}
              </h2>
              <button type="button" onClick={closeDrawer} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-sm">
                ✕
              </button>
            </div>
            <div className="flex flex-col gap-3">
              <input type="text" value={name} onChange={e => { setName(e.target.value); setFormError('') }} placeholder="Nombre" className={inputClass} disabled={saving} />
              <input type="number" value={price} onChange={e => { setPrice(e.target.value); setFormError('') }} placeholder="Precio" className={inputClass} disabled={saving} />
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción (opcional)" className={inputClass} disabled={saving} />
              <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className={inputClass} disabled={saving}>
                <option value="">Sin categoría</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              {formError && <p className="text-red-500 text-xs">{formError}</p>}
              <button
                type="button"
                onClick={handleSaveProduct}
                disabled={saving}
                className="w-full rounded-full bg-gray-900 text-white text-sm font-medium py-2.5 hover:bg-gray-700 transition-colors mt-2 disabled:opacity-60"
              >
                {saving ? 'Guardando…' : editingCatalogId ? 'Guardar cambios' : 'Crear producto'}
              </button>
            </div>
          </div>
        )}

        {drawerMode === 'combo' && (
          <div className="p-6 overflow-y-auto max-h-full flex flex-col gap-6 pb-10">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">
                {editingCatalogId ? 'Editar combo' : 'Nuevo combo'}
              </h2>
              <button type="button" onClick={closeDrawer} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-sm">
                ✕
              </button>
            </div>

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

            {formError && <p className="text-red-500 text-xs">{formError}</p>}
            <button
              type="button"
              onClick={handleSaveCombo}
              disabled={
                saving
                || (!editingCatalogId && (comboDrawerSinglesLoading || comboDrawerSingles.length === 0))
              }
              className="w-full rounded-full bg-gray-900 text-white text-sm font-medium py-2.5 hover:bg-gray-700 transition-colors disabled:opacity-60"
            >
              {saving ? 'Guardando…' : editingCatalogId ? 'Guardar cambios' : 'Crear combo'}
            </button>
            {!editingCatalogId && !comboDrawerSinglesLoading && comboDrawerSingles.length === 0 && (
              <p className="text-xs text-amber-700">Creá al menos un producto simple antes de armar un combo.</p>
            )}
          </div>
        )}
      </div>

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
