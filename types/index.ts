// types/index.ts

export type OrderStatus = 'pending' | 'paid' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

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
  productId: string
  name: string
  price: number
  listPrice?: number
  quantity: number
  subtotal?: number
  categoryName?: string | null
  imageUrl?: string
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
}

export interface QRToken {
  orderId: string
  token: string
  expiresAt: string
}
