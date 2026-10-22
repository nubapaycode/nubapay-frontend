/**
 * Composiciones en tinta negra sobre papel blanco para las tarjetas del menú: formas sólidas,
 * línea fina y trama de puntos, pero con motivos reconocibles (celular, dashboard, escenario).
 * Son SVG con `meet` para verse completas en la tarjeta alta (desktop) y en la miniatura
 * cuadrada (mobile). La tinta es `currentColor` y el papel `--lv-art-paper`; las piezas
 * `lv2-art-*` las anima GSAP.
 */

export type MenuArtKind = 'flow' | 'panel' | 'crowd'

const INK = 'currentColor'
const PAPER = 'var(--lv-art-paper, #fff)'
const HAIRLINE = { fill: 'none', stroke: INK, strokeWidth: 1.5, vectorEffect: 'non-scaling-stroke' } as const

/* Cómo funciona: celular con el QR del pedido */
const QR = { x: 84, y: 78, m: 8 }
const QR_FINDERS = [[0, 0], [6, 0], [0, 6]]
const QR_CELLS = [
  [4, 0], [3, 1], [5, 1], [4, 2], [0, 4], [2, 4], [3, 3], [5, 3], [4, 4], [6, 4], [8, 4], [1, 5],
  [7, 3], [8, 5], [3, 5], [5, 5], [4, 6], [6, 6], [8, 6], [3, 7], [5, 7], [7, 7], [4, 8], [6, 8], [8, 8],
]

function Flow() {
  const { x, y, m } = QR
  return (
    <>
      <rect x="62" y="24" width="116" height="232" rx="22" fill={INK} />
      <rect x="70" y="32" width="100" height="216" rx="15" fill={PAPER} />
      <rect x="104" y="40" width="32" height="8" rx="4" fill={INK} />
      {QR_FINDERS.map(([c, r]) => (
        <g key={`f${c}${r}`}>
          <rect x={x + c * m} y={y + r * m} width={m * 3} height={m * 3} rx="2" fill={INK} />
          <rect x={x + c * m + 4} y={y + r * m + 4} width={m * 3 - 8} height={m * 3 - 8} rx="1" fill={PAPER} />
          <rect x={x + c * m + 8} y={y + r * m + 8} width={m} height={m} fill={INK} />
        </g>
      ))}
      {QR_CELLS.map(([c, r]) => (
        <rect key={`c${c}${r}`} className="lv2-art-qr" x={x + c * m + 1} y={y + r * m + 1} width={m - 2} height={m - 2} rx="1" fill={INK} />
      ))}
      <rect x="88" y="174" width="64" height="20" rx="10" fill={INK} />
      <line x1="96" y1="214" x2="144" y2="214" {...HAIRLINE} />
      <line x1="106" y1="224" x2="134" y2="224" {...HAIRLINE} />
    </>
  )
}

/* Panel: ventana de dashboard con KPIs y láminas que crecen como las ventas (en reposo GSAP las deja bajas y parejas) */
const SLABS = Array.from({ length: 8 }, (_, i) => {
  const width = (k: number) => 5 + k * 2.4
  const x = 46 + Array.from({ length: i }, (_, k) => width(k) + 6).reduce((a, b) => a + b, 0)
  return { x, w: width(i), top: 226 - (36 + i * 11) }
})

function Panel() {
  return (
    <>
      <rect x="18" y="52" width="204" height="196" rx="14" {...HAIRLINE} />
      <line x1="18" y1="74" x2="222" y2="74" {...HAIRLINE} />
      {[32, 42, 52].map(cx => <circle key={cx} cx={cx} cy="63" r="3" fill={INK} />)}
      <rect x="36" y="90" width="38" height="7" rx="3.5" fill={INK} />
      <rect x="36" y="102" width="22" height="4" rx="2" fill={INK} opacity="0.35" />
      {SLABS.map(s => (
        <polygon
          key={s.x}
          className="lv2-art-slab"
          data-h={226 - s.top}
          points={`${s.x},${s.top + 6} ${s.x + s.w},${s.top} ${s.x + s.w},226 ${s.x},226`}
          fill={INK}
        />
      ))}
      <line x1="34" y1="232" x2="206" y2="232" {...HAIRLINE} />
    </>
  )
}

/* Caso real: domo mitad sólido / mitad ondas sobre el escenario, el público en trama y siluetas adelante */
const RINGS = Array.from({ length: 8 }, (_, i) => ({ r: 10 + i * 7.6, dx: i * 1.4 }))
const DOTS = Array.from({ length: 3 }, (_, row) =>
  Array.from({ length: 13 }, (_, col) => {
    const r = (1.3 + row * 0.8) * (0.7 + 0.3 * Math.sin(col * 0.9 + row * 1.7))
    return { x: 30 + col * 15, y: 186 + row * 13, r: Math.round(r * 100) / 100 }
  }),
).flat()
const PEOPLE = [36, 78, 120, 162, 204]

function Crowd() {
  return (
    <>
      <defs>
        <clipPath id="lv2-art-dome">
          <path d="M120 86 A64 64 0 0 1 184 150 L120 150 Z" />
        </clipPath>
      </defs>
      {/* Domo */}
      <path d="M120 86 A64 64 0 0 0 56 150 L120 150 Z" fill={INK} />
      <g clipPath="url(#lv2-art-dome)">
        <g className="lv2-art-waves">
          {RINGS.map(c => <circle key={c.r} cx={120 - c.dx} cy="150" r={c.r} {...HAIRLINE} strokeWidth={1.2} />)}
        </g>
      </g>
      <path d="M120 86 A64 64 0 0 1 184 150" {...HAIRLINE} />
      {/* Escenario y parlantes */}
      <rect x="30" y="150" width="180" height="16" fill={INK} />
      {[30, 190].map(sx => (
        <g key={sx}>
          <rect x={sx} y="100" width="20" height="50" fill={INK} />
          <circle cx={sx + 10} cy="114" r="5" fill={PAPER} />
          <circle cx={sx + 10} cy="134" r="7" fill={PAPER} />
        </g>
      ))}
      {/* Público a lo lejos */}
      {DOTS.map(d => <circle key={`${d.x}-${d.y}`} className="lv2-art-dot" cx={d.x} cy={d.y} r={d.r} fill={INK} />)}
      {/* Siluetas adelante */}
      {PEOPLE.map(px => (
        <g key={px}>
          <circle cx={px} cy="262" r="10" fill={INK} />
          <path d={`M${px - 22} 294 Q${px} 260 ${px + 22} 294 Z`} fill={INK} />
        </g>
      ))}
    </>
  )
}

export default function MenuArt({ kind }: { kind: MenuArtKind }) {
  return (
    <svg className="lv2-menu-art" data-art={kind} viewBox="0 0 240 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      {kind === 'flow' && <Flow />}
      {kind === 'panel' && <Panel />}
      {kind === 'crowd' && <Crowd />}
    </svg>
  )
}
