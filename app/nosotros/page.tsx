import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Nosotros — Nubapay',
  description: 'Nubapay nace para resolver uno de los mayores problemas de los eventos masivos: las filas.',
}

export default function NosotrosPage() {
  const font = "var(--font-dm-sans, 'DM Sans', sans-serif)"

  const founders = [
    {
      name: 'Ángel Vaquero',
      role: 'CEO',
      roleLabel: 'Chief Executive Officer',
      desc: 'Lidera la estrategia, visión comercial y el crecimiento de Nubapay.',
      initial: 'A',
    },
    {
      name: 'Facundo Girardi',
      role: 'CTO',
      roleLabel: 'Chief Technology Officer',
      desc: 'Lidera el desarrollo tecnológico, la arquitectura y la escalabilidad de la plataforma.',
      initial: 'F',
    },
    {
      name: 'Alejo Vaquero',
      role: 'CPO',
      roleLabel: 'Chief Product Officer',
      desc: 'Lidera el producto, la UX, la definición funcional y la evolución de la plataforma.',
      initial: 'A',
    },
  ]

  const values = [
    {
      title: 'Simplicidad ante todo',
      desc: 'Cada decisión de producto parte de la misma pregunta: ¿es más fácil para quien lo usa? Si no lo es, volvemos a empezar.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="8" stroke="#C6FF00" strokeWidth="1.5"/>
          <path d="M8 11l2 2 4-4" stroke="#C6FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Tecnología con propósito',
      desc: 'Usamos IA, blockchain y pagos digitales porque resuelven problemas reales, no para seguir tendencias.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="3" y="5" width="16" height="12" rx="2" stroke="#C6FF00" strokeWidth="1.5"/>
          <path d="M8 11h6M11 8v6" stroke="#C6FF00" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      ),
    },
    {
      title: 'Operación sin fricciones',
      desc: 'El tiempo perdido en una fila es tiempo que el asistente no disfruta y el organizador no vende. Eso es lo que eliminamos.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M4 11h14M15 7l4 4-4 4" stroke="#C6FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
    {
      title: 'Confianza en cada QR',
      desc: 'Cada retiro se certifica en blockchain. El asistente sabe que lo suyo es suyo, y el organizador sabe que nadie lo duplicó.',
      icon: (
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <path d="M11 3l7 3v5c0 4-3.5 7-7 8C7.5 18 4 15 4 11V6l7-3z" stroke="#C6FF00" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M8 11l2 2 4-4" stroke="#C6FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      ),
    },
  ]

  const flow = [
    { num: '01', title: 'Escaneás el QR', desc: 'Desde el celular, sin bajar ninguna app.' },
    { num: '02', title: 'Elegís tus productos', desc: 'Catálogo del evento con precios y disponibilidad en tiempo real.' },
    { num: '03', title: 'Pagás desde el celular', desc: 'Métodos de pago digitales, proceso seguro en segundos.' },
    { num: '04', title: 'Recibís tu QR de retiro', desc: 'Único, irrepetible y certificado en blockchain.' },
    { num: '05', title: 'Retirás sin fila', desc: 'Mostrás el QR en el punto, el staff lo escanea y listo.' },
  ]

  const differentials = [
    {
      tag: 'IA',
      title: 'Atendium',
      subtitle: 'Agente de upselling e atención automatizada',
      desc: 'Atendium es el agente de inteligencia artificial de Nubapay. Analiza el comportamiento del asistente en tiempo real y sugiere productos complementarios en el momento justo, aumentando el ticket promedio del evento sin intervención humana.',
      accent: '#C6FF00',
      dark: true,
    },
    {
      tag: 'BLOCKCHAIN',
      title: 'unickeys',
      subtitle: 'Certificación en Solana Mainnet',
      desc: 'Cada QR de retiro se certifica mediante hash SHA-256 y Merkle Trees en Solana Mainnet. Es de un solo uso, no se puede copiar ni reutilizar. La validación es en tiempo real, el fraude es técnicamente imposible.',
      accent: '#7C3AED',
      dark: false,
    },
    {
      tag: 'OPERACIÓN',
      title: 'Panel en tiempo real',
      subtitle: 'Control total para el organizador',
      desc: 'Dashboard con ventas, pedidos, productos más vendidos, rendimiento por punto de retiro y horarios de mayor demanda. El organizador ve todo lo que pasa en su evento, en tiempo real.',
      accent: '#0A0A0F',
      dark: false,
    },
  ]

  return (
    <div style={{ fontFamily: font, background: '#FFFFFF', minHeight: '100vh' }}>
      <style>{`
        .nos-card { background: #FAFAFA; border: 1px solid rgba(0,0,0,0.07); border-radius: 20px; padding: 28px 32px; transition: border-color 0.2s; }
        .nos-card:hover { border-color: rgba(0,0,0,0.14); }
        .nos-founder { background: #FFFFFF; border: 1px solid rgba(0,0,0,0.08); border-radius: 20px; padding: 28px; transition: box-shadow 0.2s, border-color 0.2s; }
        .nos-founder:hover { border-color: rgba(198,255,0,0.4); box-shadow: 0 4px 32px rgba(198,255,0,0.08); }
        .nos-value { display: flex; gap: 16px; align-items: flex-start; padding: 20px; border-radius: 16px; transition: background 0.15s; }
        .nos-value:hover { background: rgba(0,0,0,0.025); }
        .nos-tag { display: inline-flex; align-items: center; font-size: 10px; font-weight: 700; letter-spacing: 0.08em; border-radius: 6px; padding: 3px 8px; margin-bottom: 12px; }
        .nos-flow-item { display: flex; gap: 20px; align-items: flex-start; padding: 20px 0; border-bottom: 1px solid rgba(0,0,0,0.06); }
        .nos-flow-item:last-child { border-bottom: none; }
      `}</style>

      {/* Nav */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 50,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        borderBottom: '1px solid rgba(0,0,0,0.06)',
      }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          padding: '0 32px', height: '60px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <span style={{ fontSize: '18px', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.04em' }}>
              nubapay
            </span>
          </Link>
          <Link href="/" style={{
            textDecoration: 'none', fontSize: '13px', fontWeight: 600,
            color: '#0A0A0F', background: '#F4F4F6',
            borderRadius: '100px', padding: '7px 16px',
          }}>
            Volver al inicio
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <div style={{ background: '#0A0A0F', padding: '100px 32px 0', textAlign: 'center' }}>
        <div style={{ maxWidth: '780px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            background: 'rgba(198,255,0,0.12)', border: '1px solid rgba(198,255,0,0.2)',
            borderRadius: '100px', padding: '5px 14px',
            fontSize: '12px', fontWeight: 700, color: '#C6FF00',
            letterSpacing: '0.06em', marginBottom: '32px',
          }}>
            SOBRE NOSOTROS
          </div>
          <h1 style={{
            fontSize: 'clamp(44px, 7vw, 80px)',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.04em',
            lineHeight: 1.0,
            margin: '0 0 28px',
          }}>
            Terminamos con las filas<br />
            <span style={{ color: '#C6FF00' }}>de una vez por todas</span>
          </h1>
          <p style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.7,
            margin: '0 auto 72px',
            maxWidth: '560px',
          }}>
            Nubapay nace para resolver uno de los mayores problemas de los eventos masivos. Creamos una plataforma simple y escalable que conecta asistentes, barras y organizadores en un único sistema operativo.
          </p>
        </div>

        {/* Decorative bottom */}
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '1px', background: 'rgba(255,255,255,0.06)',
          borderRadius: '20px 20px 0 0', overflow: 'hidden',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderLeft: '1px solid rgba(255,255,255,0.08)',
          borderRight: '1px solid rgba(255,255,255,0.08)',
        }}>
          {[
            { val: '1%', label: 'Comisión por transacción' },
            { val: '0', label: 'Apps que descargar' },
            { val: '5 seg', label: 'Para completar un pedido' },
          ].map((stat) => (
            <div key={stat.label} style={{
              padding: '36px 32px',
              background: 'rgba(255,255,255,0.03)',
              textAlign: 'center',
              borderRight: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: 'clamp(32px, 4vw, 48px)', fontWeight: 800, color: '#C6FF00', letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '8px' }}>
                {stat.val}
              </div>
              <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* El problema */}
      <div style={{ padding: '96px 32px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '80px', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#C6FF00', letterSpacing: '0.1em', marginBottom: '16px' }}>
              EL PROBLEMA
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 24px' }}>
              Las filas cuestan<br />más de lo que parecen
            </h2>
            <p style={{ fontSize: '16px', color: '#6B6B7A', lineHeight: 1.7, margin: 0 }}>
              Cada minuto en fila es tiempo que el asistente no disfruta y dinero que el organizador no recauda. La saturación del staff, los errores en pedidos y la falta de visibilidad en tiempo real se traducen en menos ventas, peor experiencia y operaciones que no escalan.
            </p>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[
              { icon: '→', text: 'Filas largas en barras y cajas' },
              { icon: '→', text: 'Pérdida de ventas por fricción en el pago' },
              { icon: '→', text: 'Staff saturado en picos de demanda' },
              { icon: '→', text: 'Errores en pedidos por comunicación verbal' },
              { icon: '→', text: 'Sin visibilidad en tiempo real para el organizador' },
              { icon: '→', text: 'Fraude y doble cobro sin sistemas de validación' },
            ].map((item) => (
              <div key={item.text} style={{
                display: 'flex', alignItems: 'center', gap: '14px',
                padding: '14px 18px',
                background: '#FAFAFA',
                border: '1px solid rgba(0,0,0,0.06)',
                borderRadius: '12px',
                fontSize: '14px', color: '#3A3A4A', fontWeight: 500,
              }}>
                <span style={{ color: '#C6FF00', fontWeight: 700, fontSize: '16px' }}>→</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Cómo funciona */}
      <div style={{ padding: '96px 32px', background: '#FAFAFA', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B7A', letterSpacing: '0.1em', marginBottom: '16px' }}>
              EL FLUJO
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.04em', lineHeight: 1.05, margin: 0 }}>
              De la fila al QR en 5 pasos
            </h2>
          </div>

          <div style={{ maxWidth: '640px', margin: '0 auto' }}>
            {flow.map((step) => (
              <div key={step.num} className="nos-flow-item">
                <div style={{
                  minWidth: '44px', height: '44px',
                  background: '#0A0A0F', borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '12px', fontWeight: 700, color: '#C6FF00', letterSpacing: '0.04em',
                  flexShrink: 0,
                }}>
                  {step.num}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#0A0A0F', marginBottom: '4px' }}>
                    {step.title}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6B6B7A', lineHeight: 1.6 }}>
                    {step.desc}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Diferenciales */}
      <div style={{ padding: '96px 32px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B7A', letterSpacing: '0.1em', marginBottom: '16px' }}>
              POR QUÉ NUBAPAY
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.04em', lineHeight: 1.05, margin: 0 }}>
              Tres capas que no tienen<br />otros sistemas
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {differentials.map((d) => (
              <div key={d.title} style={{
                background: d.dark ? '#0A0A0F' : '#FAFAFA',
                border: `1px solid ${d.dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.07)'}`,
                borderRadius: '20px',
                padding: '32px',
                display: 'flex',
                flexDirection: 'column',
                gap: '0',
              }}>
                <div className="nos-tag" style={{
                  background: d.dark ? 'rgba(198,255,0,0.15)' : `${d.accent}15`,
                  color: d.dark ? '#C6FF00' : d.accent,
                  border: d.dark ? '1px solid rgba(198,255,0,0.2)' : `1px solid ${d.accent}30`,
                }}>
                  {d.tag}
                </div>
                <div style={{
                  fontSize: '24px', fontWeight: 800,
                  color: d.dark ? '#FFFFFF' : '#0A0A0F',
                  letterSpacing: '-0.03em', marginBottom: '4px',
                }}>
                  {d.title}
                </div>
                <div style={{
                  fontSize: '13px', fontWeight: 600,
                  color: d.dark ? 'rgba(255,255,255,0.4)' : '#8B8B9A',
                  marginBottom: '16px',
                }}>
                  {d.subtitle}
                </div>
                <p style={{
                  fontSize: '14px', lineHeight: 1.7,
                  color: d.dark ? 'rgba(255,255,255,0.55)' : '#6B6B7A',
                  margin: 0,
                }}>
                  {d.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Valores */}
      <div style={{ padding: '96px 32px', background: '#0A0A0F', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ marginBottom: '64px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#C6FF00', letterSpacing: '0.1em', marginBottom: '16px' }}>
              CÓMO PENSAMOS
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: '#FFFFFF', letterSpacing: '-0.04em', lineHeight: 1.05, margin: 0 }}>
              Lo que guía<br />cada decisión
            </h2>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px' }}>
            {values.map((v) => (
              <div key={v.title} className="nos-value">
                <div style={{
                  width: '44px', height: '44px', minWidth: '44px',
                  background: 'rgba(198,255,0,0.1)',
                  border: '1px solid rgba(198,255,0,0.15)',
                  borderRadius: '12px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {v.icon}
                </div>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: 700, color: '#FFFFFF', marginBottom: '6px', letterSpacing: '-0.02em' }}>
                    {v.title}
                  </div>
                  <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: 0 }}>
                    {v.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Equipo */}
      <div style={{ padding: '96px 32px', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B7A', letterSpacing: '0.1em', marginBottom: '16px' }}>
              EL EQUIPO
            </div>
            <h2 style={{ fontSize: 'clamp(32px, 4vw, 52px)', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.04em', lineHeight: 1.05, margin: '0 0 16px' }}>
              Construido por fundadores<br />que entienden el problema
            </h2>
            <p style={{ fontSize: '16px', color: '#6B6B7A', lineHeight: 1.7, margin: '0 auto', maxWidth: '480px' }}>
              Somos un equipo chico y enfocado. Cada uno dueño de su área, todos alineados en el mismo objetivo.
            </p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {founders.map((f) => (
              <div key={f.name} className="nos-founder">
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
                  <div style={{
                    width: '52px', height: '52px',
                    background: '#0A0A0F',
                    borderRadius: '14px',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '20px', fontWeight: 800, color: '#C6FF00',
                    letterSpacing: '-0.02em',
                    flexShrink: 0,
                  }}>
                    {f.initial}
                  </div>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.02em' }}>
                      {f.name}
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#6B6B7A', marginTop: '2px' }}>
                      {f.roleLabel}
                    </div>
                  </div>
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center',
                  background: '#F0F0F2', borderRadius: '8px',
                  padding: '4px 10px', fontSize: '11px', fontWeight: 700,
                  color: '#3A3A4A', letterSpacing: '0.06em', marginBottom: '16px',
                }}>
                  {f.role}
                </div>
                <p style={{ fontSize: '14px', color: '#6B6B7A', lineHeight: 1.65, margin: 0 }}>
                  {f.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tipos de evento */}
      <div style={{ padding: '72px 32px', background: '#FAFAFA', borderBottom: '1px solid rgba(0,0,0,0.07)' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', textAlign: 'center' }}>
          <div style={{ fontSize: '11px', fontWeight: 700, color: '#6B6B7A', letterSpacing: '0.1em', marginBottom: '24px' }}>
            DÓNDE OPERAMOS
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
            {['Boliches', 'Festivales', 'Fiestas', 'Recitales', 'Eventos privados', 'Ferias', 'Estadios', 'Eventos corporativos', 'Barras móviles', 'Food trucks'].map((type) => (
              <div key={type} style={{
                padding: '9px 18px',
                background: '#FFFFFF',
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: '100px',
                fontSize: '13px', fontWeight: 600, color: '#3A3A4A',
              }}>
                {type}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA */}
      <div style={{ background: '#0A0A0F', padding: '100px 32px' }}>
        <div style={{ maxWidth: '680px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{
            fontSize: 'clamp(36px, 5vw, 64px)',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            margin: '0 0 20px',
          }}>
            Llevá Nubapay<br />a tu próximo evento
          </h2>
          <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.45)', lineHeight: 1.7, margin: '0 0 40px' }}>
            Web app sin descargas. QR listo en minutos. Pedidos, pagos y retiros desde el celular.
          </p>
          <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/" style={{
              display: 'inline-flex', alignItems: 'center', gap: '8px',
              background: '#C6FF00', color: '#0A0A0F',
              padding: '14px 28px', borderRadius: '100px',
              fontSize: '14px', fontWeight: 700, textDecoration: 'none',
              letterSpacing: '-0.01em',
            }}>
              Empezar ahora
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M2 7h10M8 3l4 4-4 4" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <Link href="/seguridad" style={{
              display: 'inline-flex', alignItems: 'center',
              background: 'rgba(255,255,255,0.08)',
              color: 'rgba(255,255,255,0.8)',
              padding: '14px 28px', borderRadius: '100px',
              fontSize: '14px', fontWeight: 600, textDecoration: 'none',
            }}>
              Ver seguridad
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid rgba(0,0,0,0.07)',
        padding: '28px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.04em' }}>
            nubapay
          </span>
          <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap' }}>
            {[
              { label: 'Seguridad', href: '/seguridad' },
              { label: 'Privacidad', href: '/privacidad' },
              { label: 'Términos', href: '/terminos' },
            ].map((link) => (
              <Link key={link.label} href={link.href} style={{
                fontSize: '13px', color: '#8B8B9A', fontWeight: 500, textDecoration: 'none',
              }}>
                {link.label}
              </Link>
            ))}
          </div>
          <span style={{ fontSize: '12px', color: '#BCBCC8' }}>
            © 2025 Nubapay
          </span>
        </div>
      </div>
    </div>
  )
}
