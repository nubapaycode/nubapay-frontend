// types/index.ts

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'partially_delivered'
  | 'delivered'
  | 'cancelled'

export interface Product {
  id: string
  name: string
  description: string
  /** Precio efectivo en catálogo (promo si aplica). */
  price: number
  /** Precio de lista cuando hay promo con precio menor. */
  listPrice?: number
  /** Texto corto visible en tarjeta (ej. "-20%", "2×1"). */
  promoLabel?: string
  imageUrl?: string
  category: string
  available: boolean
}

export interface Combo {
  id: string
  name: string
  description: string
  price: number
  listPrice?: number
  promoLabel?: string
  products: Product[]
  imageUrl?: string
  available: boolean
}

export interface CartItem {
  id?: string
  productId: string
  name: string
  price: number
  listPrice?: number
  quantity: number
  subtotal?: number
  categoryName?: string | null
  imageUrl?: string
  redeemedAt?: string | null
}

export interface Order {
  id: string
  orderNumber?: number | null
  eventId: string
  customerName?: string | null
  customerPhone?: string | null
  items: CartItem[]
  total: number
  status: OrderStatus
  paymentStatus?: string
  qrToken: string
  createdAt: string
  updatedAt: string
  pickupPoint?: string
  paymentMethod?: 'mp' | 'cash' | 'transfer'
}

/** Sección curada del catálogo: banner propio + productos/combos elegidos a mano por el organizador. */
export interface CatalogBlock {
  id: string
  title: string
  bannerImageUrl?: string | null
  products: Product[]
  combos: Combo[]
}

export interface Event {
  id: string
  name: string
  description: string
  date: string
  venue: string
  /** Portada pública (p. ej. Supabase Storage); si no hay, el hero usa imagen por defecto. */
  coverImageUrl?: string
  products: Product[]
  combos: Combo[]
  blocks: CatalogBlock[]
  /** Categorías activas con productos, en el orden configurado por el organizador. */
  categories: string[]
  /** Si está activo, /catalogo muestra primero botones de categoría antes de la lista de productos. */
  showCategoryShortcuts: boolean
}

export interface QRToken {
  orderId: string
  token: string
  expiresAt: string
}
