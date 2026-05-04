'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { clearAuthSession, getAuthUser } from '@/lib/authSession'

export function OrganizerHubBar({ compact }: { compact?: boolean }) {
  const router = useRouter()
  const [emailLabel, setEmailLabel] = useState('')

  useEffect(() => {
    setEmailLabel(getAuthUser()?.email ?? '')
  }, [])

  const logout = () => {
    clearAuthSession()
    router.replace('/')
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
      <div style={{ display: 'inline-flex', alignItems: 'baseline', gap: '8px' }}>
        <span style={{ fontSize: '16px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.03em' }}>nubapay</span>
        <span style={{ fontSize: '10px', fontWeight: 700, color: '#C8C8D0', letterSpacing: '0.12em', textTransform: 'uppercase' }}>organizer</span>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        {emailLabel && (
          <span style={{ fontSize: '13px', color: '#9A9AA8', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {emailLabel}
          </span>
        )}
        <button
          type="button"
          onClick={logout}
          style={{ background: 'none', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '100px', padding: '6px 14px', fontSize: '13px', fontWeight: 500, color: '#6A6A78', cursor: 'pointer' }}
        >
          Salir
        </button>
      </div>
    </div>
  )
}
