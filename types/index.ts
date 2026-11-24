// types/index.ts

export type OrderStatus =
  | 'pending'
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'partially_delivered'
  | 'delivered'
  | 'cancelled'

export interface ServiceFeePercent {
  ticket: number
  product: number
}

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

/** Entrada, parking u otro acceso con categoría y precio propios (se vende aparte del catálogo). */
export interface Ticket {
  id: string
  /** `ticket` = entrada; `parking` = estacionamiento (`name` es el tipo de vehículo). */
  kind: 'ticket' | 'parking'
  /** Clave del ícono del vehículo (solo parking). */
  icon?: string | null
  name: string
  description: string
  price: number
  available: boolean
  /** Unidades que quedan; `null`/ausente si el ticket no tiene stock máximo. */
  remaining?: number | null
}

export interface CartItem {
  id?: string
  /** Id del producto, combo o ticket (según `kind`). */
  productId: string
  /** `'ticket'` para entradas; ausente para productos y combos. */
  kind?: 'ticket' | 'parking'
  /** Lo manda el backend en los pedidos del panel (escáner, listado): true si la línea es una entrada. */
  isTicket?: boolean
  name: string
  price: number
  listPrice?: number
  quantity: number
  subtotal?: number
  categoryName?: string | null
  imageUrl?: string
  redeemedAt?: string | null
  redeemedQuantity?: number
}

export interface Order {
  id: string
  orderNumber?: number | null
  eventId: string
  customerName?: string | null
  customerPhone?: string | null
  customerEmail?: string | null
  /** Parking: DNI del comprador y patente del vehículo (normalizados por el backend). */
  customerDni?: string | null
  vehiclePlate?: string | null
  items: CartItem[]
  total: number
  status: OrderStatus
  paymentStatus?: string
  qrToken: string
  createdAt: string
  updatedAt: string
  pickupPoint?: string
  paymentMethod?: 'mp' | 'cash' | 'transfer' | 'sipago' | 'mobbex'
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
  tickets: Ticket[]
  /** Lugares de estacionamiento (cada uno es un tipo de vehículo). */
  parking?: Ticket[]
  /** Link de Google Maps del estacionamiento. */
  parkingMapsUrl?: string | null
  /** URL larga a la que lleva el link (si era un link corto de Google): con ella se arma el mapa en la página. */
  parkingMapsResolvedUrl?: string | null
  /** Módulos que ofrece el evento (catalogo, tickets, parking). */
  modules?: string[]
  /** El organizador tiene WhatsApp activo: el checkout ofrece "Recibir mi QR por WhatsApp". */
  whatsappEnabled?: boolean
  /** Costo de servicio al comprador, en % sobre tickets y sobre productos. */
  serviceFeePercent?: ServiceFeePercent
  /** Categorías activas con productos, en el orden configurado por el organizador. */
  categories: string[]
  /** Si está activo, /catalogo muestra primero botones de categoría antes de la lista de productos. */
  showCategoryShortcuts: boolean
  /** Switch global de plataforma (panel de admin): si es false, no se permite agregar al carrito ni pagar. */
  paymentsEnabled: boolean
  /** El organizador cerró la compra (X horas antes del inicio). Ya está incluido en `paymentsEnabled`; sirve para elegir el mensaje. */
  purchaseClosed?: boolean
}

export interface QRToken {
  orderId: string
  token: string
  expiresAt: string
}
