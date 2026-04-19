'use client'

import { useState } from 'react'
import { mockEvent } from '@/lib/mock/event'
import { formatPrice } from '@/lib/utils'
import type { Product, Combo } from '@/types'

function ToggleSwitch({ checked, onChange }: { checked: boolean; onChange: () => void }) {
  return (
    <button
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={`w-11 h-6 rounded-full transition-colors shrink-0 relative overflow-hidden ${checked ? 'bg-gray-900' : 'bg-gray-200'}`}
    >
      <span
        className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-200"
        style={{ left: checked ? '23px' : '4px' }}
      />
    </button>
  )
}

const CATEGORIES = ['Bebidas', 'Comidas', 'Snacks', 'Postres', 'Otros']

const inputClass = "w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition"

export function ProductsView() {
  const [products, setProducts] = useState<Product[]>(mockEvent.products)
  const [combos, setCombos] = useState<Combo[]>(mockEvent.combos)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const [name, setName] = useState('')
  const [price, setPrice] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState(CATEGORIES[0])
  const [error, setError] = useState('')

  const toggleProduct = (id: string) => setProducts(prev => prev.map(p => p.id === id ? { ...p, available: !p.available } : p))
  const toggleCombo = (id: string) => setCombos(prev => prev.map(c => c.id === id ? { ...c, available: !c.available } : c))
  const deleteProduct = (id: string) => setProducts(prev => prev.filter(p => p.id !== id))
  const deleteCombo = (id: string) => setCombos(prev => prev.filter(c => c.id !== id))

  const handleAdd = () => {
    if (!name.trim() || !price.trim()) { setError('Nombre y precio son requeridos'); return }
    const newProduct: Product = {
      id: crypto.randomUUID(),
      name: name.trim(),
      description: description.trim(),
      price: Number(price),
      category,
      available: true,
    }
    setProducts(prev => [...prev, newProduct])
    setName(''); setPrice(''); setDescription(''); setCategory(CATEGORIES[0]); setError('')
    setDrawerOpen(false)
  }

  const closeDrawer = () => { setDrawerOpen(false); setError('') }

  return (
    <div className="max-w-2xl">

      {/* Header */}
      <div className="flex items-center justify-between mb-6 md:-mt-5">
        <h1 className="text-xl font-medium text-gray-900">Productos</h1>
        <button
          onClick={() => setDrawerOpen(true)}
          className="flex items-center gap-2 rounded-full bg-white text-gray-900 border border-gray-900 text-sm font-medium px-4 py-2 hover:bg-gray-50 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 14 14" fill="none"><path d="M7 2v10M2 7h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/></svg>
          Agregar producto
        </button>
      </div>

      <section className="mb-6">
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Productos</p>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {products.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M10 1L2 5v8l8 4 8-4V5l-8-4z" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round"/><path d="M2 5l8 4 8-4" stroke="#9ca3af" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Sin productos todavía</p>
              <p className="text-xs text-gray-400 mt-1">Agregá el primero desde el botón de arriba</p>
            </div>
          ) : products.map(product => (
            <div key={product.id} className="group flex items-center justify-between px-4 py-3.5 gap-3">
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${!product.available ? 'text-gray-300' : 'text-gray-900'}`}>{product.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatPrice(product.price)}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => deleteProduct(product.id)}
                  aria-label={`Eliminar ${product.name}`}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Eliminar
                </button>
                <ToggleSwitch checked={product.available} onChange={() => toggleProduct(product.id)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wider mb-3">Combos</p>
        <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
          {combos.length === 0 ? (
            <div className="flex flex-col items-center py-12 text-center">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center mb-3">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1.5" stroke="#9ca3af" strokeWidth="1.5"/><rect x="11" y="2" width="7" height="7" rx="1.5" stroke="#9ca3af" strokeWidth="1.5"/><rect x="2" y="11" width="7" height="7" rx="1.5" stroke="#9ca3af" strokeWidth="1.5"/><rect x="11" y="11" width="7" height="7" rx="1.5" stroke="#9ca3af" strokeWidth="1.5"/></svg>
              </div>
              <p className="text-sm font-medium text-gray-900">Sin combos aún</p>
              <p className="text-xs text-gray-400 mt-1">Combiná productos para ofrecer packs</p>
            </div>
          ) : combos.map(combo => (
            <div key={combo.id} className="flex items-center justify-between px-4 py-3.5 gap-3">
              <div className="min-w-0">
                <p className={`text-sm font-medium truncate ${!combo.available ? 'text-gray-300' : 'text-gray-900'}`}>{combo.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">{formatPrice(combo.price)}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => deleteCombo(combo.id)}
                  aria-label={`Eliminar ${combo.name}`}
                  className="text-xs text-gray-400 hover:text-red-500 transition-colors"
                >
                  Eliminar
                </button>
                <ToggleSwitch checked={combo.available} onChange={() => toggleCombo(combo.id)} />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Overlay backdrop */}
      <div
        onClick={closeDrawer}
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 ${drawerOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
      />

      {/* Drawer */}
      <div
        className={`fixed top-0 right-0 h-full z-50 w-80 bg-white rounded-l-3xl shadow-2xl transition-transform duration-300 ease-out ${drawerOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-base font-medium text-gray-900">Nuevo producto</h2>
            <button onClick={closeDrawer} className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors text-sm">
              ✕
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <input type="text" value={name} onChange={e => { setName(e.target.value); setError('') }} placeholder="Nombre del producto" className={inputClass} />
            <input type="number" value={price} onChange={e => { setPrice(e.target.value); setError('') }} placeholder="Precio" className={inputClass} />
            <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción (opcional)" className={inputClass} />
            <select value={category} onChange={e => setCategory(e.target.value)} className={inputClass}>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {error && <p className="text-red-500 text-xs">{error}</p>}
            <button
              onClick={handleAdd}
              className="w-full rounded-full bg-gray-900 text-white text-sm font-medium py-2.5 hover:bg-gray-700 transition-colors mt-2"
            >
              Agregar producto
            </button>
          </div>
        </div>
      </div>

    </div>
  )
}
