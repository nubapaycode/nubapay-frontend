'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'

import { Modal } from '@/components/ui/Modal'
import { PaginationBar } from '@/components/ui/PaginationBar'
import { Spinner } from '@/components/ui/Spinner'
import {
  createPickupPoint,
  deletePickupPoint,
  fetchAllCategories,
  fetchAllWorkspaceProducts,
  fetchPickupPoints,
  patchPickupPoint,
  putPickupPointProducts,
  type PaginationMeta,
  type WorkspaceCategory,
  type WorkspacePickupPoint,
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

type CatalogGroupRow = {
  key: string
  label: string
  fullProducts: WorkspaceProduct[]
  displayProducts: WorkspaceProduct[]
}

const PICKUP_PAGE_SIZE = 12

export function PickupPointsView({ eventId }: { eventId: string }) {
  const [points, setPoints] = useState<WorkspacePickupPoint[]>([])
  const [pointsPage, setPointsPage] = useState(1)
  const [pointsPagination, setPointsPagination] = useState<PaginationMeta>({
    page: 1,
    page_size: PICKUP_PAGE_SIZE,
    total: 0,
  })
  const [catalog, setCatalog] = useState<WorkspaceProduct[]>([])
  const [categories, setCategories] = useState<WorkspaceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(() => new Set())
  const [productSearch, setProductSearch] = useState('')
  const [detailExpandedKeys, setDetailExpandedKeys] = useState<Set<string>>(() => new Set())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<WorkspacePickupPoint | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const [togglePending, setTogglePending] = useState<Set<string>>(() => new Set())

  const loadAll = useCallback(async () => {
    setError('')
    const [pp, pr, cat] = await Promise.all([
      fetchPickupPoints(eventId, { page: pointsPage, pageSize: PICKUP_PAGE_SIZE }),
      fetchAllWorkspaceProducts(eventId),
      fetchAllCategories(eventId),
    ])
    if (!pp.ok) setError(pp.error)
    else {
      setPoints(pp.pickup_points)
      setPointsPagination(pp.pagination)
    }
    if (!pr.ok) setError(e => e || pr.error)
    else setCatalog(pr.products)
    if (!cat.ok) setError(e => e || cat.error)
    else setCategories(cat.categories)
    setLoading(false)
  }, [eventId, pointsPage])

  useEffect(() => {
    setLoading(true)
    loadAll()
  }, [loadAll])

  const closeDrawer = () => {
    setDrawerMode(null)
    setEditingId(null)
    setFormName('')
    setFormDesc('')
    setSelectedProductIds(new Set())
    setProductSearch('')
    setDetailExpandedKeys(new Set())
    setFormError('')
  }

  const openCreate = () => {
    setFormError('')
    setFormName('')
    setFormDesc('')
    setSelectedProductIds(new Set())
    setProductSearch('')
    setDetailExpandedKeys(new Set())
    setEditingId(null)
    setDrawerMode('create')
  }

  const openEdit = (p: WorkspacePickupPoint) => {
    setFormError('')
    setFormName(p.name)
    setFormDesc(p.description || '')
    setSelectedProductIds(new Set(p.products.filter(x => x.is_active).map(x => x.product_id)))
    setProductSearch('')
    setDetailExpandedKeys(new Set())
    setEditingId(p.id)
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

  const handleSave = async () => {
    const name = formName.trim()
    if (name.length < 2) {
      setFormError('El nombre debe tener al menos 2 caracteres')
      return
    }
    setSaving(true)
    setFormError('')
    const ids = [...selectedProductIds]
    const description = formDesc.trim() || undefined

    if (drawerMode === 'create') {
      const res = await createPickupPoint(eventId, {
        name,
        description,
        product_ids: ids,
      })
      setSaving(false)
      if (!res.ok) {
        setFormError(res.error)
        return
      }
      setPoints(prev => [...prev, res.pickup_point].sort((a, b) => a.name.localeCompare(b.name)))
      closeDrawer()
      return
    }

    if (drawerMode === 'edit' && editingId) {
      const resPatch = await patchPickupPoint(eventId, editingId, {
        name,
        description: description ?? null,
      })
      if (!resPatch.ok) {
        setSaving(false)
        setFormError(resPatch.error)
        return
      }
      const resPut = await putPickupPointProducts(eventId, editingId, ids)
      setSaving(false)
      if (!resPut.ok) {
        setFormError(resPut.error)
        return
      }
      setPoints(prev => prev.map(x => (x.id === editingId ? resPut.pickup_point : x)))
      closeDrawer()
    }
  }

  const togglePointActive = async (p: WorkspacePickupPoint) => {
    if (togglePending.has(p.id)) return
    setTogglePending(s => new Set(s).add(p.id))
    const next = !p.is_active
    setPoints(list => list.map(x => (x.id === p.id ? { ...x, is_active: next } : x)))
    const res = await patchPickupPoint(eventId, p.id, { is_active: next })
    if (!res.ok) {
      setPoints(list => list.map(x => (x.id === p.id ? { ...x, is_active: p.is_active } : x)))
      setError(res.error)
    } else {
      setPoints(list => list.map(x => (x.id === p.id ? res.pickup_point : x)))
    }
    setTogglePending(s => {
      const n = new Set(s)
      n.delete(p.id)
      return n
    })
  }

  const confirmDelete = async () => {
    if (!deleteTarget || deleteSubmitting) return
    setDeleteSubmitting(true)
    const res = await deletePickupPoint(eventId, deleteTarget.id)
    setDeleteSubmitting(false)
    if (!res.ok) {
      setError(res.error)
      setDeleteTarget(null)
      return
    }
    setPoints(prev => prev.filter(x => x.id !== deleteTarget.id))
    setDeleteTarget(null)
  }

  if (loading) {
    return (
      <div className="w-full min-w-0 flex flex-col items-center justify-center py-24 gap-3">
        <Spinner size="lg" className="text-gray-900" />
        <p className="text-sm text-gray-400">Cargando puntos de retiro…</p>
      </div>
    )
  }

  return (
    <div className="w-full min-w-0 max-w-none">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6 md:-mt-5">
        <div>
          <h1 className="text-xl font-medium text-gray-900">Puntos de retiro</h1>
          <p className="text-xs text-gray-400 mt-1">Definí dónde se entrega cada producto del catálogo.</p>
        </div>
        <button
          type="button"
          onClick={openCreate}
          className="shrink-0 rounded-full bg-gray-900 text-white border border-gray-900 text-sm font-medium px-4 py-2 hover:bg-gray-700 transition-colors"
        >
          + Nuevo punto
        </button>
      </div>

      {error && <p className="text-red-500 text-xs mb-4">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {points.length === 0 ? (
          <div className="col-span-full bg-white rounded-2xl border border-gray-100 py-14 px-6 text-center">
            <p className="text-sm font-medium text-gray-900">Sin puntos de retiro</p>
            <p className="text-xs text-gray-400 mt-1">Creá el primero para asignar productos por ubicación.</p>
          </div>
        ) : (
          points.map(p => (
            <div
              key={p.id}
              className={`bg-white rounded-2xl border p-4 flex flex-col gap-3 ${p.is_active ? 'border-gray-100' : 'border-gray-100 opacity-70'}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className={`text-sm font-semibold truncate ${p.is_active ? 'text-gray-900' : 'text-gray-400'}`}>{p.name}</p>
                  {p.description ? (
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">{p.description}</p>
                  ) : (
                    <p className="text-xs text-gray-300 mt-1">Sin descripción</p>
                  )}
                </div>
                <ToggleSwitch checked={p.is_active} disabled={togglePending.has(p.id)} onChange={() => togglePointActive(p)} />
              </div>
              <div>
                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-wider mb-1.5">Productos en este punto</p>
                {p.products.length === 0 ? (
                  <p className="text-xs text-gray-400">Ninguno asignado</p>
                ) : (
                  <ul className="flex flex-wrap gap-1">
                    {p.products.filter(x => x.is_active).map(x => (
                      <li
                        key={x.product_id}
                        className="text-[11px] rounded-full bg-gray-100 px-2 py-0.5 text-gray-700 max-w-full truncate"
                        title={x.name}
                      >
                        {x.name}
                        {x.type === 'combo' ? <span className="text-gray-400"> · combo</span> : null}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="flex gap-2 mt-auto pt-1">
                <button
                  type="button"
                  onClick={() => openEdit(p)}
                  className="text-xs font-medium text-gray-600 hover:text-gray-900"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setDeleteTarget(p)}
                  className="text-xs font-medium text-gray-400 hover:text-red-600 ml-auto"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {pointsPagination.total > 0 && (
        <div className="mt-8 max-w-3xl">
          <PaginationBar
            page={pointsPagination.page}
            pageSize={pointsPagination.page_size}
            total={pointsPagination.total}
            onPageChange={setPointsPage}
          />
        </div>
      )}

      <div
        role="presentation"
        onClick={closeDrawer}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${drawerMode ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      <div
        className={`fixed top-0 right-0 h-full z-50 w-[min(100vw,26rem)] bg-white rounded-l-3xl shadow-2xl transition-transform duration-300 ease-out ${drawerMode ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {drawerMode && (
          <div className="p-6 overflow-y-auto max-h-full flex flex-col gap-4 pb-28">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-medium text-gray-900">{drawerMode === 'create' ? 'Nuevo punto de retiro' : 'Editar punto'}</h2>
              <button type="button" onClick={closeDrawer} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 text-sm">
                ✕
              </button>
            </div>
            <input
              type="text"
              value={formName}
              onChange={e => { setFormName(e.target.value); setFormError('') }}
              placeholder="Nombre (ej. Barra Principal)"
              className={inputClass}
              disabled={saving}
            />
            <textarea
              value={formDesc}
              onChange={e => setFormDesc(e.target.value)}
              placeholder="Descripción opcional"
              rows={3}
              className={`${inputClass} resize-none`}
              disabled={saving}
            />
            <div>
              <p className="text-[11px] font-medium text-gray-400 uppercase tracking-wider mb-1">Productos que se entregan acá</p>
              <p className="text-[11px] text-gray-400 mb-2 leading-snug">
                Por categoría: marcá todos o refiná por producto cuando lo necesites.
              </p>
              <input
                type="text"
                value={productSearch}
                onChange={e => setProductSearch(e.target.value)}
                placeholder="Buscar categoría o producto…"
                className={inputClass}
                disabled={saving}
              />
              <div className="mt-2 max-h-[45vh] overflow-y-auto rounded-xl border border-gray-100 divide-y divide-gray-50">
                {catalog.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-gray-400 text-center">No hay productos en el catálogo.</p>
                ) : catalogGroups.length === 0 ? (
                  <p className="px-3 py-4 text-xs text-gray-400 text-center">Sin coincidencias.</p>
                ) : (
                  catalogGroups.map(group => {
                    const total = group.fullProducts.length
                    const selectedCount = group.fullProducts.reduce((n, p) => n + (selectedProductIds.has(p.id) ? 1 : 0), 0)
                    const expanded = detailExpandedKeys.has(group.key)
                    return (
                      <div key={group.key} className="bg-white">
                        <div className="flex flex-col gap-2 px-3 py-3">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-gray-900 truncate">{group.label}</p>
                              <p className="text-[11px] text-gray-400 mt-0.5">
                                {selectedCount === total && total > 0 ? (
                                  <span className="text-gray-700">Todos ({total})</span>
                                ) : selectedCount > 0 ? (
                                  <span>
                                    {selectedCount} de {total} seleccionados
                                  </span>
                                ) : (
                                  <span>Ninguno · {total} producto{total !== 1 ? 's' : ''}</span>
                                )}
                              </p>
                            </div>
                            <div className="flex shrink-0 gap-1">
                              <button
                                type="button"
                                disabled={saving || total === 0}
                                onClick={() => toggleCategoryProducts(group.fullProducts, true)}
                                className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-40"
                              >
                                Todos
                              </button>
                              <button
                                type="button"
                                disabled={saving || selectedCount === 0}
                                onClick={() => toggleCategoryProducts(group.fullProducts, false)}
                                className="rounded-lg border border-gray-200 px-2 py-1 text-[11px] font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40"
                              >
                                Ninguno
                              </button>
                            </div>
                          </div>
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => toggleDetailExpanded(group.key)}
                            className="text-left text-[11px] font-medium text-gray-600 hover:text-gray-900 py-0.5"
                          >
                            {expanded ? '↑ Ocultar lista por producto' : '↓ Elegir productos individuales'}
                          </button>
                        </div>
                        {expanded ? (
                          group.displayProducts.length === 0 ? (
                            <p className="px-3 pb-3 pt-0 text-[11px] text-gray-400 border-t border-gray-50 bg-gray-50/60">
                              No hay coincidencias en esta categoría con la búsqueda actual. Probá limpiar el filtro o usá «Todos» arriba.
                            </p>
                          ) : (
                            <ul className="border-t border-gray-50 bg-gray-50/40 divide-y divide-gray-100/80">
                              {group.displayProducts.map(prod => {
                                const checked = selectedProductIds.has(prod.id)
                                return (
                                  <li key={prod.id}>
                                    <label className="flex items-center gap-3 px-3 py-2 cursor-pointer hover:bg-white/80">
                                      <input
                                        type="checkbox"
                                        checked={checked}
                                        disabled={saving}
                                        onChange={() => toggleProductSelected(prod.id)}
                                        className="rounded border-gray-300 text-gray-900 focus:ring-gray-900"
                                      />
                                      <span className="flex-1 min-w-0">
                                        <span className="block text-sm text-gray-900 truncate">{prod.name}</span>
                                        <span className="block text-[11px] text-gray-400 truncate">
                                          {prod.type === 'combo' ? 'Combo' : 'Producto'}
                                          {!prod.is_active ? ' · inactivo en catálogo' : ''}
                                        </span>
                                      </span>
                                    </label>
                                  </li>
                                )
                              })}
                            </ul>
                          )
                        ) : null}
                      </div>
                    )
                  })
                )}
              </div>
            </div>
            {formError && <p className="text-red-500 text-xs">{formError}</p>}
            <button
              type="button"
              disabled={saving}
              onClick={handleSave}
              className="w-full rounded-full bg-gray-900 text-white text-sm font-medium py-2.5 hover:bg-gray-700 disabled:opacity-60"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </div>
        )}
      </div>

      <Modal
        isOpen={deleteTarget !== null}
        onClose={() => {
          if (!deleteSubmitting) setDeleteTarget(null)
        }}
        title="Eliminar punto de retiro"
        containerClassName="z-[70]"
      >
        {deleteTarget && (
          <>
            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
              ¿Eliminar «<span className="font-medium text-gray-900">{deleteTarget.name}</span>»? Los pedidos que lo tengan
              asociado conservarán historial; este punto dejará de estar disponible para nuevos pedidos.
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
