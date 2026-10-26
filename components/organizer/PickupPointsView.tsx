'use client'

import { ChevronDown, Info, MapPin, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Modal } from '@/components/ui/Modal'
import { ORGANIZER_ACCENT_BACKGROUND, organizerAccentFilledButtonStyle } from '@/lib/organizerAccentCss'
import {
  createPickupPoint,
  deletePickupPoint,
  fetchAllCategories,
  fetchAllWorkspaceProducts,
  fetchPickupPoints,
  patchPickupPoint,
  putPickupPointProducts,
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

const inputClass =
  'w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition'

type CatalogGroupRow = {
  key: string
  label: string
  fullProducts: WorkspaceProduct[]
  displayProducts: WorkspaceProduct[]
}

const PICKUP_PAGE_SIZE = 12

function useDismiss(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close()
    }
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close()
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, close])
  return ref
}

function PointCardMenu({ name, onEdit, onDelete }: { name: string; onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false)
  const ref = useDismiss(open, () => setOpen(false))
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Opciones de ${name}`}
        onClick={() => setOpen(o => !o)}
        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-900"
      >
        <MoreHorizontal size={16} strokeWidth={2} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="nb-pop absolute bottom-[calc(100%+4px)] right-0 z-20 w-44 rounded-xl border border-gray-200 bg-white p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)]">
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onEdit()
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50 hover:text-gray-900"
          >
            <Pencil size={14} strokeWidth={1.75} />
            Editar
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onDelete()
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-red-600 hover:bg-red-50"
          >
            <Trash2 size={14} strokeWidth={1.75} />
            Eliminar
          </button>
        </div>
      )}
    </div>
  )
}

/** "Asignar a…": manda los productos sin cobertura a un punto existente o a uno nuevo. */
function AssignMenu({
  points,
  onPick,
  onNew,
}: {
  points: WorkspacePickupPoint[]
  onPick: (p: WorkspacePickupPoint) => void
  onNew: () => void
}) {
  const [open, setOpen] = useState(false)
  const ref = useDismiss(open, () => setOpen(false))
  return (
    <div ref={ref} className="relative shrink-0">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen(o => !o)}
        className="inline-flex h-9 items-center gap-1.5 rounded-xl bg-gray-900 px-3 text-[13px] font-semibold text-white transition-colors hover:bg-gray-800"
      >
        Asignar a…
        <ChevronDown size={14} strokeWidth={2.25} className={open ? 'rotate-180 transition-transform' : 'transition-transform'} aria-hidden />
      </button>
      {open && (
        <div role="menu" className="nb-pop absolute right-0 top-[calc(100%+6px)] z-20 w-60 rounded-xl border border-gray-200 bg-white p-1.5 shadow-[0_12px_32px_-8px_rgba(16,24,40,0.18)]">
          {points.map(p => (
            <button
              key={p.id}
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                onPick(p)
              }}
              className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] text-gray-700 hover:bg-gray-50 hover:text-gray-900"
            >
              <MapPin size={14} strokeWidth={1.75} className="shrink-0 text-gray-400" />
              <span className="truncate">{p.name}</span>
            </button>
          ))}
          {points.length > 0 && <div className="my-1 h-px bg-gray-100" />}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setOpen(false)
              onNew()
            }}
            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-[13px] font-medium text-gray-900 hover:bg-gray-50"
          >
            <Plus size={14} strokeWidth={2} className="shrink-0" />
            Nuevo punto con estos productos
          </button>
        </div>
      )}
    </div>
  )
}


export function PickupPointsView({ eventId }: { eventId: string }) {
  const [points, setPoints] = useState<WorkspacePickupPoint[]>([])
  const [catalog, setCatalog] = useState<WorkspaceProduct[]>([])
  const [categories, setCategories] = useState<WorkspaceCategory[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [drawerMode, setDrawerMode] = useState<'create' | 'edit' | null>(null)
  const [drawerVisible, setDrawerVisible] = useState<'create' | 'edit' | null>(null)
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formName, setFormName] = useState('')
  const [formDesc, setFormDesc] = useState('')
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(() => new Set())
  const [productSearch, setProductSearch] = useState('')
  const [onlyUnassigned, setOnlyUnassigned] = useState(false)
  const [detailExpandedKeys, setDetailExpandedKeys] = useState<Set<string>>(() => new Set())
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState<WorkspacePickupPoint | null>(null)
  const [deleteSubmitting, setDeleteSubmitting] = useState(false)

  const [togglePending, setTogglePending] = useState<Set<string>>(() => new Set())

  const loadAll = useCallback(async () => {
    setError('')
    const [pp, pr, cat] = await Promise.all([
      fetchPickupPoints(eventId, { page: 1, pageSize: 100 }),
      fetchAllWorkspaceProducts(eventId),
      fetchAllCategories(eventId),
    ])
    if (!pp.ok) setError(pp.error)
    else setPoints(pp.pickup_points)
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

  const closeDrawer = () => {
    setDrawerMode(null)
    setEditingId(null)
    setFormName('')
    setFormDesc('')
    setSelectedProductIds(new Set())
    setProductSearch('')
    setOnlyUnassigned(false)
    setDetailExpandedKeys(new Set())
    setFormError('')
  }

  const openCreate = (preselected: string[] = []) => {
    setFormError('')
    setFormName('')
    setFormDesc('')
    setSelectedProductIds(new Set(preselected))
    setOnlyUnassigned(false)
    setProductSearch('')
    setDetailExpandedKeys(new Set())
    setEditingId(null)
    setDrawerMode('create')
  }

  const openEdit = (p: WorkspacePickupPoint, extra: string[] = []) => {
    setFormError('')
    setFormName(p.name)
    setFormDesc(p.description || '')
    setSelectedProductIds(new Set([...p.products.filter(x => x.is_active).map(x => x.product_id), ...extra]))
    setOnlyUnassigned(false)
    setProductSearch('')
    setDetailExpandedKeys(new Set())
    setEditingId(p.id)
    setDrawerMode('edit')
  }

  /** Productos asignados a algún punto activo, sin contar el que se está editando. */
  const assignedElsewhere = useMemo(() => {
    const set = new Set<string>()
    for (const p of points) {
      if (!p.is_active || p.id === editingId) continue
      for (const x of p.products) if (x.is_active) set.add(x.product_id)
    }
    return set
  }, [points, editingId])

  /** Productos en venta que no están asignados a ningún punto activo. */
  const uncovered = useMemo(() => {
    const covered = new Set<string>()
    for (const p of points) {
      if (!p.is_active) continue
      for (const x of p.products) if (x.is_active) covered.add(x.product_id)
    }
    return catalog.filter(p => p.is_active && !covered.has(p.id))
  }, [points, catalog])

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
      if (onlyUnassigned && assignedElsewhere.has(p.id)) return false
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
      const filtering = Boolean(q) || onlyUnassigned
      const displayProducts = filtering ? fullProducts.filter(matchesSearch) : fullProducts
      if (filtering && displayProducts.length === 0) continue

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
  }, [catalog, categories, productSearch, onlyUnassigned, assignedElsewhere])

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
      <div className="mx-auto w-full max-w-[1180px]" aria-busy="true">
        <p className="sr-only">Cargando puntos de retiro…</p>
        <div className="mb-6 h-14 w-72 animate-pulse rounded-xl bg-gray-100" />
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {[0, 1, 2].map(i => (
            <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-100" />
          ))}
        </div>
      </div>
    )
  }

  const activePoints = points.filter(p => p.is_active)

  return (
    <div className="mx-auto w-full min-w-0 max-w-[1180px]">
      <style>{`
        @keyframes nb-rise { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        @keyframes nb-pop { from { opacity: 0; transform: translateY(-4px) scale(0.98); } to { opacity: 1; transform: none; } }
        .nb-rise { animation: nb-rise 420ms cubic-bezier(0.22,1,0.36,1) both; }
        .nb-pop { animation: nb-pop 160ms ease-out both; transform-origin: top right; }
        .nb-input:focus { border-color: #0A0A0F !important; box-shadow: 0 0 0 3px rgba(0,0,0,0.06); }
        @media (prefers-reduced-motion: reduce) { .nb-rise, .nb-pop { animation: none; } }
      `}</style>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-[620px]">
          <h1 className="text-[26px] font-semibold tracking-tight text-gray-900">Puntos de retiro</h1>
          <p className="mt-1 text-[13px] text-gray-500">
            Dónde se entrega cada producto: barras, cantinas, mostradores. Así tu equipo sabe qué despacha cada uno.
          </p>
        </div>
        <button
          type="button"
          onClick={() => openCreate()}
          style={organizerAccentFilledButtonStyle()}
          className="inline-flex h-10 items-center gap-1.5 rounded-xl px-4 text-[14px] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.08)] transition-[filter] hover:brightness-95"
        >
          <Plus size={16} strokeWidth={2.25} aria-hidden />
          Nuevo punto
        </button>
      </header>

      {error && (
        <div className="mb-4 rounded-xl border border-red-100 bg-red-50/70 px-4 py-2.5 text-[13px] text-red-700">{error}</div>
      )}

      {/* Cobertura: productos en venta que no están en ningún punto activo (organización del equipo) */}
      {points.length > 0 && uncovered.length > 0 && (
        <section role="status" className="nb-rise mb-5 rounded-2xl border border-gray-200 bg-gray-50/70 p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
            <Info size={18} strokeWidth={1.75} className="mt-0.5 shrink-0 text-gray-400" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-semibold text-gray-900">
                {uncovered.length === 1
                  ? '1 producto en venta no está en ningún punto'
                  : `${uncovered.length} productos en venta no están en ningún punto`}
              </p>
              <p className="mt-0.5 text-[13px] text-gray-500">
                Asignalos para que tu equipo sepa dónde se entrega cada uno.
              </p>
              <ul className="mt-2.5 flex flex-wrap gap-1.5">
                {uncovered.slice(0, 8).map(p => (
                  <li key={p.id} className="max-w-[220px] truncate rounded-full bg-white px-2.5 py-1 text-[12px] text-gray-700 ring-1 ring-gray-200">
                    {p.name}
                  </li>
                ))}
                {uncovered.length > 8 && (
                  <li className="px-1.5 py-1 text-[12px] text-gray-500">y {uncovered.length - 8} más</li>
                )}
              </ul>
            </div>
            <AssignMenu
              points={activePoints}
              onPick={p => openEdit(p, uncovered.map(x => x.id))}
              onNew={() => openCreate(uncovered.map(x => x.id))}
            />
          </div>
        </section>
      )}

      {points.length === 0 ? (
        <div className="nb-rise rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-2xl bg-gray-50 text-gray-400">
            <MapPin size={22} strokeWidth={1.5} aria-hidden />
          </div>
          <p className="text-[16px] font-semibold text-gray-900">Sin puntos de retiro</p>
          <p className="mx-auto mt-1 max-w-sm text-[13px] text-gray-500">
            Creá el primero (por ejemplo “Barra principal”) y elegí qué productos se entregan ahí.
          </p>
          <button
            type="button"
            onClick={() => openCreate()}
            style={organizerAccentFilledButtonStyle()}
            className="mt-5 rounded-xl px-4 py-2 text-[14px] font-semibold transition-[filter] hover:brightness-95"
          >
            Crear punto
          </button>
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {points.map((p, i) => {
            const activeProducts = p.products.filter(x => x.is_active)
            const combos = activeProducts.filter(x => x.type === 'combo').length
            return (
              <li
                key={p.id}
                className="nb-rise group flex flex-col rounded-2xl border border-gray-200/80 bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)] transition-shadow hover:shadow-[0_6px_20px_-8px_rgba(16,24,40,0.18)]"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex items-start gap-3 p-4">
                  <span
                    className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${p.is_active ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-400'}`}
                    aria-hidden
                  >
                    <MapPin size={18} strokeWidth={1.75} />
                  </span>
                  <div className={`min-w-0 flex-1 ${p.is_active ? '' : 'opacity-60'}`}>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => openEdit(p)}
                        className="truncate text-left text-[15px] font-semibold tracking-tight text-gray-900 hover:underline"
                      >
                        {p.name}
                      </button>
                      {!p.is_active && (
                        <span className="shrink-0 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-semibold text-gray-500">Pausado</span>
                      )}
                    </div>
                    <p className={`mt-0.5 line-clamp-2 text-[12px] ${p.description ? 'text-gray-500' : 'text-gray-300'}`}>
                      {p.description || 'Sin descripción'}
                    </p>
                  </div>
                  <ToggleSwitch checked={p.is_active} disabled={togglePending.has(p.id)} onChange={() => togglePointActive(p)} />
                </div>

                <div className="flex-1 border-t border-gray-100 px-4 py-3">
                  <p className="mb-2 text-[12px] text-gray-500">
                    {activeProducts.length === 0 ? (
                      'Sin productos asignados'
                    ) : (
                      <>
                        <span className="font-semibold tabular-nums text-gray-900">{activeProducts.length}</span>{' '}
                        {activeProducts.length === 1 ? 'producto' : 'productos'}
                        {combos > 0 && <span className="text-gray-400"> · {combos} {combos === 1 ? 'combo' : 'combos'}</span>}
                      </>
                    )}
                  </p>
                  {activeProducts.length === 0 ? (
                    <button
                      type="button"
                      onClick={() => openEdit(p)}
                      className="text-[12px] font-medium text-gray-900 underline-offset-4 hover:underline"
                    >
                      Asignar productos
                    </button>
                  ) : (
                    <ul className="flex flex-wrap gap-1">
                      {activeProducts.slice(0, 6).map(x => (
                        <li key={x.product_id} title={x.name} className="max-w-full truncate rounded-full bg-gray-100 px-2.5 py-1 text-[11px] text-gray-700">
                          {x.name}
                          {x.type === 'combo' && <span className="ml-1 text-gray-400">· combo</span>}
                        </li>
                      ))}
                      {activeProducts.length > 6 && (
                        <li className="px-1.5 py-1 text-[11px] text-gray-400">+{activeProducts.length - 6}</li>
                      )}
                    </ul>
                  )}
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-gray-100 px-2 py-1.5">
                  <button
                    type="button"
                    onClick={() => openEdit(p)}
                    className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-[13px] font-medium text-gray-700 transition-colors hover:bg-gray-100 hover:text-gray-900"
                  >
                    <Pencil size={13} strokeWidth={1.75} aria-hidden />
                    Editar
                  </button>
                  <PointCardMenu name={p.name} onEdit={() => openEdit(p)} onDelete={() => setDeleteTarget(p)} />
                </div>
              </li>
            )
          })}
        </ul>
      )}

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
                  {drawerVisible === 'create' ? 'Nuevo punto de retiro' : 'Editar punto'}
                </h2>
                <p style={{ fontSize: '12px', color: '#9A9AA8', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                  Definí qué productos se entregan en este punto.
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
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#9A9AA8', marginBottom: '6px' }}>Nombre</label>
                <input
                  type="text"
                  value={formName}
                  onChange={e => { setFormName(e.target.value); setFormError('') }}
                  placeholder="Ej: Barra Principal"
                  className="nb-input"
                  style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', padding: '11px 14px', fontSize: '13px', color: '#0A0A0F', background: '#FAFAFA', outline: 'none', boxSizing: 'border-box' }}
                  disabled={saving}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#9A9AA8', marginBottom: '6px' }}>
                  Descripción <span style={{ fontWeight: 500, color: '#C8C8D0' }}>· opcional</span>
                </label>
                <textarea
                  value={formDesc}
                  onChange={e => setFormDesc(e.target.value)}
                  placeholder="Detalle visible para el cliente"
                  rows={2}
                  className="nb-input"
                  style={{ width: '100%', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', padding: '11px 14px', fontSize: '13px', color: '#0A0A0F', background: '#FAFAFA', outline: 'none', resize: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  disabled={saving}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#9A9AA8', marginBottom: '8px' }}>Productos que se entregan acá</label>
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
                <div className="mb-2.5 flex items-center justify-between gap-2">
                  <label className="flex cursor-pointer items-center gap-2 text-[12px] text-gray-600">
                    <input
                      type="checkbox"
                      checked={onlyUnassigned}
                      onChange={e => setOnlyUnassigned(e.target.checked)}
                      className="size-3.5 accent-gray-900"
                      disabled={saving}
                    />
                    Solo los que no están en otro punto
                  </label>
                  <span className="text-[12px] tabular-nums text-gray-400">{selectedProductIds.size} elegidos</span>
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
                                            {assignedElsewhere.has(prod.id) && ' · ya está en otro punto'}
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
                disabled={saving}
                onClick={handleSave}
                style={{ width: '100%', borderRadius: '100px', ...organizerAccentFilledButtonStyle(), border: 'none', padding: '13px', fontSize: '14px', fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', opacity: saving ? 0.6 : 1, letterSpacing: '-0.01em' }}
              >
                {saving
                  ? 'Guardando…'
                  : `${drawerVisible === 'create' ? 'Crear punto' : 'Guardar cambios'}${selectedProductIds.size ? ` · ${selectedProductIds.size} ${selectedProductIds.size === 1 ? 'producto' : 'productos'}` : ''}`}
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
