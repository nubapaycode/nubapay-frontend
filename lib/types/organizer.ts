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
}

/** Respuesta de `GET /api/events/:id` (misma forma que un item de lista). */
export type OrganizerEventDetail = OrganizerEventRow & {
  user_id: string
  created_at: string | null
  updated_at: string | null
  membership?: 'owner' | 'staff'
}
