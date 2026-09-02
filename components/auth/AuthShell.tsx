'use client'

import Link from 'next/link'

/**
 * Shell visual compartido por /login y /register.
 *
 * La tarjeta se presenta como un pase de acceso troquelado (stub + perforación +
 * muescas): es el artefacto propio del producto — la credencial con la que se
 * entra al evento. Tipografía y acento vienen del sitio público (Bricolage
 * Grotesque + lima #C6FF00), para que el auth no se sienta otro producto.
 */

export const ACCENT = 'var(--organizer-accent, #C6FF00)'
export const ACCENT_INK = 'var(--organizer-accent-ink, #0A0F00)'

const DISPLAY_FONT = "var(--font-bricolage, 'Bricolage Grotesque', 'DM Sans', sans-serif)"
const BODY_FONT = "var(--font-dm-sans, 'DM Sans', sans-serif)"

export const AUTH_CSS = `
  .nba-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 88px 24px 56px;
    background: #FFFFFF;
    font-family: ${BODY_FONT};
    color: #0A0A0F;
    position: relative;
    overflow: hidden;
  }
  /* Mismo glow lima del hero de la landing */
  .nba-glow {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 900px;
    height: 760px;
    transform: translate(-50%, -50%);
    background: radial-gradient(ellipse 50% 50% at 50% 50%, rgba(198,255,0,0.42) 0%, rgba(198,255,0,0.10) 46%, rgba(198,255,0,0) 72%);
    pointer-events: none;
  }
  .nba-glow--b {
    top: -18%;
    left: -12%;
    width: 46%;
    height: 58%;
    transform: none;
    background: radial-gradient(ellipse 60% 60% at 40% 40%, rgba(198,255,0,0.16) 0%, rgba(198,255,0,0) 70%);
  }

  .nba-brand {
    position: absolute;
    top: 28px;
    left: 32px;
    display: inline-flex;
    align-items: baseline;
    gap: 8px;
    text-decoration: none;
  }
  .nba-brand-word { font-size: 18px; font-weight: 700; letter-spacing: -0.03em; color: #0A0A0F; }
  .nba-brand-tag {
    font-size: 10px; font-weight: 800; letter-spacing: 0.12em;
    text-transform: uppercase; color: rgba(10,10,15,0.32);
  }

  /* drop-shadow (no box-shadow) para que respete el troquelado de la máscara */
  .nba-card-wrap {
    position: relative;
    width: 100%;
    max-width: 440px;
    filter: drop-shadow(0 20px 44px rgba(10,15,0,0.11));
    animation: nba-in 0.7s cubic-bezier(0.16,1,0.3,1) both;
  }
  @keyframes nba-in {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .nba-card {
    background: #FFFFFF;
    border: 1px solid rgba(10,15,0,0.11);
    border-radius: 22px;
    /* Muescas del troquel a la altura de la perforación. Si el navegador no
       soporta mask-composite, la unión deja la tarjeta entera: sin muescas. */
    -webkit-mask-image:
      radial-gradient(circle 11px at 0 var(--nba-perf), transparent 11px, #000 11.5px),
      radial-gradient(circle 11px at 100% var(--nba-perf), transparent 11px, #000 11.5px);
    mask-image:
      radial-gradient(circle 11px at 0 var(--nba-perf), transparent 11px, #000 11.5px),
      radial-gradient(circle 11px at 100% var(--nba-perf), transparent 11px, #000 11.5px);
    -webkit-mask-composite: source-in;
    mask-composite: intersect;
    --nba-perf: 58px;
  }

  /* ── Stub del pase ── */
  .nba-stub {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    padding: 20px 26px 18px;
    height: 58px;
    box-sizing: border-box;
  }
  .nba-eyebrow {
    font-size: 10px; font-weight: 800; letter-spacing: 0.14em;
    text-transform: uppercase; color: rgba(10,10,15,0.42);
  }
  .nba-stub-logo { max-height: 22px; max-width: 130px; width: auto; object-fit: contain; display: block; }
  .nba-stub-note { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; color: rgba(10,10,15,0.3); white-space: nowrap; }
  .nba-stub-chip {
    font-size: 10px; font-weight: 800; letter-spacing: 0.1em; text-transform: uppercase;
    background: ${ACCENT}; color: ${ACCENT_INK};
    padding: 5px 11px; border-radius: 100px; white-space: nowrap;
  }

  .nba-perf {
    height: 0;
    border-top: 1px dashed rgba(10,15,0,0.18);
    margin: 0 14px;
  }

  .nba-body { padding: 30px 30px 26px; }

  /* ── Título ── */
  .nba-title {
    font-family: ${DISPLAY_FONT};
    font-size: 32px;
    font-weight: 600;
    letter-spacing: -0.045em;
    line-height: 1;
    color: #0A0A0F;
    margin: 0 0 10px;
  }
  .nba-sub { font-size: 14px; line-height: 1.55; color: #6A6A78; margin: 0 0 26px; }

  /* Subrayado trazado a mano — mismo tratamiento que el h1 de la landing */
  .nba-mark { position: relative; display: inline-block; padding: 0 5px 2px; margin: 0 -4px; z-index: 0; }
  .nba-mark::before {
    content: '';
    position: absolute;
    inset: -1px -3px;
    z-index: -1;
    background-image: linear-gradient(101deg, rgba(198,255,0,0) 1%, rgba(198,255,0,0.95) 4%, rgba(198,255,0,0.95) 96%, rgba(198,255,0,0) 99%);
    background-repeat: no-repeat;
    background-size: 100% 56%;
    background-position: 0 94%;
    -webkit-mask-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='120'%20height='44'%3E%3Cfilter%20id='r'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.014%200.15'%20numOctaves='2'%20seed='7'%20result='n'/%3E%3CfeDisplacementMap%20in='SourceGraphic'%20in2='n'%20scale='8'/%3E%3C/filter%3E%3Crect%20x='6'%20y='7'%20width='108'%20height='30'%20rx='9'%20fill='black'%20filter='url(%23r)'/%3E%3C/svg%3E");
    mask-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='120'%20height='44'%3E%3Cfilter%20id='r'%3E%3CfeTurbulence%20type='fractalNoise'%20baseFrequency='0.014%200.15'%20numOctaves='2'%20seed='7'%20result='n'/%3E%3CfeDisplacementMap%20in='SourceGraphic'%20in2='n'%20scale='8'/%3E%3C/filter%3E%3Crect%20x='6'%20y='7'%20width='108'%20height='30'%20rx='9'%20fill='black'%20filter='url(%23r)'/%3E%3C/svg%3E");
    -webkit-mask-size: 100% 100%;
    mask-size: 100% 100%;
    -webkit-mask-repeat: no-repeat;
    mask-repeat: no-repeat;
    transform-origin: left center;
    animation: nba-draw 0.7s cubic-bezier(0.22,1,0.36,1) 0.35s both;
  }
  @keyframes nba-draw { from { transform: scaleX(0) } to { transform: scaleX(1) } }

  /* ── Campos ── */
  .nba-form { display: flex; flex-direction: column; gap: 14px; }
  .nba-row { display: flex; gap: 12px; }
  .nba-row > * { flex: 1; min-width: 0; }
  .nba-field { display: flex; flex-direction: column; gap: 6px; }
  .nba-label {
    font-size: 10px; font-weight: 800; letter-spacing: 0.12em;
    text-transform: uppercase; color: rgba(10,10,15,0.5);
  }
  .nba-input {
    width: 100%;
    box-sizing: border-box;
    font-family: ${BODY_FONT};
    font-size: 15px;
    color: #0A0A0F;
    background: #FAFAFA;
    border: 1px solid rgba(10,15,0,0.16);
    border-radius: 12px;
    padding: 12px 14px;
    outline: none;
    transition: border-color 0.16s, box-shadow 0.16s, background 0.16s;
  }
  .nba-input::placeholder { color: #A7A7B4; }
  .nba-input:hover:not(:disabled) { border-color: rgba(10,15,0,0.2); }
  .nba-input:focus {
    background: #FFFFFF;
    border-color: #0A0A0F;
    box-shadow: 0 0 0 3px rgba(198,255,0,0.45);
  }
  .nba-input:disabled { opacity: 0.55; cursor: not-allowed; }
  textarea.nba-input { height: 128px; resize: none; line-height: 1.6; }

  .nba-hint { align-self: flex-end; font-size: 13px; color: #9A9AA8; text-decoration: none; margin-top: -4px; }
  .nba-hint:hover { color: #0A0A0F; }

  .nba-error {
    display: flex; gap: 9px; align-items: flex-start;
    background: rgba(239,68,68,0.05);
    border: 1px solid rgba(239,68,68,0.16);
    border-radius: 12px;
    padding: 11px 14px;
    font-size: 13px;
    line-height: 1.45;
    color: #DC2626;
  }

  /* ── CTA: mismo pill con flecha que la landing ── */
  .nba-submit {
    display: inline-flex; align-items: center; justify-content: center; gap: 10px;
    width: 100%;
    height: 54px;
    box-sizing: border-box;
    padding: 0 12px 0 24px;
    border: none;
    border-radius: 100px;
    background: ${ACCENT};
    color: ${ACCENT_INK};
    font-family: ${DISPLAY_FONT};
    font-size: 16px;
    font-weight: 600;
    letter-spacing: -0.02em;
    cursor: pointer;
    margin-top: 6px;
    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1), box-shadow 0.3s cubic-bezier(0.16,1,0.3,1), opacity 0.16s;
  }
  .nba-submit:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 12px 26px -12px rgba(198,255,0,0.75); }
  .nba-submit:disabled { opacity: 0.55; cursor: not-allowed; }
  .nba-submit-arrow {
    display: inline-flex; align-items: center; justify-content: center;
    width: 30px; height: 30px; border-radius: 100px;
    background: ${ACCENT_INK};
    transition: transform 0.3s cubic-bezier(0.16,1,0.3,1);
  }
  .nba-submit:hover:not(:disabled) .nba-submit-arrow { transform: translateX(3px); }

  .nba-foot {
    margin-top: 22px;
    padding-top: 18px;
    border-top: 1px solid rgba(10,15,0,0.08);
    text-align: center;
    font-size: 13px;
    color: #9A9AA8;
  }
  .nba-foot-link {
    background: none; border: none; padding: 0;
    font: inherit; font-weight: 600; color: #0A0A0F;
    cursor: pointer; text-decoration: none;
  }
  .nba-foot-link:hover { text-decoration: underline; text-underline-offset: 3px; }

  .nba-page :focus-visible { outline: 2px solid #0A0A0F; outline-offset: 2px; border-radius: 8px; }
  .nba-input:focus-visible { outline: none; }

  @media (max-width: 520px) {
    .nba-page { padding: 76px 16px 40px; align-items: flex-start; }
    .nba-brand { left: 20px; }
    .nba-body { padding: 26px 22px 22px; }
    .nba-title { font-size: 28px; }
    .nba-row { flex-direction: column; gap: 14px; }
  }
  @media (prefers-reduced-motion: reduce) {
    .nba-card-wrap, .nba-mark::before { animation: none; }
    .nba-submit, .nba-submit-arrow { transition: none; }
    .nba-submit:hover:not(:disabled) { transform: none; }
  }
`

export function ArrowRight({ color = ACCENT }: { color?: string }) {
  return (
    <svg width="15" height="15" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <path d="M2.5 7h9M8 3.5l3.5 3.5L8 10.5" stroke={color} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export type AuthBrand = {
  word: string
  logoUrl: string
  /** false en whitelabel/tenant: no mostramos la etiqueta de producto */
  showTag: boolean
}

export function AuthShell({
  brand,
  eyebrow,
  stubRight,
  children,
}: {
  brand: AuthBrand
  eyebrow: string
  stubRight?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="nba-page">
      <style>{AUTH_CSS}</style>
      <div className="nba-glow" aria-hidden />
      <div className="nba-glow nba-glow--b" aria-hidden />

      <Link href="/" className="nba-brand">
        <span className="nba-brand-word">{brand.word}</span>
        {brand.showTag ? <span className="nba-brand-tag">organizer</span> : null}
      </Link>

      <div className="nba-card-wrap">
        <div className="nba-card">
          <div className="nba-stub">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={brand.logoUrl} alt="" className="nba-stub-logo" />
            ) : (
              <span className="nba-eyebrow">{eyebrow}</span>
            )}
            {stubRight}
          </div>
          <div className="nba-perf" aria-hidden />
          <div className="nba-body">{children}</div>
        </div>
      </div>
    </div>
  )
}

/**
 * Subrayado trazado a mano. Es identidad de Nubapay (el trazo es lima fijo),
 * así que en whitelabel/tenant el texto va sin marca.
 */
export function Mark({ on, children }: { on: boolean; children: React.ReactNode }) {
  if (!on) return <>{children}</>
  return <span className="nba-mark">{children}</span>
}

export function AuthField({
  id,
  label,
  ...rest
}: { id: string; label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="nba-field">
      <label className="nba-label" htmlFor={id}>
        {label}
      </label>
      <input id={id} className="nba-input" {...rest} />
    </div>
  )
}

export function AuthTextarea({
  id,
  label,
  ...rest
}: { id: string; label: string } & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <div className="nba-field">
      <label className="nba-label" htmlFor={id}>
        {label}
      </label>
      <textarea id={id} className="nba-input" {...rest} />
    </div>
  )
}

export function AuthError({ children }: { children: React.ReactNode }) {
  return (
    <div className="nba-error" role="alert">
      <svg width="15" height="15" viewBox="0 0 16 16" fill="none" style={{ flexShrink: 0, marginTop: '1px' }} aria-hidden="true">
        <circle cx="8" cy="8" r="6.4" stroke="currentColor" strokeWidth="1.3" />
        <path d="M8 5v3.4M8 10.8v.2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
      </svg>
      <span>{children}</span>
    </div>
  )
}

export function AuthSubmit({ children, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button className="nba-submit" {...rest}>
      {children}
      <span className="nba-submit-arrow" aria-hidden>
        <ArrowRight />
      </span>
    </button>
  )
}
