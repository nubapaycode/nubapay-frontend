'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, CreditCard, LayoutDashboard, ListChecks, MapPin, Maximize2, ReceiptText, Users, X } from 'lucide-react'

import { gsap, MOTION_OK, ScrollTrigger, useGSAP } from './gsap'
import { lockScroll } from './hooks'

/** Capturas reales del panel del organizador (modo mock, 2880×1800). */
const SHOTS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, path: 'dashboard', title: 'Métricas en vivo', text: 'Recaudación, pedidos por estado, métodos de pago y ventas por hora, actualizados mientras pasa el evento.' },
  { id: 'pedidos', label: 'Pedidos', icon: ReceiptText, path: 'orders', title: 'Todos los pedidos', text: 'Cada pedido con sus productos, total y estado de pago y entrega. La lista se actualiza sola.' },
  { id: 'catalogo', label: 'Catálogo', icon: ListChecks, path: 'products', title: 'Catálogo y stock', text: 'Productos con foto, precio y categoría. Activá o pausá cada uno con un toque y armá combos.' },
  { id: 'puntos-retiro', label: 'Puntos de retiro', icon: MapPin, path: 'pickup-points', title: 'Puntos de retiro', text: 'Cada barra o sector con los productos que entrega. Activalos o pausalos según el momento del evento.' },
  { id: 'pagos', label: 'Pagos', icon: CreditCard, path: 'payments', title: 'Pagos y conciliación', text: 'Cada cobro con su proveedor, canal, estado y monto. Filtrá por estado, canal o fecha.' },
  { id: 'equipo', label: 'Equipo', icon: Users, path: 'staff', title: 'Equipo y permisos', text: 'Invitá a tu staff por email y elegí qué herramientas usa cada uno: barras, caja, catálogo o retiro con QR.' },
] as const

const AUTOPLAY_SECONDS = 6
const src = (id: string) => `/images/landing-v2/panel-${id}.webp`
const thumb = (id: string) => `/images/landing-v2/panel-${id}-thumb.webp`

/* ───────── Visor a pantalla completa ───────── */

function Lightbox({ index, onClose, onNav }: { index: number; onClose: () => void; onNav: (dir: 1 | -1) => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  const shot = SHOTS[index]

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    closeRef.current?.focus()
    lockScroll(true)
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      else if (e.key === 'ArrowRight') onNav(1)
      else if (e.key === 'ArrowLeft') onNav(-1)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      window.removeEventListener('keydown', onKey)
      lockScroll(false)
      prev?.focus()
    }
  }, [onClose, onNav])

  return (
    <div className="lv2-lb" role="dialog" aria-modal="true" aria-label={`Captura: ${shot.label}`} data-lenis-prevent onClick={onClose}>
      <div className="lv2-lb-top" onClick={e => e.stopPropagation()}>
        <span>{shot.label} <small>{index + 1} / {SHOTS.length}</small></span>
        <button ref={closeRef} type="button" className="lv2-lb-btn" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
      </div>
      <figure className="lv2-lb-fig" onClick={e => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={shot.id} src={src(shot.id)} alt={`Panel de Nubapay: ${shot.title}`} width={2880} height={1800} />
        <figcaption>{shot.text}</figcaption>
      </figure>
      <button type="button" className="lv2-lb-btn lv2-lb-prev" onClick={e => { e.stopPropagation(); onNav(-1) }} aria-label="Anterior"><ChevronLeft size={22} /></button>
      <button type="button" className="lv2-lb-btn lv2-lb-next" onClick={e => { e.stopPropagation(); onNav(1) }} aria-label="Siguiente"><ChevronRight size={22} /></button>
    </div>
  )
}

/* ───────── Galería ───────── */

export default function PanelGallery() {
  const [active, setActive] = useState(0)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const sectionRef = useRef<HTMLElement>(null)
  const progressTween = useRef<gsap.core.Tween | null>(null)
  const inView = useRef(false)
  const hovering = useRef(false)

  const syncPlayback = () => {
    const t = progressTween.current
    if (!t) return
    if (inView.current && !hovering.current && lightbox === null) t.play()
    else t.pause()
  }

  /* Autoplay: la barra de la tarjeta activa se llena y pasa a la siguiente.
     Sólo corre con la sección en pantalla y sin el mouse encima. */
  useGSAP(() => {
    const mm = gsap.matchMedia()
    mm.add(MOTION_OK, () => {
      const bar = sectionRef.current?.querySelector<HTMLElement>(`[data-bar="${active}"]`)
      if (!bar) return
      progressTween.current = gsap.fromTo(bar, { scaleX: 0 }, {
        scaleX: 1, duration: AUTOPLAY_SECONDS, ease: 'none', paused: true,
        onComplete: () => setActive(i => (i + 1) % SHOTS.length),
      })
      syncPlayback()
      return () => { progressTween.current = null }
    })
  }, { scope: sectionRef, dependencies: [active], revertOnUpdate: true })

  useGSAP(() => {
    ScrollTrigger.create({
      trigger: sectionRef.current,
      start: 'top 75%',
      end: 'bottom 25%',
      onToggle: self => { inView.current = self.isActive; syncPlayback() },
    })
  }, { scope: sectionRef })

  useEffect(syncPlayback)

  /* En mobile el riel es un carrusel horizontal: lo desplazamos hasta la tarjeta activa
     (sólo en horizontal, sin mover la página). */
  const railRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const rail = railRef.current
    const card = rail?.children[active] as HTMLElement | undefined
    if (!rail || !card || rail.scrollWidth <= rail.clientWidth) return
    rail.scrollTo({ left: card.offsetLeft - 20, behavior: 'smooth' })
  }, [active])

  const nav = useCallback((dir: 1 | -1) => {
    setLightbox(i => (i === null ? i : (i + dir + SHOTS.length) % SHOTS.length))
  }, [])
  const close = useCallback(() => setLightbox(null), [])

  const shot = SHOTS[active]

  return (
    <section ref={sectionRef} id="galeria" className="lv2-section" aria-labelledby="lv2-gal-h">
      <div className="lv2-wrap">
        <div className="lv2-reveal lv2-head">
          <div>
            <h2 id="lv2-gal-h" className="lv2-h2">Mirá el panel<br /><span className="lv2-mark">por dentro.</span></h2>
          </div>
          <p className="lv2-lead">Capturas reales de las herramientas que usás durante el evento. Tocá cualquiera para verla en grande.</p>
        </div>

        <div
          className="lv2-reveal lv2-gal"
          onPointerEnter={() => { hovering.current = true; syncPlayback() }}
          onPointerLeave={() => { hovering.current = false; syncPlayback() }}
        >
          {/* Ventana de navegador con la captura activa */}
          <div className="lv2-gal-window">
            <div className="lv2-gal-bar" aria-hidden="true">
              <span className="lv2-gal-dots"><i /><i /><i /></span>
              <span className="lv2-gal-url">nubapay.app/events/demo-fest/<b>{shot.path}</b></span>
              <span />
            </div>
            <button type="button" className="lv2-gal-stage" onClick={() => setLightbox(active)} aria-label={`Ver en grande: ${shot.label}`}>
              {SHOTS.map((s, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={s.id}
                  src={src(s.id)}
                  alt={i === active ? `Panel de Nubapay: ${s.title}` : ''}
                  width={2880}
                  height={1800}
                  loading="lazy"
                  decoding="async"
                  className={i === active ? 'is-on' : ''}
                />
              ))}
              <span className="lv2-gal-zoom" aria-hidden="true"><Maximize2 size={16} /> Ver en grande</span>
            </button>
          </div>

          {/* Riel de miniaturas: funcionan como pestañas */}
          <div ref={railRef} className="lv2-gal-rail" role="tablist" aria-label="Herramientas del panel" aria-orientation="vertical">
            {SHOTS.map((s, i) => {
              const Icon = s.icon
              return (
                <button
                  key={s.id}
                  type="button"
                  role="tab"
                  aria-selected={i === active}
                  className={`lv2-gal-thumb${i === active ? ' is-on' : ''}`}
                  onClick={() => setActive(i)}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={thumb(s.id)} alt="" width={720} height={450} loading="lazy" decoding="async" />
                  <span className="lv2-gal-thumb-body">
                    <span className="lv2-gal-thumb-label"><Icon size={14} /> {s.label}</span>
                    <span className="lv2-gal-thumb-text">{s.text}</span>
                  </span>
                  <span className="lv2-gal-progress" aria-hidden="true"><i data-bar={i} /></span>
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {lightbox !== null && <Lightbox index={lightbox} onClose={close} onNav={nav} />}
    </section>
  )
}
