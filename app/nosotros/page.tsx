import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import SiteNavbar from '@/components/SiteNavbar'
import SiteFooter from '@/components/SiteFooter'
import ScrollReveal from '@/components/ScrollReveal'
import { breadcrumbJsonLd } from '@/lib/seo'

export const metadata: Metadata = {
  title: 'Nosotros — Nubapay',
  description: 'Conocé al equipo detrás de Nubapay y la historia de cómo nació la plataforma para eventos masivos.',
  alternates: { canonical: 'https://nubapay.app/nosotros' },
  openGraph: {
    title: 'Nosotros — Nubapay',
    description: 'Conocé al equipo detrás de Nubapay y la historia de cómo nació la plataforma para eventos masivos.',
    images: [{ url: '/images/og.png', width: 1200, height: 630, alt: 'Nubapay — El equipo' }],
  },
}

export default function NosotrosPage() {
  const font = "var(--font-dm-sans, 'DM Sans', sans-serif)"

  const founders = [
    {
      name: 'Ángel Vaquero',
      role: 'Chief Executive Officer',
      short: 'CEO',
      bio: 'Lidera la estrategia, la visión comercial y el crecimiento de Nubapay. Con foco en construir relaciones con organizadores, partners y el ecosistema de eventos masivos en Latinoamérica.',
      initial: 'AV',
      photo: '/images/angelito.jpeg',
      linkedin: 'https://linkedin.com/in/angel-vaquero-7592a8194',
      email: 'contacto@nubapay.app',
    },
    {
      name: 'Facundo Girardi',
      role: 'Chief Technology Officer',
      short: 'CTO',
      bio: 'Lidera el desarrollo tecnológico, la arquitectura del sistema y la escalabilidad de la plataforma. Responsable de las decisiones técnicas que sostienen cada pedido, pago y retiro en tiempo real.',
      initial: 'FG',
      photo: '/images/facu.png',
      linkedin: 'https://linkedin.com/in/facugirardi',
      email: 'contacto@nubapay.app',
    },
    {
      name: 'Alejo Vaquero',
      role: 'Chief Product Officer',
      short: 'CPO',
      bio: 'Lidera el producto, la experiencia de usuario, la definición funcional y la evolución de la plataforma. Traduce los problemas reales de asistentes y organizadores en decisiones de diseño y producto.',
      initial: 'AV',
      photo: '/images/alejo.jpeg',
      linkedin: 'https://linkedin.com/in/alejovaquero',
      email: 'contacto@nubapay.app',
    },
  ]

  const principles = [
    {
      num: '01',
      title: 'Simplicidad ante todo',
      desc: 'Cada decisión parte de la misma pregunta: ¿es más fácil para quien lo usa? Si no lo es, volvemos a empezar.',
    },
    {
      num: '02',
      title: 'Tecnología con propósito',
      desc: 'Usamos tecnología porque resuelve problemas reales, no para seguir tendencias.',
    },
    {
      num: '03',
      title: 'Operación sin fricción',
      desc: 'El tiempo perdido en una fila es tiempo que el asistente no disfruta y el organizador no vende. Eso es lo que eliminamos.',
    },
    {
      num: '04',
      title: 'Confianza en cada retiro',
      desc: 'Cada QR de retiro es único y de un solo uso. El asistente sabe que lo suyo es suyo.',
    },
  ]

  return (
    <div style={{ fontFamily: font, background: '#FFFFFF', minHeight: '100vh', color: '#0A0A0F' }}>
      <script type="application/ld+json">{breadcrumbJsonLd([{ name: 'Nosotros', path: '/nosotros' }])}</script>
      <style>{`
        /* ── Animaciones de carga (hero) ── */
        @keyframes nos-fade-up {
          from { opacity: 0; transform: translateY(28px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes nos-fade-in {
          from { opacity: 0; }
          to   { opacity: 1; }
        }

        /* Líneas del headline — clip reveal */
        .nos-line-wrap { display: block; overflow: hidden; padding-bottom: 0.18em; margin-bottom: -0.18em; }
        .nos-line-inner { display: block; animation: nos-fade-up 0.9s cubic-bezier(0.16,1,0.3,1) both; }
        .nos-line-1 .nos-line-inner { animation-delay: 0.05s; }
        .nos-line-2 .nos-line-inner { animation-delay: 0.18s; }
        .nos-line-3 .nos-line-inner { animation-delay: 0.30s; }

        /* Subtexto y stats del hero */
        .nos-hero-text { animation: nos-fade-up 0.8s cubic-bezier(0.16,1,0.3,1) 0.42s both; }
        .nos-stat-item { animation: nos-fade-up 0.7s cubic-bezier(0.16,1,0.3,1) both; }
        .nos-stat-1 { animation-delay: 0.55s; }
        .nos-stat-2 { animation-delay: 0.65s; }
        .nos-stat-3 { animation-delay: 0.75s; }

        /* ── Scroll reveal ── */
        .sr-base { opacity: 0; transform: translateY(32px); transition: opacity 0.75s cubic-bezier(0.16,1,0.3,1), transform 0.75s cubic-bezier(0.16,1,0.3,1); }
        .sr-visible { opacity: 1; transform: translateY(0); }

        /* ── Hover zoom + color en foto de fundador ── */
        .nos-photo-wrap { overflow: hidden; }
        .nos-photo-wrap img { transition: transform 0.6s cubic-bezier(0.16,1,0.3,1), filter 0.5s ease !important; filter: grayscale(100%) !important; }
        .nos-photo-wrap:hover img { transform: scale(1.05) !important; filter: grayscale(0%) !important; }

        /* ── Otros ── */
        .nos-founder-card { border-top: 1px solid rgba(0,0,0,0.1); padding: 40px 0; transition: none; }
        .nos-social-btn { display: inline-flex; align-items: center; justify-content: center; width: 36px; height: 36px; border-radius: 10px; background: #F4F4F6; border: none; transition: background 0.15s; }
        .nos-social-btn:hover { background: #EAEAEC; }
        .nos-social-btn.nos-linkedin:hover { background: #0A66C2; }
        .nos-social-btn.nos-linkedin svg path { transition: fill 0.15s; }
        .nos-social-btn.nos-linkedin:hover svg path { fill: #fff; }
        .nos-principle { border-top: 1px solid rgba(0,0,0,0.08); padding: 32px 0; display: grid; grid-template-columns: 64px 1fr 2fr; gap: 32px; align-items: start; }
        .nos-principle:last-child { border-bottom: 1px solid rgba(0,0,0,0.08); }

        /* ── Responsive: Stats strip ── */
        .nos-stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); }
        .nos-stat-border { border-left: 1px solid rgba(0,0,0,0.08); padding-left: 40px; }

        @media (max-width: 640px) {
          .nos-stats-grid { grid-template-columns: 1fr !important; }
          .nos-stat-border { border-left: none !important; padding-left: 0 !important; border-top: 1px solid rgba(0,0,0,0.08) !important; }
          .nos-stat-pad { padding: 28px 0 !important; }
        }

        /* ── Responsive: Qué hacemos ── */
        .nos-section-grid { display: grid; grid-template-columns: 240px 1fr; gap: 80px; align-items: start; }
        .nos-cards-grid   { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 32px; }

        @media (max-width: 768px) {
          .nos-section-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .nos-section-label { display: none; }
          .nos-cards-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .nos-que-hacemos { padding: 64px 24px !important; }
          .nos-principios { padding: 64px 24px !important; }
          .nos-principios-grid { grid-template-columns: 1fr !important; gap: 24px !important; }
          .nos-principle { grid-template-columns: 40px 1fr !important; gap: 16px !important; }
          .nos-principle-desc { grid-column: 2 !important; }
          .nos-donde { padding: 64px 24px !important; }
          .nos-donde-grid { grid-template-columns: 1fr !important; gap: 20px !important; }
          .nos-cta-wrap { padding: 24px 24px 48px !important; }
          .nos-cta-inner { padding: 48px 32px !important; border-radius: 20px !important; }
          .nos-cta-bottom { flex-direction: column !important; align-items: flex-start !important; gap: 24px !important; }
          .nos-cta-buttons { width: 100% !important; flex-direction: column !important; }
          .nos-cta-btn { width: 100% !important; justify-content: center !important; }
        }
        @media (max-width: 640px) {
          .nos-que-hacemos { padding: 48px 20px !important; }
          .nos-principios { padding: 48px 20px !important; }
          .nos-donde { padding: 48px 20px !important; }
          .nos-cta-wrap { padding: 16px 16px 40px !important; }
          .nos-cta-inner { padding: 40px 24px !important; }
        }
      `}</style>

      <SiteNavbar activePath="/nosotros" />

      {/* Hero */}
      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 48px 0' }}>

        {/* Headline — líneas con clip reveal */}
        <h1 style={{
          fontSize: 'clamp(52px, 8vw, 112px)',
          fontWeight: 800,
          color: '#0A0A0F',
          letterSpacing: '-0.05em',
          lineHeight: 0.95,
          margin: '0 0 80px',
          maxWidth: '900px',
        }}>
          <span className="nos-line-wrap nos-line-1"><span className="nos-line-inner">Terminamos con</span></span>
          <span className="nos-line-wrap nos-line-2"><span className="nos-line-inner">las cajas, de</span></span>
          <span className="nos-line-wrap nos-line-3"><span className="nos-line-inner" style={{ color: '#C6FF00', WebkitTextStroke: '2px #0A0A0F' }}>una vez por todas</span></span>
        </h1>

        {/* Misión */}
        <div className="nos-hero-text" style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingTop: '48px', paddingBottom: '64px' }}>
          <p style={{
            fontSize: 'clamp(20px, 2.2vw, 26px)',
            lineHeight: 1.5,
            color: 'rgba(0,0,0,0.5)',
            margin: 0,
            fontWeight: 500,
            letterSpacing: '-0.02em',
            maxWidth: '1000px',
          }}>
            <span style={{ color: '#0A0A0F' }}>Nubapay</span>{' '}nace para resolver uno de los mayores problemas de los{' '}<span style={{ color: '#0A0A0F' }}>eventos masivos</span>:{' '}<span style={{ color: '#0A0A0F' }}>las cajas</span>. Creamos una{' '}<span style={{ color: '#0A0A0F' }}>plataforma simple y escalable</span>{' '}que permite{' '}<span style={{ color: '#0A0A0F' }}>pedir</span>,{' '}<span style={{ color: '#0A0A0F' }}>pagar</span>{' '}y{' '}<span style={{ color: '#0A0A0F' }}>retirar productos desde el celular</span>, conectando{' '}<span style={{ color: '#0A0A0F' }}>asistentes</span>,{' '}<span style={{ color: '#0A0A0F' }}>barras</span>{' '}y{' '}<span style={{ color: '#0A0A0F' }}>organizadores</span>{' '}en un{' '}<span style={{ color: '#0A0A0F' }}>único sistema operativo</span>.
          </p>
        </div>

        {/* Stats strip */}
        <div className="nos-stats-grid" style={{ borderTop: '1px solid rgba(0,0,0,0.08)', paddingLeft: '40px' }}>
          {[
            { val: '+3.000', label: 'Eventos gestionados', cls: 'nos-stat-item nos-stat-1' },
            { val: '0', label: 'Apps que descargar', cls: 'nos-stat-item nos-stat-2' },
            { val: '+50K', label: 'Ventas realizadas activos', cls: 'nos-stat-item nos-stat-3' },
          ].map((s, i) => (
            <div key={s.label} className={`${s.cls} nos-stat-pad${i > 0 ? ' nos-stat-border' : ''}`} style={{
              paddingTop: '40px',
              paddingBottom: '56px',
              paddingRight: '0',
            }}>
              <div style={{ fontSize: 'clamp(40px, 5vw, 64px)', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.05em', lineHeight: 1, marginBottom: '8px' }}>
                {s.val}
              </div>
              <div style={{ fontSize: '12px', color: '#8B8B9A', fontWeight: 500 }}>{s.label}</div>
            </div>
          ))}
        </div>

      </div>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }} />

      {/* Qué hacemos */}
      <ScrollReveal>
      <div className="nos-que-hacemos" style={{ maxWidth: '1100px', margin: '0 auto', padding: '96px 48px' }}>
        <div className="nos-section-grid">
          <div className="nos-section-label">
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#8B8B9A', letterSpacing: '0.1em' }}>
              QUÉ HACEMOS
            </span>
          </div>
          <div>
            <p style={{
              fontSize: 'clamp(22px, 2.5vw, 30px)',
              fontWeight: 500,
              color: 'rgba(0,0,0,0.5)',
              lineHeight: 1.45,
              margin: '0 0 40px',
              letterSpacing: '-0.02em',
            }}>
              Construimos el{' '}<span style={{ color: '#0A0A0F' }}>sistema operativo</span>{' '}de los{' '}<span style={{ color: '#0A0A0F' }}>eventos masivos</span>. Desde el momento en que el{' '}<span style={{ color: '#0A0A0F' }}>asistente</span>{' '}<span style={{ color: '#0A0A0F' }}>escanea el QR</span>{' '}hasta que{' '}<span style={{ color: '#0A0A0F' }}>retira su pedido</span>{' '}<span style={{ color: '#0A0A0F' }}>sin hacer fila</span>,{' '}<span style={{ color: '#0A0A0F' }}>Nubapay</span>{' '}<span style={{ color: '#0A0A0F' }}>conecta</span>{' '}<span style={{ color: '#0A0A0F' }}>cada parte de la operación</span>.
            </p>
            <div className="nos-cards-grid">
              {[
                { title: 'Para asistentes', desc: 'Pedí, pagá y retirá desde el celular. Sin app, sin fila, sin efectivo.' },
                { title: 'Para organizadores', desc: 'Panel de control con ventas, pedidos y rendimiento en tiempo real.' },
                { title: 'Para el staff', desc: 'Escáner de QR, validación de retiro y gestión de pedidos desde cualquier dispositivo.' },
              ].map(item => (
                <div key={item.title}>
                  <div style={{ fontSize: '14px', fontWeight: 700, color: '#0A0A0F', marginBottom: '8px' }}>{item.title}</div>
                  <p style={{ fontSize: '14px', color: '#6B6B7A', lineHeight: 1.65, margin: 0 }}>{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      </ScrollReveal>

      {true && (
      <div id="equipo" style={{ background: '#FFFFFF', padding: '96px 48px' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>

          <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: '64px' }}>
            <h2 style={{
              fontSize: 'clamp(28px, 3.5vw, 48px)',
              fontWeight: 800, color: '#0A0A0F',
              letterSpacing: '-0.04em', lineHeight: 1, margin: 0,
            }}>
              El equipo
            </h2>
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#8B8B9A', letterSpacing: '0.1em' }}>
              FUNDADORES
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '40px' }}>
            {founders.map((f, i) => (
              <ScrollReveal key={f.name} delay={i * 120}>
                <div className="nos-photo-wrap" style={{
                  width: '100%',
                  aspectRatio: '3 / 4',
                  borderRadius: '16px',
                  background: '#F0F0F2',
                  position: 'relative',
                  marginBottom: '24px',
                }}>
                  <Image
                    src={f.photo}
                    alt={f.name}
                    fill
                    style={{ objectFit: 'cover', borderRadius: '16px' }}
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                </div>

                <div>
                  <div style={{
                    display: 'inline-flex', alignItems: 'center',
                    background: '#F0F0F2',
                    borderRadius: '6px', padding: '3px 10px',
                    fontSize: '10px', fontWeight: 700, color: '#3A3A4A',
                    letterSpacing: '0.08em', marginBottom: '12px',
                  }}>
                    {f.short}
                  </div>
                  <h3 style={{
                    fontSize: 'clamp(20px, 2vw, 28px)',
                    fontWeight: 800, color: '#0A0A0F',
                    letterSpacing: '-0.04em', lineHeight: 1.1,
                    margin: '0 0 4px',
                  }}>
                    {f.name}
                  </h3>
                  <p style={{
                    fontSize: '13px', color: '#8B8B9A',
                    fontWeight: 500, margin: '0 0 16px',
                  }}>
                    {f.role}
                  </p>
                  <p style={{
                    fontSize: '14px', color: '#4A4A5A',
                    lineHeight: 1.7, margin: '0 0 20px',
                  }}>
                    {f.bio}
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <a href={f.linkedin} target="_blank" rel="noopener noreferrer" className="nos-social-btn nos-linkedin" title="LinkedIn">
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M2.5 5.5h2.5v8H2.5v-8ZM3.75 4.5a1.25 1.25 0 1 1 0-2.5 1.25 1.25 0 0 1 0 2.5ZM6.5 5.5H9v1.1c.4-.7 1.3-1.3 2.5-1.3 2.2 0 3 1.5 3 3.5v4.7H12V9.2c0-1-.4-1.7-1.3-1.7-1 0-1.7.7-1.7 1.9v4.1H6.5v-8Z" fill="#3A3A4A"/>
                      </svg>
                    </a>
                    <a href={`mailto:${f.email}`} className="nos-social-btn" title={f.email}>
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <rect x="1.5" y="3.5" width="13" height="9" rx="1.5" stroke="#3A3A4A" strokeWidth="1.3"/>
                        <path d="M1.5 5.5l6.5 4 6.5-4" stroke="#3A3A4A" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </a>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>

        </div>
      </div>
      )}

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }} />

      {/* Principios */}
      <ScrollReveal>
      <div className="nos-principios" style={{ maxWidth: '1100px', margin: '0 auto', padding: '96px 48px' }}>
        <div className="nos-principios-grid" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '80px', alignItems: 'start' }}>
          <div style={{ paddingTop: '32px' }} className="nos-section-label">
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#8B8B9A', letterSpacing: '0.1em' }}>
              PRINCIPIOS
            </span>
          </div>
          <div>
            {principles.map(p => (
              <div key={p.num} className="nos-principle">
                <span style={{ fontSize: '12px', fontWeight: 700, color: '#BCBCC8', letterSpacing: '0.04em', paddingTop: '2px' }}>
                  {p.num}
                </span>
                <div style={{ fontSize: '16px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.02em', lineHeight: 1.3 }}>
                  {p.title}
                </div>
                <p className="nos-principle-desc" style={{ fontSize: '15px', color: '#6B6B7A', lineHeight: 1.65, margin: 0 }}>
                  {p.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
      </ScrollReveal>

      {/* Divider */}
      <div style={{ borderTop: '1px solid rgba(0,0,0,0.08)' }} />

      {/* Dónde operamos */}
      <ScrollReveal>
      <div className="nos-donde" style={{ maxWidth: '1100px', margin: '0 auto', padding: '80px 48px' }}>
        <div className="nos-donde-grid" style={{ display: 'grid', gridTemplateColumns: '240px 1fr', gap: '80px', alignItems: 'start' }}>
          <div style={{ paddingTop: '4px' }} className="nos-section-label">
            <span style={{ fontSize: '11px', fontWeight: 700, color: '#8B8B9A', letterSpacing: '0.1em' }}>
              DÓNDE OPERAMOS
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {['Boliches', 'Festivales', 'Fiestas', 'Recitales', 'Eventos privados', 'Ferias', 'Estadios', 'Eventos corporativos', 'Barras móviles', 'Food trucks'].map(type => (
              <div key={type} style={{
                padding: '8px 16px',
                background: '#F4F4F6',
                borderRadius: '100px',
                fontSize: '13px', fontWeight: 600, color: '#3A3A4A',
              }}>
                {type}
              </div>
            ))}
          </div>
        </div>
      </div>
      </ScrollReveal>

      {/* CTA dark */}
      <div className="nos-cta-wrap" style={{ padding: '48px 48px 64px' }}>
        <div className="nos-cta-inner" style={{ maxWidth: '1100px', margin: '0 auto', background: '#0A0A0F', borderRadius: '28px', padding: '72px 64px' }}>

          {/* Headline */}
          <h2 style={{
            fontSize: 'clamp(52px, 8vw, 108px)',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.05em',
            lineHeight: 0.95,
            margin: '0 0 56px',
            maxWidth: '820px',
          }}>
            Llevá Nubapay<br />
            <span style={{ color: '#C6FF00' }}>a tu evento</span>
          </h2>

          {/* Pills de features */}
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '56px' }}>
            {[
              {
                icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 1v8M4 6l3 3 3-3" stroke="#C6FF00" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/><path d="M2 11h10" stroke="#C6FF00" strokeWidth="1.4" strokeLinecap="round"/></svg>,
                text: 'Sin descarga',
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="5" height="5" rx="0.5" stroke="#C6FF00" strokeWidth="1.3"/><rect x="2.5" y="2.5" width="2" height="2" fill="#C6FF00"/><rect x="8" y="1" width="5" height="5" rx="0.5" stroke="#C6FF00" strokeWidth="1.3"/><rect x="9.5" y="2.5" width="2" height="2" fill="#C6FF00"/><rect x="1" y="8" width="5" height="5" rx="0.5" stroke="#C6FF00" strokeWidth="1.3"/><rect x="2.5" y="9.5" width="2" height="2" fill="#C6FF00"/><path d="M8 8h1.5M11.5 8H13M8 10h2M8 12h1.5M10.5 10h2.5M11.5 12H13" stroke="#C6FF00" strokeWidth="1.3" strokeLinecap="round"/></svg>,
                text: 'QR listo en minutos',
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="3" width="12" height="8" rx="1.5" stroke="#C6FF00" strokeWidth="1.3"/><path d="M1 6h12" stroke="#C6FF00" strokeWidth="1.3"/><path d="M4 9h2" stroke="#C6FF00" strokeWidth="1.5" strokeLinecap="round"/></svg>,
                text: 'Pagos desde el celular',
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="3" r="1.5" stroke="#C6FF00" strokeWidth="1.3"/><path d="M4.5 6.5C4.5 5.4 5.4 5 7 5s2.5.4 2.5 1.5V9H4.5V6.5z" stroke="#C6FF00" strokeWidth="1.3" strokeLinejoin="round"/><path d="M4.5 9l-.5 3M9.5 9l.5 3" stroke="#C6FF00" strokeWidth="1.3" strokeLinecap="round"/><path d="M11 5l1.5 1.5M11 8h1.5" stroke="#C6FF00" strokeWidth="1.3" strokeLinecap="round"/></svg>,
                text: 'Retiro sin fila',
              },
            ].map(item => (
              <div key={item.text} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.08)',
                borderRadius: '100px',
                padding: '10px 18px',
                fontSize: '13px', fontWeight: 600,
                color: 'rgba(255,255,255,0.7)',
              }}>
                {item.icon}
                {item.text}
              </div>
            ))}
          </div>

          {/* Divider + acción */}
          <div className="nos-cta-bottom" style={{
            borderTop: '1px solid rgba(255,255,255,0.08)',
            paddingTop: '40px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '32px', flexWrap: 'wrap',
          }}>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.35)', lineHeight: 1.65, margin: 0, maxWidth: '380px' }}>
              Web app sin descarga. Pedidos, pagos y retiros desde el celular.
            </p>
            <div className="nos-cta-buttons" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
              <Link href="/seguridad" className="nos-cta-btn" style={{
                display: 'inline-flex', alignItems: 'center',
                color: 'rgba(255,255,255,0.45)',
                padding: '14px 24px', borderRadius: '100px',
                fontSize: '14px', fontWeight: 600, textDecoration: 'none',
                border: '1px solid rgba(255,255,255,0.1)',
                whiteSpace: 'nowrap',
              }}>
                Ver seguridad
              </Link>
              <Link href="/" className="nos-cta-btn" style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                background: '#C6FF00', color: '#0A0A0F',
                padding: '14px 28px', borderRadius: '100px',
                fontSize: '14px', fontWeight: 700, textDecoration: 'none',
                letterSpacing: '-0.01em', whiteSpace: 'nowrap',
              }}>
                Empezar ahora
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7h10M8 3l4 4-4 4" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>

        </div>
      </div>

      <SiteFooter />
    </div>
  )
}
