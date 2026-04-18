import { OrganizerSidebar } from '@/components/organizer/OrganizerSidebar'
import { OrganizerGuard } from '@/components/organizer/OrganizerGuard'

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizerGuard>
      <div className="flex min-h-screen bg-gray-50">
        <OrganizerSidebar />
        <div className="flex-1">{children}</div>
      </div>
    </OrganizerGuard>
  )
}
