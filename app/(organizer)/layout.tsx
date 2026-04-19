import { OrganizerSidebar } from '@/components/organizer/OrganizerSidebar'
import { OrganizerGuard } from '@/components/organizer/OrganizerGuard'

export default function OrganizerLayout({ children }: { children: React.ReactNode }) {
  return (
    <OrganizerGuard>
      <div className="flex min-h-screen bg-gray-100">
        <OrganizerSidebar />
        <div className="flex-1 bg-white overflow-hidden md:rounded-tl-3xl md:rounded-bl-3xl">
          <div className="pb-20 md:pb-0">{children}</div>
        </div>
      </div>
    </OrganizerGuard>
  )
}
