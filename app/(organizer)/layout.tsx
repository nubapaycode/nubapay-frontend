import { OrganizerSidebar } from '@/components/organizer/OrganizerSidebar'

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <OrganizerSidebar />
      <div className="flex-1">{children}</div>
    </div>
  )
}
