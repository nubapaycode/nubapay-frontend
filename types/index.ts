// types/index.ts

export type OrderStatus = 'pending' | 'preparing' | 'ready' | 'delivered'

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
  imageUrl?: string
}

export interface Order {
  id: string
  eventId: string
  items: CartItem[]
  total: number
  status: OrderStatus
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
  products: Product[]
  combos: Combo[]
}

export interface QRToken {
  orderId: string
  token: string
  expiresAt: string
}
