export type OrganizerEventRow = {
  id: string
  name: string
  slug: string
  description: string | null
  /** URL absoluta de portada (p. ej. Supabase Storage). */
  cover_image_url: string | null
  starts_at: string | null
  ends_at: string | null
  status: string
  is_active: boolean
  /** Dueño del evento o integrante invitado (staff). */
  membership?: 'owner' | 'staff'
  /** Stats opcionales que el backend puede incluir en el listado. */
  order_count?: number
  active_orders?: number
  total_revenue?: number
}

/** Respuesta de `GET /api/events/:id` (misma forma que un item de lista). */
export type OrganizerEventDetail = OrganizerEventRow & {
  user_id: string
  /** true si el evento tiene un token de MP propio configurado. El valor nunca se devuelve. */
  has_mp_token: boolean
  created_at: string | null
  updated_at: string | null
  membership?: 'owner' | 'staff'
}
