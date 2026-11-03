'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import {
  ArrowRight, ArrowUpRight, Check, CreditCard, KeyRound, MessageCircle, Plus, Search, ShieldCheck,
  ShoppingBag, Ticket, Users, X,
} from 'lucide-react'

import { browserFetch } from '@/lib/browserFetch'
import { HELP_TOPICS, SECURITY_EMAIL, SUPPORT_EMAIL, type HelpTopicId } from '@/lib/help/helpContent'

import { Reveal } from './hooks'
import PageHero from './PageHero'
import SiteShell from './SiteShell'
import './help.css'

const FORMSPREE_ID =
  process.env.NEXT_PUBLIC_FORMSPREE_CONTACT_FORM_ID || process.env.NEXT_PUBLIC_FORMSPREE_FORM_ID || 'mdeoggby'
const FORMSPREE_ENDPOINT = `https://formspree.io/f/${FORMSPREE_ID}`
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

const TOPIC_ICONS: Record<HelpTopicId, React.ReactNode> = {
  compras: <ShoppingBag size={18} />,
  entradas: <Ticket size={18} />,
  organizadores: <Users size={18} />,
  cobros: <CreditCard size={18} />,
  cuenta: <KeyRound size={18} />,
}

const PATHS: { href: string; icon: React.ReactNode; title: string; text: string }[] = [
  { href: '#compras', icon: <ShoppingBag size={20} />, title: 'Hice una compra', text: 'Tu QR, pagos que no aparecen, retiros y reembolsos.' },
  { href: '#entradas', icon: <Ticket size={20} />, title: 'Tengo una entrada', text: 'Cómo entrar, QR ya usado y transferir tu entrada.' },
  { href: '#organizadores', icon: <Users size={20} />, title: 'Organizo un evento', text: 'Empezar, armar el catálogo, sumar al equipo y cobrar.' },
  { href: '#contacto', icon: <MessageCircle size={20} />, title: 'Hablar con alguien', text: 'Escribinos y te respondemos en menos de 24 h hábiles.' },
]

const ROLES = [
  { id: 'comprador', label: 'Compré algo' },
  { id: 'organizador', label: 'Organizo eventos' },
  { id: 'otro', label: 'Otra cosa' },
] as const
type Role = (typeof ROLES)[number]['id']

const REASONS: Record<Role, string[]> = {
  comprador: ['Mi pedido o mi QR', 'Un pago', 'Un reembolso', 'Una entrada', 'Otro'],
  organizador: ['Quiero empezar a usar Nubapay', 'Un problema en mi evento', 'Pagos y cobros', 'Mi cuenta o mi equipo', 'Otro'],
  otro: ['Prensa o alianzas', 'Seguridad', 'Otro'],
}

const normalize = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

/** Preguntas que coinciden con la búsqueda (sin tildes ni mayúsculas), con su sección. */
function searchFaqs(query: string) {
  const q = normalize(query.trim())
  if (!q) return []
  return HELP_TOPICS.flatMap(t =>
    t.faqs
      .map((f, i) => ({ ...f, key: `${t.id}-${i}`, topic: t.label }))
      .filter(f => normalize(`${f.q} ${f.a}`).includes(q)),
  )
}

/* ───────── Buscador (va en el hero) ───────── */

function HelpSearch({ value, onChange, count }: { value: string; onChange: (v: string) => void; count: number }) {
  return (
    <div className="lv2-help-search-wrap">
    <div className="lv2-help-search" role="search">
      <Search size={18} aria-hidden="true" />
      <input
        type="search"
        value={value}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Escape') onChange('') }}
        placeholder="Buscá: QR, reembolso, contraseña…"
        aria-label="Buscar en las preguntas frecuentes"
        aria-controls="lv2-help-faq"
      />
      {value && (
        <button type="button" onClick={() => onChange('')} aria-label="Borrar búsqueda">
          <X size={15} />
        </button>
      )}
    </div>
      {/* No se salta solo a las respuestas: el campo quedaría fuera de vista mientras se escribe. */}
      <p className="lv2-help-search-hint" aria-live="polite">
        {value.trim() ? (
          count > 0 ? (
            <a href="#lv2-help-faq">Ver {count} {count === 1 ? 'respuesta' : 'respuestas'} <ArrowRight size={14} aria-hidden="true" /></a>
          ) : (
            <>Sin resultados. <a href="#contacto">Escribinos</a></>
          )
        ) : (
          'Las respuestas se filtran mientras escribís.'
        )}
      </p>
    </div>
  )
}

/* ───────── Accesos rápidos ───────── */

function Paths() {
  return (
    <section className="lv2-section lv2-help-paths-sec" aria-label="Por dónde empezar">
      <div className="lv2-wrap">
        <Reveal className="lv2-help-paths">
          {PATHS.map(p => (
            <a key={p.href} href={p.href} className="lv2-help-path">
              <span className="lv2-help-path-ico" aria-hidden="true">{p.icon}</span>
              <span className="lv2-help-path-title">{p.title}</span>
              <span className="lv2-help-path-text">{p.text}</span>
              <span className="lv2-help-path-go" aria-hidden="true"><ArrowRight size={16} /></span>
            </a>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

/* ───────── Preguntas frecuentes ───────── */

function FaqItem({ id, q, a, open, onToggle, topic }: {
  id: string; q: string; a: string; open: boolean; onToggle: () => void; topic?: string
}) {
  return (
    <div className={`lv2-faq-item${open ? ' is-open' : ''}`}>
      <h4 style={{ margin: 0 }}>
        <button type="button" className="lv2-faq-q" aria-expanded={open} aria-controls={`${id}-a`} onClick={onToggle}>
          <span>
            {topic && <small className="lv2-help-q-topic">{topic}</small>}
            {q}
          </span>
          <span className="lv2-faq-plus" aria-hidden="true"><Plus size={16} /></span>
        </button>
      </h4>
      <div id={`${id}-a`} className="lv2-faq-a" role="region"><div><p>{a}</p></div></div>
    </div>
  )
}

function Faqs({ query, onClearQuery }: { query: string; onClearQuery: () => void }) {
  const [open, setOpen] = useState<string | null>('compras-0')
  const q = query.trim()
  const results = useMemo(() => searchFaqs(query), [query])

  return (
    <section id="lv2-help-faq" className="lv2-section" aria-labelledby="lv2-help-faq-h">
      <div className="lv2-wrap lv2-faq lv2-help-faq">
        <Reveal className="lv2-faq-side">
          <h2 id="lv2-help-faq-h" className="lv2-h2">Preguntas<br />frecuentes.</h2>
          <nav className="lv2-help-index" aria-label="Secciones de ayuda">
            {HELP_TOPICS.map(t => (
              <a key={t.id} href={`#${t.id}`} onClick={onClearQuery}>
                <span aria-hidden="true">{TOPIC_ICONS[t.id]}</span>
                {t.label}
                <small>{t.faqs.length}</small>
              </a>
            ))}
          </nav>
        </Reveal>

        <Reveal d={0.1}>
          {q ? (
            <div aria-live="polite">
              <p className="lv2-help-count">
                {results.length === 0
                  ? 'No encontramos nada con esa búsqueda.'
                  : `${results.length} ${results.length === 1 ? 'respuesta' : 'respuestas'} para “${query.trim()}”`}
              </p>
              {results.length === 0 ? (
                <div className="lv2-help-empty">
                  <p>Probá con otra palabra o escribinos y te respondemos nosotros.</p>
                  <a href="#contacto" className="lv2-btn">
                    Escribinos
                    <span className="lv2-btn-arrow"><ArrowRight size={18} strokeWidth={1.6} /></span>
                  </a>
                </div>
              ) : (
                results.map(f => (
                  <FaqItem
                    key={f.key}
                    id={`lv2-help-${f.key}`}
                    q={f.q}
                    a={f.a}
                    topic={f.topic}
                    open={open === f.key}
                    onToggle={() => setOpen(open === f.key ? null : f.key)}
                  />
                ))
              )}
            </div>
          ) : (
            HELP_TOPICS.map(t => (
              <div key={t.id} id={t.id} className="lv2-help-topic">
                <header className="lv2-help-topic-head">
                  <span className="lv2-help-topic-ico" aria-hidden="true">{TOPIC_ICONS[t.id]}</span>
                  <div>
                    <h3>{t.label}</h3>
                    <p>{t.blurb}</p>
                  </div>
                </header>
                {t.faqs.map((f, i) => {
                  const key = `${t.id}-${i}`
                  return (
                    <FaqItem
                      key={key}
                      id={`lv2-help-${key}`}
                      q={f.q}
                      a={f.a}
                      open={open === key}
                      onToggle={() => setOpen(open === key ? null : key)}
                    />
                  )
                })}
              </div>
            ))
          )}
        </Reveal>
      </div>
    </section>
  )
}

/* ───────── Más recursos ───────── */

function Resources() {
  const items = [
    { href: '/seguridad', icon: <ShieldCheck size={20} />, title: 'Seguridad', text: 'Cómo protegemos cada pedido, pago y retiro.' },
    { href: '/terminos', icon: <ArrowUpRight size={20} />, title: 'Términos y privacidad', text: 'Las reglas de uso y cómo tratamos tus datos.' },
  ]
  return (
    <section className="lv2-section" aria-labelledby="lv2-help-res-h">
      <div className="lv2-wrap">
        <Reveal>
          <h2 id="lv2-help-res-h" className="lv2-help-res-h">Más recursos</h2>
        </Reveal>
        <Reveal d={0.05} className="lv2-help-res">
          {items.map(it => (
            <Link key={it.href} href={it.href} className="lv2-help-res-card">
              <span className="lv2-card-ico" aria-hidden="true">{it.icon}</span>
              <span>
                <strong>{it.title}</strong>
                <span>{it.text}</span>
              </span>
              <ArrowUpRight size={18} className="lv2-help-res-go" aria-hidden="true" />
            </Link>
          ))}
        </Reveal>
      </div>
    </section>
  )
}

/* ───────── Formulario ───────── */

function ContactForm() {
  const [role, setRole] = useState<Role>('comprador')
  const [reason, setReason] = useState(REASONS.comprador[0])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [eventName, setEventName] = useState('')
  const [orderRef, setOrderRef] = useState('')
  const [message, setMessage] = useState('')
  const [gotcha, setGotcha] = useState('')
  const [error, setError] = useState('')
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle')

  const pickRole = (r: Role) => {
    setRole(r)
    setReason(REASONS[r][0])
  }

  const reset = () => {
    setName(''); setEmail(''); setEventName(''); setOrderRef(''); setMessage(''); setStatus('idle')
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (name.trim().length < 2) { setError('Ingresá tu nombre.'); return }
    if (!EMAIL_RE.test(email.trim())) { setError('Revisá el email: falta el @ o el dominio.'); return }
    if (message.trim().length < 10) { setError('Contanos un poco más: al menos 10 caracteres.'); return }
    setStatus('sending')
    try {
      const res = await browserFetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          nombre: name.trim(),
          email: email.trim(),
          perfil: ROLES.find(r => r.id === role)?.label,
          motivo: reason,
          evento: eventName.trim() || undefined,
          pedido: orderRef.trim() || undefined,
          mensaje: message.trim(),
          origen: 'Centro de ayuda',
          _subject: `Ayuda · ${reason}: ${name.trim()}`,
          _gotcha: gotcha,
        }),
      })
      if (res.ok) { setStatus('sent'); return }
      const body = (await res.json().catch(() => null)) as { errors?: { message?: string }[] } | null
      setError(body?.errors?.[0]?.message ?? 'No pudimos enviar tu mensaje. Probá de nuevo.')
    } catch {
      setError('No se pudo contactar al servidor. Revisá tu conexión.')
    }
    setStatus('idle')
  }

  return (
    <section id="contacto" className="lv2-section" aria-labelledby="lv2-help-contact-h">
      <div className="lv2-wrap">
        <Reveal className="lv2-contact lv2-help-contact">
          <div>
            <h2 id="lv2-help-contact-h" className="lv2-h2">¿No encontraste<br />tu respuesta?</h2>
            <p className="lv2-lead">Escribinos y te respondemos en menos de 24 horas hábiles. Si es por un pedido, sumá el evento y el número: así lo encontramos más rápido.</p>
            <ul className="lv2-topics">
              <li><span><strong>Durante un evento.</strong> Si estás en el lugar, el staff del evento es lo más rápido.</span></li>
              <li><span><strong>Reembolsos.</strong> Los resuelve el organizador; te ayudamos a contactarlo.</span></li>
              <li><span><strong>Seguridad.</strong> Reportes a <a href={`mailto:${SECURITY_EMAIL}`}>{SECURITY_EMAIL}</a>.</span></li>
            </ul>
            <p className="lv2-mail">¿Preferís el mail? <a href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent('Ayuda con Nubapay')}`}>{SUPPORT_EMAIL}</a></p>
          </div>

          {status === 'sent' ? (
            <div className="lv2-sent" role="status">
              <i><Check size={30} /></i>
              <h3>¡Mensaje enviado!</h3>
              <p>Te respondemos a {email.trim()} lo antes posible.</p>
              <button type="button" onClick={reset}>Enviar otro mensaje</button>
            </div>
          ) : (
            <form className="lv2-form" onSubmit={submit} noValidate>
              <fieldset className="lv2-help-roles">
                <legend>¿Sobre qué es?</legend>
                <div>
                  {ROLES.map(r => (
                    <label key={r.id} className={role === r.id ? 'is-on' : ''}>
                      <input type="radio" name="perfil" value={r.id} checked={role === r.id} onChange={() => pickRole(r.id)} />
                      {r.label}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="lv2-field">
                <label htmlFor="lv2-help-reason">Motivo</label>
                <select id="lv2-help-reason" className="lv2-input lv2-help-select" value={reason} onChange={e => setReason(e.target.value)}>
                  {REASONS[role].map(r => <option key={r}>{r}</option>)}
                </select>
              </div>

              <div className="lv2-help-row">
                <div className="lv2-field">
                  <label htmlFor="lv2-help-name">Nombre</label>
                  <input id="lv2-help-name" className="lv2-input" type="text" autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Tu nombre" />
                </div>
                <div className="lv2-field">
                  <label htmlFor="lv2-help-email">Email</label>
                  <input id="lv2-help-email" className="lv2-input" type="email" autoComplete="email" inputMode="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="vos@ejemplo.com" />
                </div>
              </div>

              {role !== 'otro' && (
                <div className="lv2-help-row">
                  <div className="lv2-field">
                    <label htmlFor="lv2-help-event">Evento <small>(opcional)</small></label>
                    <input id="lv2-help-event" className="lv2-input" type="text" value={eventName} onChange={e => setEventName(e.target.value)} placeholder="Nombre del evento" />
                  </div>
                  {role === 'comprador' && (
                    <div className="lv2-field">
                      <label htmlFor="lv2-help-order">N.º de pedido <small>(opcional)</small></label>
                      <input id="lv2-help-order" className="lv2-input" type="text" inputMode="numeric" value={orderRef} onChange={e => setOrderRef(e.target.value)} placeholder="Ej. 20498" />
                    </div>
                  )}
                </div>
              )}

              <div className="lv2-field">
                <label htmlFor="lv2-help-msg">Mensaje</label>
                <textarea id="lv2-help-msg" className="lv2-input" rows={5} value={message} onChange={e => setMessage(e.target.value)} placeholder="Contanos qué pasó y cómo te podemos ayudar…" />
              </div>
              <input className="lv2-hp" type="text" name="_gotcha" tabIndex={-1} autoComplete="off" aria-hidden="true" value={gotcha} onChange={e => setGotcha(e.target.value)} />
              {error && <p className="lv2-form-err" role="alert">{error}</p>}
              <button type="submit" className="lv2-btn" disabled={status === 'sending'}>
                {status === 'sending' ? 'Enviando…' : 'Enviar mensaje'}
                <span className="lv2-btn-arrow"><ArrowRight size={18} strokeWidth={1.6} /></span>
              </button>
            </form>
          )}
        </Reveal>
      </div>
    </section>
  )
}

/* ───────── Página ───────── */

export default function HelpPage() {
  const [query, setQuery] = useState('')
  const count = useMemo(() => searchFaqs(query).length, [query])

  return (
    <SiteShell>
      <main>
        <PageHero
          id="lv2-help-h"
          lines={['¿En qué te', <span key="m" className="lv2-mark lv2-mark--now">ayudamos?</span>]}
          intro={<>Respuestas para quienes <strong>compran</strong> en un evento y para quienes lo <strong>organizan</strong>. Y si no está acá, escribinos.</>}
        >
          <HelpSearch value={query} onChange={setQuery} count={count} />
        </PageHero>
        <Paths />
        <Faqs query={query} onClearQuery={() => setQuery('')} />
        <Resources />
        <ContactForm />
      </main>
    </SiteShell>
  )
}
