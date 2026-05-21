'use client'

import { CheckCircle2, ChevronDown, ChevronLeft, ChevronRight, Eye, EyeOff, ExternalLink, Trash2 } from 'lucide-react'
import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'

import { Modal } from '@/components/ui/Modal'
import { Spinner } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'
import { fetchOrganizerEventDetail, patchOrganizerEvent } from '@/lib/organizerEvents'
import type { OrganizerEventDetail } from '@/lib/types/organizer'

const monoInputClass =
  'w-full rounded-xl border border-gray-200 px-3.5 py-3 text-sm text-gray-900 placeholder:text-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent transition font-mono'

const MpLogoMock = () => (
  <svg width="22" height="16" viewBox="206 130 288 210" fill="none" aria-hidden>
    <path fill="#00bcff" d="m350.04,138.92c-77.83,0-140.91,40.36-140.91,90.15s63.09,94.05,140.91,94.05,140.91-44.27,140.91-94.05-63.09-90.15-140.91-90.15Z"/>
    <path fill="#fff" d="m304.18,201.2c-.07.14-1.45,1.56-.55,2.71,2.18,2.78,8.91,4.38,15.72,2.85,4.05-.91,9.25-5.04,14.28-9.03,5.45-4.33,10.86-8.67,16.3-10.39,5.76-1.83,9.45-1.05,11.89-.31,2.67.8,5.82,2.56,10.84,6.32,9.45,7.1,47.43,40.26,54,45.99,5.28-2.39,30.47-12.56,62.39-19.6-2.78-17.02-13.01-33.25-28.72-45.99-21.89,9.19-50.42,14.7-76.58,1.93-.13-.05-14.29-6.75-28.25-6.42-20.75.48-29.74,9.46-39.25,18.97l-12.05,12.99Z"/>
    <path fill="#fff" d="m425.1,242.95c-.45-.4-44.67-39.09-54.69-46.62-5.8-4.35-9.02-5.46-12.41-5.89-1.76-.23-4.2.1-5.9.57-4.66,1.27-10.75,5.34-16.16,9.63-5.6,4.46-10.88,8.66-15.79,9.76-6.26,1.4-13.91-.25-17.4-2.61-1.41-.95-2.41-2.05-2.89-3.16-1.29-2.99,1.09-5.38,1.48-5.78l12.2-13.2c1.42-1.41,2.85-2.83,4.31-4.23-3.94.51-7.58,1.52-11.12,2.5-4.42,1.24-8.68,2.42-12.98,2.42-1.8,0-11.42-1.58-13.25-2.07-11.05-3.02-23.56-5.97-38.04-12.73-17.35,12.91-28.65,28.77-32,46.56,2.49.66,9.02,2.15,10.71,2.52,39.26,8.73,51.49,17.72,53.71,19.6,2.4-2.67,5.87-4.36,9.73-4.36,4.35,0,8.26,2.19,10.64,5.56,2.25-1.78,5.35-3.3,9.36-3.29,1.82,0,3.71.34,5.62.98,4.43,1.52,6.72,4.47,7.9,7.14,1.48-.67,3.31-1.17,5.46-1.16,2.12,0,4.32.48,6.53,1.44,7.24,3.11,8.36,10.22,7.71,15.58.52-.06,1.04-.08,1.56-.08,8.58,0,15.56,6.98,15.56,15.57,0,2.66-.68,5.16-1.86,7.35,2.34,1.31,8.29,4.28,13.52,3.62,4.17-.53,5.76-1.95,6.32-2.76.39-.55.8-1.2.42-1.66l-11.08-12.3s-1.82-1.73-1.22-2.39c.62-.68,1.75.3,2.55.96,5.64,4.71,12.52,11.81,12.52,11.81.12.08.57.98,3.12,1.43,2.19.39,6.07.17,8.76-2.04.67-.56,1.35-1.25,1.93-1.97-.05.04-.09.08-.13.1,2.84-3.63-.32-7.29-.32-7.29l-12.93-14.52s-1.85-1.71-1.22-2.4c.56-.6,1.75.3,2.56.98,4.09,3.42,9.88,9.23,15.42,14.66,1.09.79,5.96,3.8,12.41-.43,3.92-2.57,4.7-5.73,4.59-8.1-.27-3.15-2.73-5.4-2.73-5.4l-17.66-17.76s-1.87-1.59-1.21-2.4c.54-.68,1.75.3,2.55.96,5.62,4.71,20.86,18.68,20.86,18.68.22.15,5.48,3.9,11.99-.24,2.33-1.49,3.81-3.73,3.94-6.34.22-4.52-2.96-7.2-2.96-7.2Z"/>
    <path fill="#fff" d="m339.41,265.46c-2.74-.03-5.74,1.6-6.13,1.36-.22-.14.17-1.24.42-1.88.27-.63,3.87-11.48-4.92-15.25-6.73-2.89-10.85.36-12.26,1.83-.37.38-.54.35-.58-.13-.14-1.96-1.01-7.24-6.82-9.02-8.3-2.54-13.64,3.25-14.99,5.35-.61-4.73-4.61-8.4-9.5-8.41-5.32,0-9.64,4.3-9.65,9.63,0,5.32,4.31,9.64,9.64,9.64,2.59,0,4.93-1.03,6.66-2.69.06.05.08.14.05.32-.41,2.39-1.15,11.04,7.92,14.57,3.64,1.41,6.73.36,9.29-1.43.76-.54.89-.31.78.41-.33,2.23.09,6.99,6.77,9.7,5.08,2.07,8.09-.04,10.07-1.87.86-.78,1.09-.65,1.14.56.24,6.44,5.59,11.56,12.09,11.57,6.7,0,12.13-5.41,12.13-12.1,0-6.7-5.42-12.06-12.12-12.13Z"/>
    <path fill="#0a0080" d="m350.01,135.19c-79.31,0-143.6,42.18-143.6,93.92,0,1.34-.02,5.03-.02,5.5,0,54.9,56.19,99.35,143.6,99.35s143.61-44.45,143.61-99.34v-5.51c0-51.74-64.29-93.92-143.59-93.92Zm137.12,83.51c-31.21,6.94-54.49,17.01-60.32,19.61-13.62-11.89-45.1-39.26-53.63-45.66-4.87-3.67-8.2-5.6-11.12-6.47-1.31-.4-3.12-.85-5.45-.85-2.17,0-4.5.39-6.93,1.17-5.51,1.75-11,6.11-16.31,10.33l-.27.22c-4.95,3.93-10.06,8-13.93,8.86-1.69.38-3.43.58-5.16.58-4.34,0-8.23-1.26-9.69-3.12-.24-.31-.08-.81.48-1.52l.07-.1,11.99-12.91c9.39-9.39,18.25-18.25,38.66-18.72.34-.01.68-.02,1.02-.02,12.7.01,25.4,5.69,26.83,6.36,11.91,5.81,24.21,8.76,36.56,8.77,12.85,0,26.11-3.17,40.05-9.58,14.56,12.24,24.21,26.99,27.15,43.06Zm-137.1-77.97c42.1,0,79.76,12.07,105.09,31.07-12.24,5.3-23.91,7.97-35.17,7.97-11.52-.01-23.03-2.78-34.21-8.23-.59-.28-14.61-6.89-29.2-6.9-.38,0-.77,0-1.15.01-17.14.4-26.8,6.49-33.29,11.82-6.31.16-11.76,1.68-16.61,3.03-4.33,1.2-8.06,2.24-11.7,2.24-1.5,0-4.2-.14-4.44-.15-4.18-.13-25.18-5.28-41.95-11.61,25.27-17.96,61.89-29.26,102.64-29.26Zm-107.61,33.01c17.51,7.16,38.76,12.7,45.48,13.13,1.87.12,3.87.34,5.87.34,4.46,0,8.91-1.25,13.21-2.45,2.54-.71,5.35-1.49,8.3-2.05-.79.77-1.58,1.56-2.37,2.35l-12.17,13.17c-.96.97-3.04,3.55-1.67,6.73.54,1.28,1.65,2.51,3.2,3.55,2.9,1.95,8.1,3.28,12.92,3.28,1.83,0,3.57-.18,5.15-.54,5.11-1.14,10.46-5.41,16.13-9.92,4.52-3.59,10.94-8.15,15.86-9.49,1.38-.37,3.06-.61,4.42-.61.41,0,.79.02,1.14.07,3.24.41,6.38,1.51,11.99,5.72,10,7.51,54.22,46.2,54.65,46.58.03.02,2.85,2.46,2.65,6.5-.11,2.26-1.36,4.26-3.54,5.65-1.89,1.2-3.83,1.81-5.8,1.81-2.96,0-4.99-1.39-5.13-1.48-.16-.13-15.31-14.03-20.89-18.7-.89-.74-1.75-1.4-2.62-1.4-.47,0-.88.2-1.16.55-.88,1.08.1,2.58,1.26,3.56l17.7,17.8s2.21,2.06,2.45,4.79c.14,2.95-1.27,5.42-4.2,7.34-2.09,1.38-4.2,2.07-6.27,2.07-2.72,0-4.63-1.24-5.05-1.53l-2.54-2.5c-4.64-4.57-9.43-9.29-12.94-12.21-.86-.71-1.77-1.37-2.64-1.37-.43,0-.82.16-1.12.48-.4.44-.68,1.24.32,2.57.4.55.89,1,.89,1l12.91,14.51c.1.13,2.66,3.17.29,6.19l-.46.58c-.39.42-.8.82-1.2,1.16-2.2,1.81-5.14,2-6.31,2-.63,0-1.22-.05-1.75-.15-1.27-.23-2.13-.58-2.55-1.07l-.16-.16c-.7-.73-7.21-7.38-12.6-11.87-.71-.6-1.6-1.34-2.51-1.34-.45,0-.85.18-1.17.52-1.06,1.17.54,2.91,1.22,3.55l11.01,12.15c-.01.11-.15.36-.41.74-.4.55-1.73,1.88-5.73,2.38-.48.06-.98.09-1.46.09-4.12,0-8.52-2-10.79-3.2,1.03-2.18,1.57-4.58,1.57-6.98,0-9.07-7.36-16.44-16.43-16.45-.19,0-.4,0-.59.01.29-4.14-.29-11.98-8.34-15.43-2.32-1-4.63-1.52-6.87-1.52-1.76,0-3.45.3-5.04.91-1.67-3.24-4.44-5.6-8.04-6.83-2-.69-3.98-1.04-5.9-1.04-3.35,0-6.44.99-9.19,2.94-2.64-3.28-6.62-5.22-10.81-5.22-3.67,0-7.2,1.47-9.81,4.06-3.43-2.62-17.03-11.26-53.44-19.53-1.74-.39-5.69-1.52-8.17-2.25,3.41-16.34,13.8-31.27,29.2-43.52Zm67.54,94.78l-.39-.35h-.4c-.32,0-.66.13-1.11.45-1.86,1.31-3.63,1.94-5.44,1.94-1,0-2.02-.2-3.04-.59-8.44-3.29-7.78-11.25-7.36-13.65.06-.49-.06-.86-.37-1.12l-.6-.49-.56.53c-1.65,1.59-3.8,2.45-6.06,2.45-4.83,0-8.77-3.93-8.76-8.77,0-4.83,3.94-8.76,8.78-8.75,4.37,0,8.09,3.28,8.64,7.65l.3,2.35,1.29-1.99c.14-.23,3.69-5.59,10.2-5.58,1.24,0,2.52.2,3.81.6,5.19,1.58,6.07,6.29,6.2,8.25.09,1.14.91,1.2,1.06,1.2.45,0,.78-.28,1.01-.53.98-1.02,3.11-2.72,6.45-2.72,1.53,0,3.15.37,4.83,1.09,8.25,3.54,4.51,14.02,4.47,14.13-.71,1.74-.74,2.5-.07,2.95l.32.15h.24c.37,0,.83-.16,1.6-.42,1.12-.39,2.81-.97,4.4-.97h0c6.21.07,11.26,5.13,11.26,11.26,0,6.2-5.06,11.24-11.27,11.24-6.07,0-11.01-4.73-11.23-10.74-.02-.52-.07-1.88-1.23-1.88-.47,0-.89.29-1.36.72-1.34,1.24-3.04,2.49-5.52,2.49-1.13,0-2.35-.26-3.64-.79-6.41-2.6-6.5-7-6.24-8.77.07-.47.09-.96-.23-1.35Zm40.07,48.88c-76.26,0-138.08-39.55-138.08-88.33,0-1.96.14-3.91.33-5.84.61.15,6.67,1.59,7.92,1.88,37.19,8.26,49.48,16.85,51.56,18.48-.7,1.69-1.07,3.51-1.07,5.35,0,7.69,6.25,13.95,13.93,13.95.86,0,1.72-.08,2.56-.24,1.16,5.66,4.86,9.95,10.51,12.15,1.65.63,3.32.96,4.97.96,1.06,0,2.13-.13,3.17-.39,1.05,2.65,3.39,5.96,8.65,8.09,1.84.74,3.68,1.13,5.47,1.13,1.46,0,2.89-.26,4.25-.76,2.52,6.13,8.51,10.2,15.19,10.2,4.43,0,8.68-1.8,11.78-4.99,2.65,1.48,8.25,4.15,13.91,4.16.73,0,1.41-.05,2.11-.13,5.62-.71,8.23-2.91,9.43-4.62.22-.3.41-.62.58-.95,1.32.38,2.78.69,4.46.7,3.07,0,6.01-1.05,8.99-3.21,2.93-2.11,5.01-5.14,5.31-7.72,0-.03,0-.07.01-.11.99.2,2,.3,3.01.3,3.16,0,6.27-.98,9.24-2.93,5.73-3.75,6.72-8.66,6.63-11.87,1.01.21,2.03.32,3.05.32,2.96,0,5.88-.89,8.65-2.66,3.55-2.27,5.69-5.75,6.02-9.79.21-2.75-.47-5.53-1.91-7.91,9.58-4.13,31.48-12.12,57.27-17.93.11,1.46.17,2.93.17,4.41,0,48.78-61.82,88.33-138.07,88.33Z"/>
  </svg>
)

// ── Pasos ──────────────────────────────────────────────────────────────────

type Step = { title: string; body: React.ReactNode }

const MP_STEPS: Step[] = [
  {
    title: 'Accedé al panel de developers',
    body: (
      <p className="text-sm text-gray-600 leading-relaxed">
        Entrá a{' '}
        <a
          href="https://www.mercadopago.com.ar/developers/panel/app"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-blue-600 hover:underline font-medium"
        >
          mercadopago.com/developers
          <ExternalLink size={11} aria-hidden />
        </a>
        {' '}con tu cuenta de Mercado Pago. Si todavía no tenés una, podés crearla gratis desde el mismo sitio.
      </p>
    ),
  },
  {
    title: 'Creá una aplicación',
    body: (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 leading-relaxed">
          Hacé clic en <strong className="text-gray-800">Crear aplicación</strong>. Poné cualquier nombre, seleccioná{' '}
          <strong className="text-gray-800">Pagos online</strong> como modelo de integración y guardá.
        </p>
        <style>{`
          @keyframes mp-spring {
            0%   { transform: scale(1); }
            40%  { transform: scale(1.13); }
            70%  { transform: scale(0.97); }
            85%  { transform: scale(1.04); }
            93%  { transform: scale(0.99); }
            100% { transform: scale(1); }
          }
          .mp-spring-btn { animation: mp-spring 2.2s ease-in-out infinite; animation-delay: 0.8s; }
        `}</style>
        <div className="rounded-xl overflow-hidden border border-gray-200 select-none pointer-events-none" style={{ fontSize: 0 }}>
          <div className="flex items-center justify-between px-3 py-1.5 gap-2" style={{ background: '#FFE600' }}>
            <div className="flex items-center gap-1.5">
              <MpLogoMock />
              <span style={{ fontSize: '7px', fontWeight: 700, color: '#333', letterSpacing: '-0.02em', lineHeight: 1 }}>mercado pago</span>
              <span style={{ fontSize: '6px', color: '#666', lineHeight: 1, marginLeft: '2px' }}>| Developers</span>
            </div>
            <div className="rounded px-2 py-0.5" style={{ background: '#3483FA', fontSize: '7px', fontWeight: 700, color: '#fff', lineHeight: '14px' }}>Crear aplicación</div>
          </div>
          <div className="px-4 py-3" style={{ background: '#EBEBEB' }}>
            <p style={{ fontSize: '10px', fontWeight: 700, color: '#1a1a1a', marginBottom: '2px' }}>Integraciones</p>
            <p style={{ fontSize: '7px', color: '#666', marginBottom: '8px' }}>Gestioná tus aplicaciones y credenciales de acceso.</p>
            <div className="flex gap-3 mb-2" style={{ borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
              <span style={{ fontSize: '7px', color: '#3483FA', fontWeight: 600, borderBottom: '1.5px solid #3483FA', paddingBottom: '3px' }}>Tus aplicaciones</span>
              <span style={{ fontSize: '7px', color: '#666' }}>Aplicaciones de otras cuentas</span>
            </div>
            <div className="rounded-lg flex flex-col items-center py-3 gap-1.5" style={{ background: '#fff' }}>
              <svg width="28" height="22" viewBox="0 0 28 22" fill="none"><ellipse cx="12" cy="16" rx="8" ry="4" fill="#eee"/><circle cx="16" cy="8" r="6" fill="#e8e8e8" stroke="#ccc" strokeWidth="1"/><path d="M13 8c0-1.5 1-2.5 2.5-2.5" stroke="#aaa" strokeWidth="1" strokeLinecap="round"/><path d="M10 14c1-2 3-3 5-3" stroke="#bbb" strokeWidth="0.8" strokeLinecap="round"/></svg>
              <p style={{ fontSize: '8px', fontWeight: 600, color: '#1a1a1a' }}>Creá tu primera aplicación</p>
              <p style={{ fontSize: '6.5px', color: '#888', marginBottom: '2px' }}>Empezá a integrar con Mercado Pago.</p>
              <div className="mp-spring-btn rounded px-3 py-1" style={{ background: '#3483FA', fontSize: '7.5px', fontWeight: 700, color: '#fff' }}>Crear aplicación</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Configurá el tipo de integración',
    body: (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 leading-relaxed">
          Seleccioná <strong className="text-gray-800">Pagos online</strong>, luego{' '}
          <strong className="text-gray-800">A través de una plataforma</strong>. La URL de la tienda es opcional, podés dejarlo vacío.
        </p>
        <style>{`
          @keyframes mp-card-pulse { 0%, 100% { box-shadow: 0 0 0 0 rgba(52,131,250,0.3); } 50% { box-shadow: 0 0 0 3px rgba(52,131,250,0.15); } }
          .mp-selected-card { animation: mp-card-pulse 2s ease-in-out infinite; }
        `}</style>
        <div className="rounded-xl overflow-hidden border border-gray-200 select-none pointer-events-none">
          {/* Navbar */}
          <div className="flex items-center justify-between px-3 py-1.5 gap-2" style={{ background: '#FFE600' }}>
            <div className="flex items-center gap-1.5">
              <MpLogoMock />
              <span style={{ fontSize: '7px', fontWeight: 700, color: '#333', letterSpacing: '-0.02em', lineHeight: 1 }}>mercado pago</span>
              <span style={{ fontSize: '6px', color: '#666', lineHeight: 1, marginLeft: '2px' }}>| Developers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                {['Inicio', 'Documentación ▾', 'Recursos ▾', 'Partners ▾', 'Comunidad ▾'].map(item => (
                  <span key={item} style={{ fontSize: '5.5px', color: '#444' }}>{item}</span>
                ))}
              </div>
              <div className="rounded px-1.5 py-0.5" style={{ background: '#3483FA', fontSize: '6px', fontWeight: 700, color: '#fff', lineHeight: '13px' }}>Crear aplicación</div>
              <span style={{ fontSize: '5.5px', color: '#444' }}>Tu cuenta ▾</span>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 py-3 space-y-2.5" style={{ background: '#F0F0F0' }}>
            {/* Title row */}
            <div className="flex items-center justify-between">
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#1a1a1a' }}>Elegí el tipo de pago que querés integrar</p>
              <span style={{ fontSize: '6.5px', color: '#888' }}>2 de 4</span>
            </div>

            {/* Cards */}
            <div className="flex gap-2">
              {/* Pagos online - seleccionado */}
              <div className="mp-selected-card flex-1 rounded-lg p-2 bg-white" style={{ border: '1.5px solid #3483FA' }}>
                <svg width="11" height="9" viewBox="0 0 22 17" fill="none" style={{ marginBottom: '3px' }}>
                  <rect x="1" y="1" width="20" height="12" rx="2" stroke="#333" strokeWidth="1.5"/>
                  <path d="M1 15h20" stroke="#333" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <p style={{ fontSize: '7px', fontWeight: 700, color: '#1a1a1a', marginBottom: '1px' }}>Pagos online</p>
                <p style={{ fontSize: '5.5px', color: '#666', marginBottom: '3px', lineHeight: 1.4 }}>Recibí pagos en una tienda en línea.</p>
                <div className="flex gap-1 flex-wrap">
                  {['Checkout', 'Bricks', 'Suscripciones'].map(tag => (
                    <span key={tag} style={{ fontSize: '4.5px', color: '#3483FA', background: '#EBF3FF', borderRadius: '3px', padding: '1px 3px' }}>{tag}</span>
                  ))}
                </div>
              </div>

              {/* Pagos presenciales */}
              <div className="flex-1 rounded-lg p-2 bg-white" style={{ border: '1px solid #ddd' }}>
                <svg width="11" height="11" viewBox="0 0 20 20" fill="none" style={{ marginBottom: '3px' }}>
                  <rect x="1" y="1" width="7" height="7" rx="1" stroke="#555" strokeWidth="1.3"/>
                  <rect x="3" y="3" width="3" height="3" fill="#555"/>
                  <rect x="12" y="1" width="7" height="7" rx="1" stroke="#555" strokeWidth="1.3"/>
                  <rect x="14" y="3" width="3" height="3" fill="#555"/>
                  <rect x="1" y="12" width="7" height="7" rx="1" stroke="#555" strokeWidth="1.3"/>
                  <rect x="3" y="14" width="3" height="3" fill="#555"/>
                  <path d="M12 12h3M12 15h2M12 18h3M15 15h3M18 12v3M18 18h-3v-3" stroke="#555" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
                <p style={{ fontSize: '7px', fontWeight: 700, color: '#1a1a1a', marginBottom: '1px' }}>Pagos presenciales</p>
                <p style={{ fontSize: '5.5px', color: '#666', marginBottom: '3px', lineHeight: 1.4 }}>Recibí pagos en una tienda física.</p>
                <div className="flex gap-1">
                  {['Código QR', 'Point'].map(tag => (
                    <span key={tag} style={{ fontSize: '4.5px', color: '#3483FA', background: '#EBF3FF', borderRadius: '3px', padding: '1px 3px' }}>{tag}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* ¿Cómo hiciste la tienda? */}
            <div>
              <p style={{ fontSize: '7px', fontWeight: 600, color: '#1a1a1a', marginBottom: '4px' }}>¿Cómo hiciste la tienda?</p>
              <div className="flex gap-2">
                <div className="flex-1 rounded-lg px-2 py-1.5 bg-white" style={{ border: '1px solid #ddd' }}>
                  <p style={{ fontSize: '6.5px', color: '#444' }}>Con un desarrollo propio</p>
                </div>
                <div className="flex-1 rounded-lg px-2 py-1.5 bg-white" style={{ border: '1.5px solid #3483FA' }}>
                  <p style={{ fontSize: '6.5px', color: '#3483FA', fontWeight: 600 }}>A través de una plataforma</p>
                </div>
              </div>
            </div>

            {/* URL */}
            <div>
              <p style={{ fontSize: '6.5px', color: '#444', marginBottom: '3px' }}>URL de la tienda (opcional)</p>
              <div className="rounded-lg px-2.5 py-1.5 bg-white" style={{ border: '1px solid #ccc' }}>
                <p style={{ fontSize: '6px', color: '#bbb' }}>https://example.com</p>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end gap-2 pt-0.5">
              <span style={{ fontSize: '7px', color: '#3483FA', fontWeight: 500 }}>Volver</span>
              <div className="rounded px-3 py-1" style={{ background: '#3483FA', fontSize: '7px', fontWeight: 700, color: '#fff' }}>Continuar</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Seleccioná la plataforma',
    body: (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 leading-relaxed">
          En la grilla de plataformas, ignorá las opciones de la lista. Bajá hasta el campo{' '}
          <strong className="text-gray-800">Otra plataforma</strong> y escribí:{' '}
          <span className="inline-flex items-center gap-1 align-middle">
            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">Nubapay</code>
            <CopyNubapayButton />
          </span>.
        </p>
        <div className="rounded-xl overflow-hidden border border-gray-200 select-none pointer-events-none">
          {/* Navbar */}
          <div className="flex items-center justify-between px-3 py-1.5 gap-2" style={{ background: '#FFE600' }}>
            <div className="flex items-center gap-1.5">
              <MpLogoMock />
              <span style={{ fontSize: '7px', fontWeight: 700, color: '#333', letterSpacing: '-0.02em', lineHeight: 1 }}>mercado pago</span>
              <span style={{ fontSize: '6px', color: '#666', lineHeight: 1, marginLeft: '2px' }}>| Developers</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-2">
                {['Inicio', 'Documentación ▾', 'Recursos ▾', 'Partners ▾', 'Comunidad ▾'].map(item => (
                  <span key={item} style={{ fontSize: '5.5px', color: '#444' }}>{item}</span>
                ))}
              </div>
              <div className="rounded px-1.5 py-0.5" style={{ background: '#3483FA', fontSize: '6px', fontWeight: 700, color: '#fff', lineHeight: '13px' }}>Crear aplicación</div>
              <span style={{ fontSize: '5.5px', color: '#444' }}>Tu cuenta ▾</span>
            </div>
          </div>

          {/* Content */}
          <div className="px-5 py-3 space-y-2.5" style={{ background: '#F0F0F0' }}>
            {/* Title row */}
            <div className="flex items-center justify-between">
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#1a1a1a' }}>Seleccioná la plataforma donde harás la integración</p>
              <span style={{ fontSize: '6.5px', color: '#888' }}>3 de 4</span>
            </div>

            {/* Platform grid */}
            <div className="rounded-lg bg-white p-2.5 space-y-1.5" style={{ border: '1px solid #e5e5e5' }}>
              {[
                [
                  { label: 'WooCommerce', color: '#7f54b3', letter: 'W' },
                  { label: 'Shopify',     color: '#96bf48', letter: 'S' },
                  { label: 'Tiendanube', color: '#4a90d9', letter: 'T' },
                  { label: 'VTEX',        color: '#f71963', letter: 'V' },
                ],
                [
                  { label: 'Adobe Commerce', color: '#e02020', letter: 'A' },
                  { label: 'Prestashop',     color: '#df0067', letter: 'P' },
                  { label: 'Wix',            color: '#1a1a1a', letter: 'W' },
                  { label: 'Salesforce',     color: '#00a1e0', letter: 'S' },
                ],
              ].map((row, ri) => (
                <div key={ri} className="grid grid-cols-4 gap-1.5">
                  {row.map(({ label, color, letter }) => (
                    <div key={label} className="rounded-md bg-white flex flex-col items-center justify-center py-1.5 gap-0.5" style={{ border: '1px solid #eee' }}>
                      <div className="flex items-center justify-center rounded" style={{ width: 14, height: 14, background: color }}>
                        <span style={{ fontSize: '7px', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{letter}</span>
                      </div>
                      <span style={{ fontSize: '5px', color: '#555', textAlign: 'center', lineHeight: 1.2 }}>{label}</span>
                    </div>
                  ))}
                </div>
              ))}

              {/* Otra plataforma */}
              <div className="pt-1">
                <p style={{ fontSize: '6.5px', color: '#444', marginBottom: '3px' }}>Otra plataforma</p>
                <div className="rounded-lg px-2.5 py-1.5 bg-white flex items-center" style={{ border: '1.5px solid #3483FA' }}>
                  <span style={{ fontSize: '7px', color: '#1a1a1a' }}>nubapay</span>
                  <span style={{ fontSize: '7px', color: '#3483FA', borderLeft: '1.5px solid #3483FA', marginLeft: '1px', paddingLeft: '1px', lineHeight: '10px' }}>&nbsp;</span>
                </div>
              </div>
            </div>

            {/* Botones */}
            <div className="flex items-center justify-end gap-2 pt-0.5">
              <span style={{ fontSize: '7px', color: '#3483FA', fontWeight: 500 }}>Volver</span>
              <div className="rounded px-3 py-1" style={{ background: '#3483FA', fontSize: '7px', fontWeight: 700, color: '#fff' }}>Continuar</div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Activá las credenciales de producción',
    body: (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 leading-relaxed">
          Dentro de la app, andá a <strong className="text-gray-800">Credenciales de producción</strong> en el menú lateral. Si aparecen desactivadas, activalas siguiendo los pasos que indica MP.
        </p>
        <style>{`
          @keyframes mp-sidebar-pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.5; } }
          .mp-sidebar-highlight { animation: mp-sidebar-pulse 2s ease-in-out infinite; }
        `}</style>
        <div className="rounded-xl overflow-hidden border border-gray-200 select-none pointer-events-none flex flex-col">
          <div className="flex items-center justify-between px-3 py-1.5" style={{ background: '#FFE600' }}>
            <div className="flex items-center gap-1.5">
              <MpLogoMock />
              <span style={{ fontSize: '7px', fontWeight: 700, color: '#333', letterSpacing: '-0.02em', lineHeight: 1 }}>mercado pago</span>
              <span style={{ fontSize: '6px', color: '#666', lineHeight: 1, marginLeft: '2px' }}>| Developers</span>
            </div>
            <span style={{ fontSize: '6px', color: '#444' }}>Tu cuenta ▾</span>
          </div>
          <div className="flex" style={{ background: '#F5F5F5', minHeight: '110px' }}>
            <div className="shrink-0 py-2 px-2.5 space-y-2.5" style={{ width: '110px', background: '#fff', borderRight: '1px solid #eee' }}>
              <div>
                <p style={{ fontSize: '5.5px', fontWeight: 700, color: '#999', letterSpacing: '0.04em', marginBottom: '3px' }}>PRUEBAS</p>
                {['Credenciales de prueba', 'Cuentas de prueba', 'Tarjetas de prueba'].map(item => (
                  <p key={item} style={{ fontSize: '6.5px', color: '#555', padding: '1.5px 0' }}>{item}</p>
                ))}
              </div>
              <div>
                <p style={{ fontSize: '5.5px', fontWeight: 700, color: '#999', letterSpacing: '0.04em', marginBottom: '3px' }}>NOTIFICACIONES</p>
                {['Webhooks', 'IPN'].map(item => (
                  <p key={item} style={{ fontSize: '6.5px', color: '#555', padding: '1.5px 0' }}>{item}</p>
                ))}
              </div>
              <div>
                <p style={{ fontSize: '5.5px', fontWeight: 700, color: '#999', letterSpacing: '0.04em', marginBottom: '3px' }}>PRODUCCIÓN</p>
                <div className="mp-sidebar-highlight flex items-center gap-1 rounded" style={{ background: '#EBF3FF', padding: '2.5px 4px' }}>
                  <p style={{ fontSize: '6.5px', color: '#3483FA', fontWeight: 700 }}>Credenciales de producción</p>
                </div>
              </div>
              <div>
                <p style={{ fontSize: '5.5px', fontWeight: 700, color: '#999', letterSpacing: '0.04em', marginBottom: '3px' }}>EVALUACIÓN</p>
                {['Información de integración', 'Calidad de integración'].map(item => (
                  <p key={item} style={{ fontSize: '6.5px', color: '#555', padding: '1.5px 0' }}>{item}</p>
                ))}
              </div>
            </div>
            <div className="flex-1 p-3 space-y-1.5">
              <p style={{ fontSize: '7px', color: '#aaa' }}>4 tareas pendientes</p>
              <div className="flex items-center justify-between">
                <p style={{ fontSize: '8.5px', fontWeight: 700, color: '#1a1a1a' }}>Realizar integración</p>
                <div className="rounded px-2 py-0.5" style={{ background: '#3483FA', fontSize: '6px', fontWeight: 700, color: '#fff' }}>Comenzar ›</div>
              </div>
              {['Probar la integración', 'Salir a producción'].map(item => (
                <div key={item} className="flex items-center justify-between rounded" style={{ background: '#fff', padding: '4px 6px' }}>
                  <p style={{ fontSize: '6.5px', color: '#888' }}>{item}</p>
                  <span style={{ fontSize: '7px', color: '#bbb' }}>›</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    title: 'Copiá tu Access Token',
    body: (
      <div className="space-y-3">
        <p className="text-sm text-gray-600 leading-relaxed">
          Una vez activadas, vas a ver tu <strong className="text-gray-800">Access Token</strong> de producción. Siempre empieza con{' '}
          <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">APP_USR-</code>.{' '}
          No uses el de prueba (<code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs font-mono">TEST-</code>) o los pagos no se acreditarán.
        </p>
        <style>{`
          @keyframes mp-copy-spring {
            0%   { transform: scale(1); }
            40%  { transform: scale(1.13); }
            70%  { transform: scale(0.97); }
            85%  { transform: scale(1.04); }
            93%  { transform: scale(0.99); }
            100% { transform: scale(1); }
          }
          .mp-copy-btn { animation: mp-copy-spring 2.2s ease-in-out infinite; animation-delay: 0.8s; }
        `}</style>
        <div className="rounded-xl overflow-hidden border border-gray-200 select-none pointer-events-none">
          <div className="flex items-center justify-between px-3 py-1.5" style={{ background: '#FFE600' }}>
            <div className="flex items-center gap-1.5">
              <MpLogoMock />
              <span style={{ fontSize: '7px', fontWeight: 700, color: '#333', letterSpacing: '-0.02em', lineHeight: 1 }}>mercado pago</span>
              <span style={{ fontSize: '6px', color: '#666', lineHeight: 1, marginLeft: '2px' }}>| Developers</span>
            </div>
            <span style={{ fontSize: '6px', color: '#444' }}>Tu cuenta ▾</span>
          </div>
          <div className="flex" style={{ background: '#F5F5F5' }}>
            <div className="shrink-0 py-2 px-2.5 space-y-2" style={{ width: '90px', background: '#fff', borderRight: '1px solid #eee' }}>
              <div>
                <p style={{ fontSize: '7px', fontWeight: 700, color: '#1a1a1a' }}>testeo4 ›</p>
                <p style={{ fontSize: '5.5px', color: '#999', marginTop: '1px' }}>Integración con CódigoQR</p>
              </div>
              <p style={{ fontSize: '6px', color: '#555' }}>Configuración de la aplicación</p>
              <div style={{ borderTop: '1px solid #eee', paddingTop: '6px' }}>
                <p style={{ fontSize: '5.5px', fontWeight: 700, color: '#999', letterSpacing: '0.04em', marginBottom: '3px' }}>PRUEBAS</p>
                {['Credenciales de prueba', 'Cuentas de prueba'].map(item => (
                  <p key={item} style={{ fontSize: '6px', color: '#555', padding: '1px 0' }}>{item}</p>
                ))}
              </div>
              <div>
                <p style={{ fontSize: '5.5px', fontWeight: 700, color: '#999', letterSpacing: '0.04em', marginBottom: '3px' }}>PRODUCCIÓN</p>
                <p style={{ fontSize: '6px', color: '#3483FA', fontWeight: 600 }}>Credenciales de producción</p>
              </div>
            </div>
            <div className="flex-1 px-3 py-2.5 space-y-1.5">
              <p style={{ fontSize: '9px', fontWeight: 700, color: '#1a1a1a' }}>Credenciales de producción</p>
              <p style={{ fontSize: '5.5px', color: '#666', marginBottom: '6px', lineHeight: 1.4 }}>Las credenciales <strong>sirven para recibir pagos reales</strong>.</p>
              <div className="rounded-lg px-2.5 py-1.5" style={{ background: '#fff', border: '1px solid #eee' }}>
                <p style={{ fontSize: '6px', color: '#888', marginBottom: '2px' }}>Public Key</p>
                <p style={{ fontSize: '5.5px', color: '#333', fontFamily: 'monospace' }}>APP_USR-635dba9b···</p>
              </div>
              <div className="rounded-lg px-2.5 py-1.5" style={{ background: '#EBF3FF', border: '1.5px solid #3483FA' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    <p style={{ fontSize: '6px', fontWeight: 700, color: '#3483FA' }}>Access Token</p>
                    <svg width="8" height="8" viewBox="0 0 14 10" fill="none"><path d="M1 5C2.5 2 4.5 1 7 1s4.5 1 6 4c-1.5 3-3.5 4-6 4S2.5 8 1 5z" stroke="#3483FA" strokeWidth="1.3"/><circle cx="7" cy="5" r="1.8" stroke="#3483FA" strokeWidth="1.3"/></svg>
                  </div>
                  <div className="mp-copy-btn rounded" style={{ background: '#3483FA', padding: '2px 5px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                    <svg width="7" height="7" viewBox="0 0 10 10" fill="none"><rect x="3" y="3" width="6" height="6" rx="1" stroke="#fff" strokeWidth="1.2"/><path d="M1 7V2a1 1 0 011-1h5" stroke="#fff" strokeWidth="1.2" strokeLinecap="round"/></svg>
                    <span style={{ fontSize: '5.5px', color: '#fff', fontWeight: 700 }}>Copiar</span>
                  </div>
                </div>
                <p style={{ fontSize: '5.5px', color: '#999', fontFamily: 'monospace', marginTop: '2px', letterSpacing: '0.5px' }}>••••••••••••••••••••••••••••••••</p>
              </div>
              <div className="rounded-lg px-2.5 py-1.5" style={{ background: '#fff', border: '1px solid #eee' }}>
                <p style={{ fontSize: '6px', color: '#888', marginBottom: '2px' }}>Client ID</p>
                <p style={{ fontSize: '5.5px', color: '#333', fontFamily: 'monospace' }}>750377788699931</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    ),
  },
]

// ── Stepper ────────────────────────────────────────────────────────────────

function MpStepper({
  tokenDraft, tokenError, showToken, saving, justConnected,
  onTokenChange, onToggleShow, onSave,
}: {
  tokenDraft: string; tokenError: string; showToken: boolean; saving: boolean; justConnected: boolean
  onTokenChange: (v: string) => void; onToggleShow: () => void; onSave: () => void
}) {
  const total = MP_STEPS.length + 1
  const [current, setCurrent] = useState(0)
  const isLast = current === total - 1

  return (
    <div className="space-y-4">
      {/* Barra de progreso */}
      <div className="flex items-center gap-1.5">
        {Array.from({ length: total }).map((_, i) => (
          <div
            key={i}
            className="h-1 flex-1 rounded-full transition-all duration-500"
            style={{
              background: justConnected
                ? '#22c55e'
                : i <= current ? '#111827' : '#e5e7eb',
              transitionDelay: justConnected ? `${i * 60}ms` : '0ms',
            }}
          />
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 pt-5 pb-4 min-h-[140px] flex flex-col gap-3">
          <p className="text-xs font-medium text-gray-400">Paso {current + 1} de {total}</p>

          {isLast ? (
            <div className="space-y-1">
              <p className="text-sm font-semibold text-gray-900">Pegá el token acá</p>
              <p className="text-xs text-gray-400">El token se guarda de forma segura y nunca se muestra nuevamente.</p>
            </div>
          ) : (
            <p className="text-sm font-semibold text-gray-900">{MP_STEPS[current].title}</p>
          )}

          {isLast ? (
            <TokenInput value={tokenDraft} onChange={onTokenChange} show={showToken} onToggleShow={onToggleShow} error={tokenError} />
          ) : (
            <div>{MP_STEPS[current].body}</div>
          )}
        </div>

        <div className="px-5 pb-5 flex items-center gap-2">
          {current > 0 && (
            <button type="button" onClick={() => setCurrent(v => v - 1)}
              className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-4 py-2.5 text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors">
              <ChevronLeft size={13} aria-hidden />Anterior
            </button>
          )}
          <div className="flex-1" />
          {isLast ? (
            <button type="button" onClick={onSave} disabled={saving || !tokenDraft.trim()}
              className="rounded-full bg-gray-900 text-white text-xs font-semibold px-5 py-2.5 hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none transition-colors">
              {saving ? 'Guardando…' : 'Conectar cuenta'}
            </button>
          ) : (
            <button type="button" onClick={() => setCurrent(v => v + 1)}
              className="inline-flex items-center gap-1 rounded-full bg-gray-900 text-white px-4 py-2.5 text-xs font-semibold hover:bg-gray-800 transition-colors">
              Siguiente<ChevronRight size={13} aria-hidden />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Vista principal ────────────────────────────────────────────────────────

export function MercadoPagoSetupView({ eventId }: { eventId: string }) {
  const [event, setEvent] = useState<OrganizerEventDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const { show: showToast, ToastPortal } = useToast()

  const [tokenDraft, setTokenDraft] = useState('')
  const [tokenError, setTokenError] = useState('')
  const [showToken, setShowToken] = useState(false)
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [justConnected, setJustConnected] = useState(false)
  const [confirmDisconnect, setConfirmDisconnect] = useState(false)

  const load = useCallback(async () => {
    const res = await fetchOrganizerEventDetail(eventId)
    if (res.ok) setEvent(res.event)
    else showToast(res.error, 'error')
    setLoading(false)
  }, [eventId]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load() }, [load])

  const handleSaveToken = async () => {
    const token = tokenDraft.trim()
    if (!token) return
    if (!token.startsWith('APP_USR-')) {
      setTokenError('El token de producción siempre empieza con APP_USR-. Verificá que no estés usando el token de prueba.')
      return
    }
    setTokenError('')
    setSaving(true)
    const res = await patchOrganizerEvent(eventId, { mp_access_token: token })
    setSaving(false)
    if (!res.ok) { showToast(res.error, 'error'); return }
    setEvent(res.event)
    setTokenDraft('')
    setReplaceOpen(false)
    setJustConnected(true)
    window.dispatchEvent(new CustomEvent('nubapay-mp-connected'))
    showToast('Token guardado correctamente.', 'success')
  }

  const handleRemoveToken = async () => {
    setConfirmDisconnect(false)
    setSaving(true)
    const res = await patchOrganizerEvent(eventId, { mp_access_token: null })
    setSaving(false)
    if (!res.ok) { showToast(res.error, 'error'); return }
    setEvent(res.event)
    setReplaceOpen(false)
    setJustConnected(false)
    window.dispatchEvent(new CustomEvent('nubapay-mp-disconnected'))
    showToast('Cuenta desconectada.', 'success')
  }

  const backHref = `/events/${eventId}/cuenta`

  if (loading) {
    return (
      <div className="max-w-2xl flex flex-col items-center justify-center py-24 gap-3 mx-auto px-4">
        <Spinner size="lg" className="text-gray-900" />
        <p className="text-sm text-gray-400">Cargando…</p>
      </div>
    )
  }

  if (!event) {
    return (
      <div className="max-w-2xl mx-auto p-4 md:p-6">
        <ToastPortal />
        <p className="text-sm text-gray-400">No se pudo cargar el evento.</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6 space-y-6">
      <ToastPortal />

      {/* Botón volver */}
      <Link
        href={backHref}
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 transition-colors"
      >
        <ChevronLeft size={15} aria-hidden />
        Volver a Cuenta
      </Link>

      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#009EE3]/10 flex items-center justify-center shrink-0">
          <MpLogoMock />
        </div>
        <div>
          <h1 className="text-lg font-semibold text-gray-900 tracking-tight">Conectá tu Mercado Pago</h1>
          <p className="text-xs text-gray-400 mt-0.5">Los cobros van directo a tu cuenta de MP</p>
        </div>
      </div>

      {event.has_mp_token ? (
        <div className="space-y-4">
          {/* Estado conectado */}
          <div className="flex items-center justify-between gap-3 rounded-2xl bg-green-50 border border-green-100 px-5 py-4">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 size={16} className="text-green-600 shrink-0" aria-hidden />
              <div>
                <p className="text-sm font-medium text-green-800">Cuenta conectada</p>
                <p className="text-xs text-green-600 mt-0.5">Los pagos van a tu cuenta de Mercado Pago</p>
              </div>
            </div>
            <button type="button" onClick={() => setConfirmDisconnect(true)} disabled={saving}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-red-400 hover:text-red-600 disabled:opacity-40 shrink-0 transition-colors">
              <Trash2 size={13} aria-hidden />Desconectar
            </button>
          </div>

          {/* Acordeón reemplazar */}
          <div className="rounded-2xl border border-gray-100 bg-white overflow-hidden shadow-sm">
            <button type="button" onClick={() => setReplaceOpen(v => !v)}
              className="w-full flex items-center justify-between gap-2 px-5 py-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
              <span>Reemplazar token</span>
              <ChevronDown size={15} className={`text-gray-400 transition-transform duration-200 ${replaceOpen ? 'rotate-180' : ''}`} aria-hidden />
            </button>
            {replaceOpen && (
              <div className="px-5 pb-5 pt-4 space-y-3 border-t border-gray-100">
                <TokenInput value={tokenDraft} onChange={v => { setTokenDraft(v); setTokenError('') }}
                  show={showToken} onToggleShow={() => setShowToken(v => !v)} error={tokenError} />
                <button type="button" onClick={() => void handleSaveToken()} disabled={saving || !tokenDraft.trim()}
                  className="w-full rounded-full bg-gray-900 text-white text-sm font-semibold py-3 hover:bg-gray-800 disabled:opacity-40 disabled:pointer-events-none transition-colors">
                  {saving ? 'Guardando…' : 'Reemplazar token'}
                </button>
                <p className="text-xs text-gray-400 leading-relaxed">El token se guarda de forma segura y nunca se muestra nuevamente.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        <MpStepper
          tokenDraft={tokenDraft} tokenError={tokenError} showToken={showToken} saving={saving} justConnected={justConnected}
          onTokenChange={v => { setTokenDraft(v); setTokenError('') }}
          onToggleShow={() => setShowToken(v => !v)}
          onSave={() => void handleSaveToken()}
        />
      )}

      {/* Modal desconexión */}
      <Modal isOpen={confirmDisconnect} onClose={() => setConfirmDisconnect(false)} title="¿Desconectar Mercado Pago?">
        <p className="text-sm text-gray-600 leading-relaxed mb-6">
          Si desconectás la cuenta, los pagos online del evento dejarán de procesarse hasta que conectes un nuevo token. Esta acción no afecta los pedidos ya cobrados.
        </p>
        <div className="flex flex-col-reverse sm:flex-row gap-3">
          <button type="button" onClick={() => setConfirmDisconnect(false)}
            className="flex-1 rounded-full border border-gray-200 text-sm font-medium py-3 text-gray-700 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button type="button" onClick={() => void handleRemoveToken()}
            className="flex-1 rounded-full bg-red-500 text-white text-sm font-semibold py-3 hover:bg-red-600 transition-colors">
            Desconectar
          </button>
        </div>
      </Modal>
    </div>
  )
}

// ── TokenInput ─────────────────────────────────────────────────────────────

function CopyNubapayButton() {
  const [copied, setCopied] = useState(false)
  return (
    <button
      type="button"
      onClick={() => {
        void navigator.clipboard.writeText('Nubapay')
        setCopied(true)
        setTimeout(() => setCopied(false), 1500)
      }}
      title="Copiar"
      className="inline-flex items-center justify-center rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-700"
    >
      {copied
        ? <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><path d="M2 7l3.5 3.5L12 3" stroke="#22c55e" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/></svg>
        : <svg width="13" height="13" viewBox="0 0 14 14" fill="none"><rect x="4" y="4" width="8" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.3"/><path d="M2 10V2.5A.5.5 0 012.5 2H10" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/></svg>
      }
    </button>
  )
}

function TokenInput({ value, onChange, show, onToggleShow, error }: {
  value: string; onChange: (v: string) => void
  show: boolean; onToggleShow: () => void; error?: string
}) {
  return (
    <div className="space-y-1.5">
      <div className="relative">
        <input
          className={`${monoInputClass} ${error ? 'border-red-300 focus:ring-red-400' : ''}`}
          style={{ paddingRight: '42px' }}
          type={show ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="APP_USR-..."
          autoComplete="off"
        />
        <button type="button" onClick={onToggleShow} tabIndex={-1}
          aria-label={show ? 'Ocultar token' : 'Mostrar token'}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
          {show ? <EyeOff size={16} aria-hidden /> : <Eye size={16} aria-hidden />}
        </button>
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
}
