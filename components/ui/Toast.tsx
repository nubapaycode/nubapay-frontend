'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export type ToastType = 'error' | 'success' | 'info'

export interface ToastItem {
  id: string
  message: string
  type: ToastType
}

interface ToastProps {
  toasts: ToastItem[]
  onDismiss: (id: string) => void
}

function ToastIcon({ type }: { type: ToastType }) {
  if (type === 'error') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 5v3.5M8 11v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
  if (type === 'success') return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M5 8l2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0 }}>
      <circle cx="8" cy="8" r="7" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M8 7v4M8 5v.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
    </svg>
  )
}

const colors: Record<ToastType, { bg: string; border: string; color: string }> = {
  error:   { bg: '#FFF1F1', border: 'rgba(239,68,68,0.2)',  color: '#DC2626' },
  success: { bg: '#F0FFF4', border: 'rgba(34,197,94,0.2)',  color: '#16A34A' },
  info:    { bg: '#F5F5F7', border: 'rgba(0,0,0,0.08)',     color: '#374151' },
}

function ToastList({ toasts, onDismiss }: ToastProps) {
  const [portalEl, setPortalEl] = useState<HTMLElement | null>(null)

  useEffect(() => {
    let el = document.getElementById('nuba-toast-root')
    if (!el) {
      el = document.createElement('div')
      el.id = 'nuba-toast-root'
      el.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;pointer-events:none;'
      document.body.appendChild(el)
    }
    setPortalEl(el)
    return () => {
      // no removemos el nodo, se reutiliza entre montajes
    }
  }, [])

  if (!portalEl || toasts.length === 0) return null

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: '20px',
        right: '20px',
        zIndex: 2147483647,
        display: 'flex',
        flexDirection: 'column',
        gap: '10px',
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
      aria-live="assertive"
      aria-atomic="false"
    >
      {toasts.map(t => {
        const c = colors[t.type]
        return (
          <div
            key={t.id}
            role="alert"
            style={{
              pointerEvents: 'all',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              background: c.bg,
              border: `1px solid ${c.border}`,
              borderRadius: '14px',
              padding: '12px 14px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.10)',
              maxWidth: '360px',
              minWidth: '240px',
              color: c.color,
              animation: 'toast-in 0.22s cubic-bezier(0.16,1,0.3,1)',
            }}
          >
            <ToastIcon type={t.type} />
            <span style={{ fontSize: '13px', fontWeight: 500, lineHeight: 1.45, flex: 1 }}>{t.message}</span>
            <button
              type="button"
              onClick={() => onDismiss(t.id)}
              aria-label="Cerrar"
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', opacity: 0.5, padding: '1px', display: 'flex', alignItems: 'center', flexShrink: 0, marginTop: '1px' }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round"/>
              </svg>
            </button>
          </div>
        )
      })}
      <style>{`
        @keyframes toast-in {
          from { opacity: 0; transform: translateY(-10px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>,
    portalEl,
  )
}

let _toastCounter = 0

export function useToast(duration = 4000) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = (id: string) => setToasts(prev => prev.filter(t => t.id !== id))

  const show = (message: string, type: ToastType = 'info') => {
    const id = String(++_toastCounter)
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => dismiss(id), duration)
  }

  const ToastPortal = () => <ToastList toasts={toasts} onDismiss={dismiss} />

  return { show, ToastPortal }
}
