// types/index.ts

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered' | 'cancelled'

export interface Product {
  id: string
  name: string
  description: string
  price: number
  imageUrl?: string
  category: string
  available: boolean
}

export interface Combo {
  id: string
  name: string
  description: string
  price: number
  products: Product[]
  imageUrl?: string
  available: boolean
}

export interface CartItem {
  productId: string
  name: string
  price: number
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
