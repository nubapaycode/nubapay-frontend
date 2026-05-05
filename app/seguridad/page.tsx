import type { Metadata } from 'next'
import Link from 'next/link'
import SiteNavbar from '@/components/SiteNavbar'

export const metadata: Metadata = {
  title: 'Seguridad',
  description: 'Conocé cómo Nubapay protege cada pedido, pago y retiro en tu evento.',
}

export default function SeguridadPage() {
  const font = "var(--font-dm-sans, 'DM Sans', sans-serif)"

  return (
    <div style={{ fontFamily: font, background: '#FFFFFF', minHeight: '100vh' }}>
      <style>{`
        .sec-card { background: #FAFAFA; border: 1px solid rgba(0,0,0,0.07); border-radius: 20px; padding: 28px; transition: border-color 0.2s; }
        .sec-card:hover { border-color: rgba(0,0,0,0.14); }
        .sec-pill { display: inline-flex; align-items: center; gap: 6px; background: #F0F0F2; border-radius: 100px; padding: 4px 12px; font-size: 12px; font-weight: 600; color: #6B6B7A; }
        .sec-check { display: flex; align-items: flex-start; gap: 10px; font-size: 14px; color: #4A4A5A; line-height: 1.6; }
      `}</style>

      <SiteNavbar activePath="/seguridad" />

      {/* Hero */}
      <div style={{
        background: '#0A0A0F',
        padding: '100px 32px 96px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <h1 style={{
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 800,
            color: '#FFFFFF',
            letterSpacing: '-0.04em',
            lineHeight: 1.05,
            margin: '0 0 24px',
          }}>
            Tu evento, protegido<br />de punta a punta
          </h1>
          <p style={{ fontSize: '18px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: 0 }}>
            Cada pedido, pago y retiro en Nubapay pasa por múltiples capas de verificación. Sin atajos, sin trucos. Así funciona.
          </p>
        </div>
      </div>

      {/* Stats bar */}
      <div style={{
        borderBottom: '1px solid rgba(0,0,0,0.07)',
        background: '#FFFFFF',
      }}>
        <div style={{
          maxWidth: '1100px', margin: '0 auto',
          padding: '0 32px',
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
        }}>
          {[
            { value: '0%', label: 'QRs duplicados procesados' },
            { value: '256-bit', label: 'Cifrado en tránsito (TLS)' },
            { value: 'Blockchain', label: 'Certificación de retiros' },
            { value: '24/7', label: 'Monitoreo del sistema' },
          ].map((stat, i) => (
            <div key={i} style={{
              padding: '28px 0',
              borderRight: i < 3 ? '1px solid rgba(0,0,0,0.07)' : 'none',
              paddingLeft: i > 0 ? '32px' : '0',
              paddingRight: i < 3 ? '32px' : '0',
            }}>
              <p style={{ margin: '0 0 4px', fontSize: '22px', fontWeight: 800, color: '#0A0A0F', letterSpacing: '-0.04em' }}>
                {stat.value}
              </p>
              <p style={{ margin: 0, fontSize: '13px', color: '#9A9AA8' }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '72px 32px 120px' }}>

        {/* QR antifraude — featured */}
        <div style={{
          background: '#0A0A0F',
          borderRadius: '28px',
          padding: '56px',
          marginBottom: '24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '48px',
          alignItems: 'center',
        }}>
          <div>
            <div className="sec-pill" style={{ background: 'rgba(198,255,0,0.12)', color: '#C6FF00', marginBottom: '20px' }}>
              QR Antifraude
            </div>
            <h2 style={{
              fontSize: 'clamp(28px, 3.5vw, 42px)',
              fontWeight: 800, color: '#FFFFFF',
              letterSpacing: '-0.04em', lineHeight: 1.1,
              margin: '0 0 16px',
            }}>
              Cada retiro tiene<br />su QR único
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.65, margin: '0 0 28px' }}>
              Al confirmar un pago, Nubapay genera un código QR irrepetible vinculado a ese pedido específico. No puede copiarse, reutilizarse ni transferirse.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {[
                'QR de un solo uso — se invalida al escanearse',
                'Vinculado al pedido, el evento y el punto de retiro',
                'Verificación en tiempo real contra la base de datos',
                'Intento de escaneo duplicado registrado y alertado',
              ].map((item, i) => (
                <div key={i} className="sec-check">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <circle cx="9" cy="9" r="8.5" stroke="rgba(198,255,0,0.3)"/>
                    <path d="M5.5 9l2.5 2.5 4.5-4.5" stroke="#C6FF00" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span style={{ color: 'rgba(255,255,255,0.65)' }}>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* QR visual */}
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <div style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: '24px',
              padding: '32px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px',
            }}>
              {/* Mock QR */}
              <div style={{
                width: '160px', height: '160px',
                background: '#FFFFFF',
                borderRadius: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(7, 1fr)',
                gap: '3px',
                padding: '12px',
              }}>
                {Array.from({ length: 49 }, (_, i) => {
                  const corners = [0,1,2,3,4,5,6,7,13,14,20,21,27,28,42,43,44,45,46,47,48]
                  const inner = [8,9,10,15,16,17,22,23,24]
                  const pattern = [30,31,32,37,38,39]
                  const filled = corners.includes(i) || inner.includes(i) || pattern.includes(i) || (i % 3 === 0 && i > 28)
                  return (
                    <div key={i} style={{
                      background: filled ? '#0A0A0F' : 'transparent',
                      borderRadius: '2px',
                    }} />
                  )
                })}
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ margin: '0 0 4px', fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                  Pedido #NB-00492
                </p>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: '6px',
                  background: 'rgba(198,255,0,0.12)',
                  borderRadius: '100px', padding: '4px 10px',
                }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#C6FF00', display: 'inline-block' }} />
                  <span style={{ fontSize: '11px', fontWeight: 700, color: '#C6FF00' }}>Listo para retirar</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Grid de 3 */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '16px' }}>

          {/* Blockchain */}
          <div className="sec-card">
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: '#F0F0FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2L3 6.5v9L11 20l8-4.5v-9L11 2z" stroke="#6366F1" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M11 2v18M3 6.5l8 4.5 8-4.5" stroke="#6366F1" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.02em' }}>
              Certificación blockchain
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6B6B7A', lineHeight: 1.65 }}>
              Cada QR de retiro se certifica con unickeys, dejando una constancia inmutable en blockchain. Si alguien intenta falsificar un código, la verificación falla instantáneamente.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Registro en blockchain de cada retiro', 'Hash único por transacción', 'Imposible de falsificar o clonar'].map(item => (
                <div key={item} className="sec-check">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M3 8l3.5 3.5L13 5" stroke="#6366F1" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Pagos */}
          <div className="sec-card">
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: '#F0FFF4',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="5" width="18" height="13" rx="2.5" stroke="#16A34A" strokeWidth="1.5"/>
                <path d="M2 9h18" stroke="#16A34A" strokeWidth="1.5"/>
                <rect x="5" y="13" width="4" height="1.5" rx="0.75" fill="#16A34A"/>
              </svg>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.02em' }}>
              Pagos seguros
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6B6B7A', lineHeight: 1.65 }}>
              Nubapay no almacena datos de tarjetas. Los pagos se procesan a través de PSPs certificados (como Mercado Pago) que cumplen estándares PCI DSS.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Sin almacenamiento de datos de tarjeta', 'Tokenización por el PSP', 'TLS 256-bit en todas las conexiones'].map(item => (
                <div key={item} className="sec-check">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M3 8l3.5 3.5L13 5" stroke="#16A34A" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Accesos */}
          <div className="sec-card">
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: '#FFF7ED',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2a4 4 0 00-4 4v2H5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2v-8a2 2 0 00-2-2h-2V6a4 4 0 00-4-4z" stroke="#EA580C" strokeWidth="1.5" strokeLinejoin="round"/>
                <circle cx="11" cy="13" r="1.5" fill="#EA580C"/>
              </svg>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.02em' }}>
              Control de accesos
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6B6B7A', lineHeight: 1.65 }}>
              Cada usuario del panel tiene acceso únicamente a lo que necesita. El organizador define roles y permisos granulares para su staff.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {['Roles por usuario (admin, cajero, scanner)', 'Acceso limitado por evento', 'Log de actividad por sesión'].map(item => (
                <div key={item} className="sec-check">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M3 8l3.5 3.5L13 5" stroke="#EA580C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Grid de 2 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '64px' }}>

          {/* Detección de fraude */}
          <div className="sec-card">
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: '#FFF1F2',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 3L4 6.5v6c0 4 3.5 7 7 7.5 3.5-.5 7-3.5 7-7.5v-6L11 3z" stroke="#E11D48" strokeWidth="1.5" strokeLinejoin="round"/>
                <path d="M8 11l2 2 4-4" stroke="#E11D48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.02em' }}>
              Detección de fraude en tiempo real
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6B6B7A', lineHeight: 1.65 }}>
              El sistema monitorea cada intento de escaneo, detecta patrones anómalos y bloquea QRs comprometidos antes de que se concrete el retiro.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                'Bloqueo de QR duplicados',
                'Alertas al organizador',
                'Registro de intentos fallidos',
                'Detección de actividad inusual',
              ].map(item => (
                <div key={item} className="sec-check">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M3 8l3.5 3.5L13 5" stroke="#E11D48" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>

          {/* Infraestructura */}
          <div className="sec-card">
            <div style={{
              width: '44px', height: '44px', borderRadius: '14px',
              background: '#EFF6FF',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: '20px',
            }}>
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="2" y="3" width="18" height="6" rx="2" stroke="#2563EB" strokeWidth="1.5"/>
                <rect x="2" y="13" width="18" height="6" rx="2" stroke="#2563EB" strokeWidth="1.5"/>
                <circle cx="17" cy="6" r="1" fill="#2563EB"/>
                <circle cx="17" cy="16" r="1" fill="#2563EB"/>
              </svg>
            </div>
            <h3 style={{ margin: '0 0 8px', fontSize: '16px', fontWeight: 700, color: '#0A0A0F', letterSpacing: '-0.02em' }}>
              Infraestructura confiable
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: '14px', color: '#6B6B7A', lineHeight: 1.65 }}>
              Nubapay corre sobre infraestructura cloud de alta disponibilidad, con backups automáticos, monitoreo 24/7 y capacidad de escalar en eventos con miles de asistentes simultáneos.
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              {[
                'Alta disponibilidad',
                'Backups automáticos',
                'Escalado automático',
                'Monitoreo 24/7',
              ].map(item => (
                <div key={item} className="sec-check">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '2px' }}>
                    <path d="M3 8l3.5 3.5L13 5" stroke="#2563EB" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cómo funciona el flujo */}
        <div style={{ marginBottom: '64px' }}>
          <h2 style={{
            fontSize: 'clamp(24px, 3vw, 36px)',
            fontWeight: 800, color: '#0A0A0F',
            letterSpacing: '-0.04em', lineHeight: 1.1,
            margin: '0 0 8px',
          }}>
            El camino de un pedido seguro
          </h2>
          <p style={{ fontSize: '15px', color: '#9A9AA8', margin: '0 0 40px' }}>
            De la compra al retiro, cada paso está verificado.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0', position: 'relative' }}>
            {/* Línea conectora */}
            <div style={{
              position: 'absolute',
              top: '22px', left: '10%', right: '10%',
              height: '1px',
              background: 'linear-gradient(90deg, transparent, #E5E5EA 15%, #E5E5EA 85%, transparent)',
              zIndex: 0,
            }} />

            {[
              {
                step: '1', title: 'Pedido', desc: 'El asistente elige y confirma su pedido desde el celular',
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 3h2l3 9h8l2-6H6" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="16.5" r="1.25" fill="#0A0A0F"/><circle cx="15" cy="16.5" r="1.25" fill="#0A0A0F"/></svg>
              },
              {
                step: '2', title: 'Pago', desc: 'El pago se procesa con cifrado TLS 256-bit',
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="5" width="16" height="11" rx="2" stroke="#0A0A0F" strokeWidth="1.5"/><path d="M2 9h16" stroke="#0A0A0F" strokeWidth="1.5"/><rect x="5" y="12" width="3" height="1.5" rx="0.75" fill="#0A0A0F"/></svg>
              },
              {
                step: '3', title: 'QR generado', desc: 'Se crea un QR único certificado con blockchain',
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><rect x="2" y="2" width="7" height="7" rx="1" stroke="#0A0A0F" strokeWidth="1.5"/><rect x="11" y="2" width="7" height="7" rx="1" stroke="#0A0A0F" strokeWidth="1.5"/><rect x="2" y="11" width="7" height="7" rx="1" stroke="#0A0A0F" strokeWidth="1.5"/><path d="M11 11h3v3M14 14h4M14 17v1M17 14v3" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round"/></svg>
              },
              {
                step: '4', title: 'Escaneo', desc: 'El staff escanea y la app verifica en tiempo real',
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M2 7V4a2 2 0 012-2h3M13 2h3a2 2 0 012 2v3M18 13v3a2 2 0 01-2 2h-3M7 18H4a2 2 0 01-2-2v-3" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round"/><path d="M2 10h16" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round"/></svg>
              },
              {
                step: '5', title: 'Retiro', desc: 'El QR se invalida y el pedido queda como entregado',
                icon: <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="8" stroke="#0A0A0F" strokeWidth="1.5"/><path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="#0A0A0F" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
              },
            ].map((item, i) => (
              <div key={i} style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                textAlign: 'center', padding: '0 12px',
                position: 'relative', zIndex: 1,
              }}>
                <div style={{
                  width: '44px', height: '44px',
                  background: '#FFFFFF',
                  border: '1.5px solid rgba(0,0,0,0.1)',
                  borderRadius: '50%',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: '16px',
                }}>
                  {item.icon}
                </div>
                <p style={{ margin: '0 0 6px', fontSize: '13px', fontWeight: 700, color: '#0A0A0F' }}>
                  {item.title}
                </p>
                <p style={{ margin: 0, fontSize: '12px', color: '#9A9AA8', lineHeight: 1.5 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CTA final */}
        <div style={{
          background: '#0A0A0F',
          borderRadius: '28px',
          padding: '56px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '32px', flexWrap: 'wrap',
        }}>
          <div>
            <h2 style={{
              fontSize: 'clamp(22px, 3vw, 32px)',
              fontWeight: 800, color: '#FFFFFF',
              letterSpacing: '-0.04em', margin: '0 0 10px',
            }}>
              ¿Tenés preguntas sobre seguridad?
            </h2>
            <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.45)', margin: 0, lineHeight: 1.6 }}>
              Nuestro equipo puede explicarte en detalle cómo protegemos tu evento.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <a href="mailto:seguridad@nubapay.com" style={{
              textDecoration: 'none',
              background: '#C6FF00', color: '#0A0F00',
              borderRadius: '100px', padding: '14px 28px',
              fontSize: '15px', fontWeight: 800,
              letterSpacing: '-0.02em',
              whiteSpace: 'nowrap',
            }}>
              Hablar con el equipo
            </a>
            <Link href="/terminos" style={{
              textDecoration: 'none',
              background: 'rgba(255,255,255,0.08)', color: '#FFFFFF',
              borderRadius: '100px', padding: '14px 28px',
              fontSize: '15px', fontWeight: 600,
              whiteSpace: 'nowrap',
            }}>
              Ver términos legales
            </Link>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div style={{
        borderTop: '1px solid rgba(0,0,0,0.06)',
        padding: '28px 32px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        maxWidth: '1100px', margin: '0 auto',
        flexWrap: 'wrap', gap: '12px',
      }}>
        <span style={{ fontSize: '13px', color: '#9A9AA8' }}>
          © 2025 Nubapay. Todos los derechos reservados.
        </span>
        <div style={{ display: 'flex', gap: '20px' }}>
          <Link href="/terminos" style={{ fontSize: '13px', color: '#6B6B7A', textDecoration: 'none' }}>Términos</Link>
          <Link href="/privacidad" style={{ fontSize: '13px', color: '#6B6B7A', textDecoration: 'none' }}>Privacidad</Link>
          <Link href="/seguridad" style={{ fontSize: '13px', color: '#0A0A0F', fontWeight: 600, textDecoration: 'none' }}>Seguridad</Link>
        </div>
      </div>

    </div>
  )
}
