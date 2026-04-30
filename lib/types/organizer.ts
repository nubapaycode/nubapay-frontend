export type OrganizerEventRow = {
  id: string
  name: string
  slug: string
  description: string | null
  starts_at: string | null
  ends_at: string | null
  status: string
  is_active: boolean
}
