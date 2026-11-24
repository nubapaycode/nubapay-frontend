'use client'

import { useEffect, useRef, useState } from 'react'

import { gsap, ScrollTrigger } from './gsap'
import { prefersReducedMotion } from './hooks'
import RealPhone, { PHONE_SCREENS } from './RealPhone'

/*
 * iPhone 15 Pro en 3D real (three.js), modelado en código: cuerpo de titanio con canto redondeado,
 * vidrio frontal con reflejo del entorno, Dynamic Island, botones laterales y módulo de cámaras.
 * La pantalla es una textura armada con las capturas reales del flujo comprador.
 * Movimiento con GSAP: entrada girando desde abajo, gira al scrollear fuera del hero y hace un
 * pequeño giro al cambiar de pantalla. En "Cómo funciona" (`variant="journey"`) queda quieto en la
 * pose de reposo (o lo gira la sección a través de `spin`) y la pantalla cambia con un slide.
 * Se muestra el iPhone en SVG (`RealPhone`) en su lugar si no hay WebGL, si la aceleración por hardware
 * está desactivada, si el usuario pidió reducir las animaciones o si la carga tarda más de `LOAD_BUDGET`
 * (en ese caso, por el resto de la visita).
 *
 * Rendimiento: three.js (sólo las clases de `three-lite`) se descarga recién cuando el teléfono está
 * por entrar en pantalla y el navegador está libre; se dibuja sólo cuando algo cambia; las texturas de
 * pantalla se pintan al tamaño en que se ven (y las que no se muestran todavía, en ratos libres); y la
 * espalda, que en el recorrido nunca se ve, no se construye.
 * Arrastrando con el mouse se lo gira un poco (con tope elástico) y al soltar vuelve al reposo.
 */

type Three = typeof import('./three-lite')

/* Medidas reales en mm (iPhone 15 Pro: 70,6 × 146,6 × 8,25) */
const W = 70.6
const H = 146.6
const D = 8.25
const R = 11
const BEVEL = 1.2
const GLASS_W = W - BEVEL * 2
const GLASS_H = H - BEVEL * 2
const SCREEN_H = 139.6
const SCREEN_W = SCREEN_H * (1179 / 2556)
const SCREEN_R = 8.6

/* Pose de reposo: girado un poco hacia la izquierda (hacia el titular), mostrando el canto derecho */
const REST = { ry: -0.32, rx: 0.06, rz: 0.02 }
/* Alto del teléfono en pantalla (px) */
const PHONE_PX = 611

function roundedRect(T: Three, w: number, h: number, r: number) {
  const s = new T.Shape()
  const x = -w / 2
  const y = -h / 2
  s.moveTo(x + r, y)
  s.lineTo(x + w - r, y)
  s.absarc(x + w - r, y + r, r, -Math.PI / 2, 0, false)
  s.lineTo(x + w, y + h - r)
  s.absarc(x + w - r, y + h - r, r, 0, Math.PI / 2, false)
  s.lineTo(x + r, y + h)
  s.absarc(x + r, y + h - r, r, Math.PI / 2, Math.PI, false)
  s.lineTo(x, y + r)
  s.absarc(x + r, y + r, r, Math.PI, Math.PI * 1.5, false)
  return s
}

/** Plano con esquinas redondeadas y UV de 0 a 1 (para que la textura cubra justo la forma). */
function roundedPlane(T: Three, w: number, h: number, r: number) {
  const g = new T.ShapeGeometry(roundedRect(T, w, h, r), 32)
  const pos = g.attributes.position
  const uv = g.attributes.uv
  for (let i = 0; i < pos.count; i++) uv.setXY(i, pos.getX(i) / w + 0.5, pos.getY(i) / h + 0.5)
  return g
}

/** Carga y decodifica fuera del hilo principal (así `drawImage` no frena el frame). */
async function loadImage(src: string) {
  const img = new Image()
  img.decoding = 'async'
  img.src = src
  await img.decode()
  return img
}

/** Espera a que el navegador esté libre (con tope, para no quedar colgado en páginas muy ocupadas). */
function idle(timeout = 1200) {
  return new Promise<void>(resolve => {
    if ('requestIdleCallback' in window) window.requestIdleCallback(() => resolve(), { timeout })
    else setTimeout(resolve, 60)
  })
}

/** Resuelve cuando el elemento queda a menos de `margin` de la ventana. */
function nearViewport(el: Element, margin: string, signal: AbortSignal) {
  return new Promise<void>(resolve => {
    const io = new IntersectionObserver(entries => {
      if (entries.some(e => e.isIntersecting)) { io.disconnect(); resolve() }
    }, { rootMargin: margin })
    io.observe(el)
    signal.addEventListener('abort', () => io.disconnect())
  })
}

/** Tiempo máximo (ms) desde que arranca la carga hasta el primer frame; si se pasa, queda el SVG. */
const LOAD_BUDGET = 4000
/** Marca de sesión: si una vez tardó demasiado, en el resto de la visita ni se intenta el 3D. */
const SLOW_KEY = 'lv2-phone3d-slow'

function rememberedSlow() {
  try { return sessionStorage.getItem(SLOW_KEY) === '1' } catch { return false }
}
function rememberSlow() {
  try { sessionStorage.setItem(SLOW_KEY, '1') } catch { /* sin storage: se reintenta la próxima vez */ }
}

/** WebGL con aceleración por hardware. Con la aceleración desactivada el navegador o no da contexto
 *  (`failIfMajorPerformanceCaveat`) o lo dibuja por software (SwiftShader, llvmpipe, Microsoft Basic Render). */
function hasHardwareWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const opts = { failIfMajorPerformanceCaveat: true }
    const gl = (canvas.getContext('webgl2', opts) ?? canvas.getContext('webgl', opts)) as WebGLRenderingContext | null
    if (!gl) return false
    const info = gl.getExtension('WEBGL_debug_renderer_info')
    const renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : ''
    gl.getExtension('WEBGL_lose_context')?.loseContext()
    return !/swiftshader|llvmpipe|softpipe|software|basic render/i.test(renderer)
  } catch {
    return false
  }
}

/** Pantalla completa de iOS: barra de estado dibujada + la captura (que viene sin barra). */
function paintScreen(img: HTMLImageElement, dark: boolean, scale = 1) {
  const c = document.createElement('canvas')
  c.width = Math.round(1179 * scale)
  c.height = Math.round(2556 * scale)
  const g = c.getContext('2d')!
  g.scale(scale, scale)
  const fg = dark ? '#fff' : '#000'
  g.fillStyle = dark ? '#0B0B10' : '#fff'
  g.fillRect(0, 0, 1179, 2556)
  g.drawImage(img, 0, 2556 - 2394, 1179, 2394)

  g.fillStyle = fg
  g.font = '600 52px -apple-system, "SF Pro Text", system-ui, sans-serif'
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('9:41', 200, 98)
  /* Señal */
  for (let i = 0; i < 4; i++) {
    const h = 12 + i * 8
    g.beginPath()
    g.roundRect(845 + i * 15, 112 - h, 10, h, 3)
    g.fill()
  }
  /* Wi-Fi */
  g.lineWidth = 7
  g.lineCap = 'round'
  g.strokeStyle = fg
  for (const r of [10, 22, 34]) {
    g.beginPath()
    g.arc(938, 114, r, Math.PI * 1.25, Math.PI * 1.75)
    g.stroke()
  }
  /* Batería */
  g.lineWidth = 3
  g.globalAlpha = 0.45
  g.beginPath()
  g.roundRect(985, 82, 76, 36, 11)
  g.stroke()
  g.fillRect(1066, 93, 5, 14)
  g.globalAlpha = 1
  g.beginPath()
  g.roundRect(990, 87, 66, 26, 7)
  g.fill()
  return c
}

/** Banda de luz diagonal para el brillo del vidrio (se suma, así que el negro no aporta nada). */
function paintSheen() {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 1024
  const g = c.getContext('2d')!
  const grad = g.createLinearGradient(0, 0, 512, 1024)
  grad.addColorStop(0, '#000')
  grad.addColorStop(0.32, '#000')
  grad.addColorStop(0.42, '#fff')
  grad.addColorStop(0.47, '#777')
  grad.addColorStop(0.58, '#000')
  grad.addColorStop(1, '#000')
  g.fillStyle = grad
  g.fillRect(0, 0, 512, 1024)
  return c
}

/** Vidrio trasero esmerilado (grano fino) con el logo donde el original lleva el suyo. */
/** Familia del wordmark (Bricolage Grotesque, la grotesca del logo); si no está, la del contenedor */
function logoFont(host: HTMLElement) {
  const style = getComputedStyle(host)
  return style.getPropertyValue('--font-bricolage').trim() || style.fontFamily
}

function paintBack(font: string) {
  const c = document.createElement('canvas')
  c.width = 512
  c.height = 1064
  const g = c.getContext('2d')!
  g.fillStyle = '#2F2F34'
  g.fillRect(0, 0, c.width, c.height)
  const grain = g.getImageData(0, 0, c.width, c.height)
  for (let i = 0; i < grain.data.length; i += 4) {
    const n = (Math.random() - 0.5) * 7
    grain.data[i] += n
    grain.data[i + 1] += n
    grain.data[i + 2] += n
  }
  g.putImageData(grain, 0, 0)
  /* Logo tono sobre tono, un poco más oscuro que el vidrio (como el del original) */
  g.fillStyle = '#242428'
  g.font = `700 58px ${font}`
  g.textAlign = 'center'
  g.textBaseline = 'middle'
  g.fillText('nubapay', c.width / 2, c.height / 2)
  return c
}

/** Interior de la lente: elementos concéntricos, apertura violácea y reflejos del tratamiento antirreflejo. */
function paintLens() {
  const c = document.createElement('canvas')
  c.width = c.height = 512
  const g = c.getContext('2d')!
  const m = 256
  const bg = g.createRadialGradient(m, m, 0, m, m, m)
  bg.addColorStop(0, '#07070D')
  bg.addColorStop(0.55, '#0C0E17')
  bg.addColorStop(0.9, '#050507')
  bg.addColorStop(1, '#000')
  g.fillStyle = bg
  g.fillRect(0, 0, 512, 512)
  /* Anillos de los elementos internos */
  for (const [r, a] of [[236, 0.24], [205, 0.14], [176, 0.2], [146, 0.12], [118, 0.18]] as const) {
    g.strokeStyle = `rgba(150, 160, 200, ${a})`
    g.lineWidth = 3
    g.beginPath()
    g.arc(m, m, r, 0, Math.PI * 2)
    g.stroke()
  }
  /* Apertura con el tinte violeta/azul del recubrimiento */
  const ap = g.createRadialGradient(m - 14, m - 14, 4, m, m, 96)
  ap.addColorStop(0, '#5A4A9C')
  ap.addColorStop(0.35, '#241F4A')
  ap.addColorStop(0.75, '#0B0A18')
  ap.addColorStop(1, '#050508')
  g.fillStyle = ap
  g.beginPath()
  g.arc(m, m, 96, 0, Math.PI * 2)
  g.fill()
  g.fillStyle = '#020203'
  g.beginPath()
  g.arc(m, m, 34, 0, Math.PI * 2)
  g.fill()
  /* Reflejos de colores del antirreflejo */
  const glints: [number, number, number, string, number][] = [
    [m - 70, m - 82, 22, 'rgba(170, 120, 255, 0.55)', 1],
    [m + 96, m + 54, 14, 'rgba(90, 220, 255, 0.35)', 1],
    [m - 30, m + 120, 10, 'rgba(255, 180, 90, 0.3)', 1],
  ]
  for (const [x, y, r, col] of glints) {
    const gl = g.createRadialGradient(x, y, 0, x, y, r)
    gl.addColorStop(0, col)
    gl.addColorStop(1, 'rgba(0, 0, 0, 0)')
    g.fillStyle = gl
    g.beginPath()
    g.arc(x, y, r, 0, Math.PI * 2)
    g.fill()
  }
  return c
}

/** Flash True Tone: lente de Fresnel con anillos finos sobre fondo cálido. */
function paintFlash() {
  const c = document.createElement('canvas')
  c.width = c.height = 256
  const g = c.getContext('2d')!
  const m = 128
  const bg = g.createRadialGradient(m, m, 0, m, m, m)
  bg.addColorStop(0, '#FFF6DC')
  bg.addColorStop(0.6, '#E6DECB')
  bg.addColorStop(1, '#BDB6A6')
  g.fillStyle = bg
  g.fillRect(0, 0, 256, 256)
  g.strokeStyle = 'rgba(80, 70, 50, 0.16)'
  g.lineWidth = 2
  for (let r = 14; r < 128; r += 9) {
    g.beginPath()
    g.arc(m, m, r, 0, Math.PI * 2)
    g.stroke()
  }
  return c
}

type Api = { show: (i: number) => void }

/** Giro que maneja la sección desde afuera: radianes en Y y X, y `z` de 0 a 1 (se acerca a la cámara). */
export type PhoneSpin = { ry: number; rx: number; z: number }

export default function Phone3D({ screen, variant = 'hero', spin, lift = 0 }: {
  screen: number
  variant?: 'hero' | 'journey'
  spin?: React.RefObject<PhoneSpin>
  /** Cuántos px queda el teléfono por encima del centro del escenario */
  lift?: number
}) {
  const hostRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<Api | null>(null)
  const screenRef = useRef(screen)
  const [fallback, setFallback] = useState(false)

  useEffect(() => {
    screenRef.current = screen
    apiRef.current?.show(screen)
  }, [screen])

  useEffect(() => {
    const host = hostRef.current
    if (!host) return
    let disposed = false
    let cleanup = () => {}
    const abort = new AbortController()

    /* Se queda con el SVG: libera lo que se haya armado del 3D y muestra `RealPhone` */
    const giveUp = () => {
      if (disposed) return
      disposed = true
      abort.abort()
      cleanup()
      cleanup = () => {}
      setFallback(true)
    }
    let deadline: ReturnType<typeof setTimeout> | undefined
    /* Si la pestaña está en segundo plano el navegador frena todo: se espera a que vuelva */
    const onDeadline = () => {
      if (document.hidden) { deadline = setTimeout(onDeadline, 500); return }
      rememberSlow()
      giveUp()
    }

    ;(async () => {
      const hero = variant === 'hero'
      /* Sin animaciones (prefers-reduced-motion), sin aceleración por hardware o con una carga previa
         demasiado lenta en esta visita: va directo el SVG, sin descargar three.js */
      if (prefersReducedMotion() || rememberedSlow() || !hasHardwareWebGL()) { giveUp(); return }
      /* El hero arranca ya (está arriba de todo); el resto espera a estar cerca de la ventana */
      if (!hero) await nearViewport(host, '0px 0px 600px 0px', abort.signal)
      if (disposed) return
      deadline = setTimeout(onDeadline, LOAD_BUDGET)
      /* three.js y la primera captura bajan en paralelo; las otras capturas, después */
      const first = screenRef.current
      const [T, firstImg] = await Promise.all([import('./three-lite'), loadImage(PHONE_SCREENS[first].src), document.fonts.ready])
      await idle()
      if (disposed) return
      const { RoomEnvironment, RoundedBoxGeometry } = T

      const small = window.matchMedia('(max-width: 900px)').matches
      const dpr = Math.min(window.devicePixelRatio, small ? 1.5 : 2)
      /* Sin WebGL el constructor tira error y se cae al SVG (no hace falta abrir un contexto de prueba).
         MSAA sólo con pantallas de baja densidad: a 2x los bordes ya se ven suaves y ahorra memoria.
         `default` evita despertar la GPU dedicada en notebooks con dos placas. */
      const renderer = new T.WebGLRenderer({ antialias: dpr < 2, alpha: true, powerPreference: 'default' })
      renderer.setPixelRatio(dpr)
      renderer.toneMapping = T.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.05
      renderer.domElement.setAttribute('aria-hidden', 'true')
      host.appendChild(renderer.domElement)

      const scene = new T.Scene()
      const pmrem = new T.PMREMGenerator(renderer)
      const room = new RoomEnvironment()
      const envTex = pmrem.fromScene(room, 0.04).texture
      room.dispose()
      scene.environment = envTex
      const key = new T.DirectionalLight('#ffffff', 1.4)
      key.position.set(-60, 120, 160)
      scene.add(key)

      const camera = new T.PerspectiveCamera(26, 1, 10, 2000)
      pmrem.dispose()
      const disposables: { dispose: () => void }[] = [renderer, envTex]
      const keep = <X extends { dispose: () => void }>(x: X) => { disposables.push(x); return x }

      /* ── Modelo ── */
      const phone = new T.Group()
      const tilt = new T.Group()
      tilt.add(phone)
      scene.add(tilt)

      const titanium = keep(new T.MeshPhysicalMaterial({ color: '#46464C', metalness: 1, roughness: 0.3, clearcoat: 0.4, clearcoatRoughness: 0.2 }))
      const body = keep(new T.ExtrudeGeometry(roundedRect(T, GLASS_W, GLASS_H, R - BEVEL), {
        depth: D - BEVEL * 2, bevelEnabled: true, bevelSize: BEVEL, bevelThickness: BEVEL, bevelSegments: 10, curveSegments: 40,
      }))
      body.translate(0, 0, -(D - BEVEL * 2) / 2)
      phone.add(new T.Mesh(body, titanium))

      const front = D / 2
      const glassGeo = keep(roundedPlane(T, GLASS_W, GLASS_H, R - BEVEL))
      const bezel = new T.Mesh(glassGeo, keep(new T.MeshStandardMaterial({ color: '#030304', roughness: 0.2 })))
      bezel.position.z = front + 0.01
      phone.add(bezel)

      /* Pantallas: se pintan al tamaño en que se ven (con un 15% de margen), no a los 1179×2556 de la
         captura: a 2x eso es ~4 veces menos memoria de GPU y de subida. Sin mipmaps (se ven casi 1:1). */
      const texScale = Math.min(1, (PHONE_PX * dpr * (SCREEN_H / H) * 1.15) / 2556)
      const makeScreen = (img: HTMLImageElement, i: number) => {
        const tex = keep(new T.CanvasTexture(paintScreen(img, PHONE_SCREENS[i].dark, texScale)))
        tex.colorSpace = T.SRGBColorSpace
        tex.generateMipmaps = false
        tex.minFilter = T.LinearFilter
        return tex
      }
      const screens: (InstanceType<Three['CanvasTexture']> | undefined)[] = PHONE_SCREENS.map(() => undefined)
      screens[first] = makeScreen(firstImg, first)
      /* Las demás capturas se cargan, pintan y suben a la GPU en ratos libres, para que el slide no trabe */
      const pending = new Map<number, Promise<void>>()
      const ensureScreen = (i: number) => {
        if (screens[i] || !PHONE_SCREENS[i]) return Promise.resolve()
        let p = pending.get(i)
        if (!p) {
          p = loadImage(PHONE_SCREENS[i].src).then(async img => {
            if (disposed || screens[i]) return
            screens[i] = makeScreen(img, i)
            await idle(400)
            if (!disposed) renderer.initTexture(screens[i]!)
          }).catch(() => { pending.delete(i) })
          pending.set(i, p)
        }
        return p
      }
      const screenGeo = keep(roundedPlane(T, SCREEN_W, SCREEN_H, SCREEN_R))
      /* Pantalla al 90% de brillo (sin tone mapping, como un display que emite luz).
         Cambio de pantalla con slide estilo iOS: la nueva entra completa desde un costado y la
         anterior se corre al 30% oscureciéndose (parallax). `dir` 1 = avanzar, -1 = volver. */
      const screenMat = keep(new T.ShaderMaterial({
        uniforms: {
          mapA: { value: screens[first] },
          mapB: { value: screens[first] },
          p: { value: 0 },
          dir: { value: 1 },
        },
        vertexShader: /* glsl */`
          varying vec2 vUv;
          void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
        fragmentShader: /* glsl */`
          uniform sampler2D mapA, mapB;
          uniform float p, dir;
          varying vec2 vUv;
          void main() {
            float x = vUv.x;
            vec4 c;
            if (dir > 0.0) {
              float edge = 1.0 - p;
              c = x >= edge
                ? texture2D(mapB, vec2(x - edge, vUv.y))
                : texture2D(mapA, vec2(x + p * 0.3, vUv.y)) * (1.0 - 0.25 * p);
            } else {
              c = x >= p
                ? texture2D(mapA, vec2(x - p, vUv.y))
                : texture2D(mapB, vec2(x + (1.0 - p) * 0.3, vUv.y)) * (1.0 - 0.25 * (1.0 - p));
            }
            gl_FragColor = vec4(c.rgb, 1.0);
            #include <colorspace_fragment>
            gl_FragColor.rgb *= 0.9; // brillo al 90% (en sRGB, como un brightness(0.9))
          }`,
        toneMapped: false,
      }))
      const slide = screenMat.uniforms
      const base = new T.Mesh(screenGeo, screenMat)
      base.position.z = front + 0.02
      phone.add(base)

      const island = new T.Mesh(keep(roundedPlane(T, 20.6, 6.1, 3.05)), keep(new T.MeshStandardMaterial({ color: '#000', roughness: 0.3 })))
      island.position.set(0, SCREEN_H / 2 - 1.8 - 3.05, front + 0.04)
      phone.add(island)

      /* Vidrio: refleja el entorno (negro aditivo = sólo el brillo) + una banda de luz que se corre al girar */
      const glass = new T.Mesh(glassGeo, keep(new T.MeshPhysicalMaterial({
        color: '#000', roughness: 0.04, clearcoat: 1, transparent: true, blending: T.AdditiveBlending, depthWrite: false, envMapIntensity: 1.4,
      })))
      glass.position.z = front + 0.05
      const sheenTex = keep(new T.CanvasTexture(paintSheen()))
      sheenTex.colorSpace = T.SRGBColorSpace
      const sheenMat = keep(new T.MeshBasicMaterial({ map: sheenTex, transparent: true, opacity: 0.16, blending: T.AdditiveBlending, depthWrite: false, toneMapped: false }))
      const sheen = new T.Mesh(glassGeo, sheenMat)
      sheen.position.z = front + 0.06
      phone.add(glass, sheen)

      /* Botones: acción, volumen + y − a la izquierda; encendido a la derecha */
      for (const [x, y, h] of [[-1, 42.2, 5.6], [-1, 29, 11.1], [-1, 14.9, 11.1], [1, 18.1, 17.6]]) {
        const b = new T.Mesh(keep(new RoundedBoxGeometry(1.4, h, 3.4, 4, 0.6)), titanium)
        b.position.set(x * (W / 2 - 0.1), y, 0)
        phone.add(b)
      }

      /* Bandas de antena: cortes finos en el marco, cerca de las esquinas */
      const bandMat = keep(new T.MeshStandardMaterial({ color: '#8A8A90', roughness: 0.55 }))
      const bandSide = keep(new T.BoxGeometry(0.4, 0.9, D - 2))
      const bandEdge = keep(new T.BoxGeometry(0.9, 0.4, D - 2))
      for (const [x, y, side] of [[-1, 1, true], [-1, -1, true], [1, 1, true], [1, -1, true], [-14, 1, false], [14, -1, false]] as const) {
        const b = new T.Mesh(side ? bandSide : bandEdge, bandMat)
        if (side) b.position.set(x * (W / 2 - 0.15), y * (H / 2 - 13.5), 0)
        else b.position.set(x, y * (H / 2 - 0.15), 0)
        phone.add(b)
      }

      /* La espalda sólo se ve si el teléfono gira solo (hero, `spin`); el arrastre tiene tope y no llega.
         En el recorrido no se construye (ni sus texturas ni sus shaders). */
      const buildBack = () => {
        /* ── Espalda, tomada de las fotos de Apple: vidrio esmerilado, meseta de vidrio pulido con
           canto suave, tres lentes con aro de titanio alto y biselado, flash, LiDAR y micrófono ── */
        const backTex = keep(new T.CanvasTexture(paintBack(logoFont(host))))
        backTex.colorSpace = T.SRGBColorSpace
        const backGlass = new T.Mesh(glassGeo, keep(new T.MeshPhysicalMaterial({ map: backTex, roughness: 0.62, clearcoat: 0.25, clearcoatRoughness: 0.7 })))
        backGlass.rotation.y = Math.PI
        backGlass.position.z = -front - 0.01
        phone.add(backGlass)

        /* La meseta usa coordenadas "vistas desde atrás": +x a la derecha de quien mira la espalda */
        const PLATEAU = 37.5
        const plateau = new T.Group()
        plateau.position.set(GLASS_W / 2 - 2.6 - PLATEAU / 2, GLASS_H / 2 - 2.6 - PLATEAU / 2, -front)
        plateau.rotation.y = Math.PI
        phone.add(plateau)
        const plateauGeo = keep(new T.ExtrudeGeometry(roundedRect(T, PLATEAU - 2, PLATEAU - 2, 9), {
          depth: 0.1, bevelEnabled: true, bevelSize: 1, bevelThickness: 1.1, bevelSegments: 14, curveSegments: 32,
        }))
        plateau.add(new T.Mesh(plateauGeo, keep(new T.MeshPhysicalMaterial({ color: '#232327', roughness: 0.16, clearcoat: 1, clearcoatRoughness: 0.05 }))))
        const deck = 1.2

        /* Aro de titanio: perfil girado (base, pared, bisel pulido arriba y pared interna) */
        const ringGeo = keep(new T.LatheGeometry([
          new T.Vector2(6.95, 1.15), new T.Vector2(7.0, 1.75), new T.Vector2(7.25, 1.97), new T.Vector2(7.75, 1.97),
          new T.Vector2(8.0, 1.72), new T.Vector2(8.0, 0.38), new T.Vector2(7.9, 0.3),
        ], 72))
        const ringMat = keep(new T.MeshPhysicalMaterial({ color: '#77777E', metalness: 1, roughness: 0.16, clearcoat: 0.8, clearcoatRoughness: 0.1, side: T.DoubleSide }))
        const gasketGeo = keep(new T.CylinderGeometry(8.05, 8.05, 0.4, 72, 1, true))
        const gasketMat = keep(new T.MeshStandardMaterial({ color: '#0A0A0C', roughness: 0.5, side: T.DoubleSide }))
        const lipGeo = keep(new T.RingGeometry(6.05, 6.98, 72))
        const lipMat = keep(new T.MeshStandardMaterial({ color: '#050506', roughness: 0.35 }))
        const lensTex = keep(new T.CanvasTexture(paintLens()))
        lensTex.colorSpace = T.SRGBColorSpace
        lensTex.anisotropy = renderer.capabilities.getMaxAnisotropy()
        const lensGeo = keep(new T.CircleGeometry(6.05, 72))
        const lensMat = keep(new T.MeshPhysicalMaterial({ map: lensTex, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0, envMapIntensity: 1.6 }))
        for (const [lx, ly] of [[-8.9, 9], [-8.9, -9], [8.9, 0]]) {
          const ring = new T.Mesh(ringGeo, ringMat)
          ring.rotation.x = Math.PI / 2
          ring.position.set(lx, ly, deck)
          const gasket = new T.Mesh(gasketGeo, gasketMat)
          gasket.rotation.x = Math.PI / 2
          gasket.position.set(lx, ly, deck + 0.2)
          const lip = new T.Mesh(lipGeo, lipMat)
          lip.position.set(lx, ly, deck + 1.5)
          const lens = new T.Mesh(lensGeo, lensMat)
          lens.position.set(lx, ly, deck + 1.42)
          plateau.add(ring, gasket, lip, lens)
        }

        const flashTex = keep(new T.CanvasTexture(paintFlash()))
        flashTex.colorSpace = T.SRGBColorSpace
        const flash = new T.Mesh(keep(new T.CircleGeometry(2.6, 48)), keep(new T.MeshPhysicalMaterial({ map: flashTex, roughness: 0.3, clearcoat: 1 })))
        flash.position.set(9.6, 11.4, deck + 0.02)
        const flashRim = new T.Mesh(keep(new T.RingGeometry(2.6, 3.1, 48)), lipMat)
        flashRim.position.set(9.6, 11.4, deck + 0.01)
        const dark = keep(new T.MeshPhysicalMaterial({ color: '#08070C', roughness: 0.08, clearcoat: 1, iridescence: 0.6, iridescenceIOR: 1.5 }))
        const lidar = new T.Mesh(keep(new T.CircleGeometry(2.4, 48)), dark)
        lidar.position.set(9.6, -11.6, deck + 0.02)
        const mic = new T.Mesh(keep(new T.CircleGeometry(0.45, 20)), lipMat)
        mic.position.set(13.9, -12.9, deck + 0.02)
        plateau.add(flash, flashRim, lidar, mic)
      }
      if (hero || spin) buildBack()

      /* ── Encuadre: el teléfono mide PHONE_PX de alto y queda `lift` px arriba del centro del escenario ── */
      const stage = host.parentElement!
      let pxToWorld = 1
      const fit = () => {
        const w = host.clientWidth
        const h = host.clientHeight
        if (!w || !h) return
        renderer.setSize(w, h, false)
        camera.aspect = w / h
        const phonePx = Math.min(PHONE_PX, stage.clientHeight * 0.92, stage.clientWidth * 1.4)
        pxToWorld = H / phonePx
        const visibleH = h * pxToWorld
        camera.position.set(0, 0, visibleH / 2 / Math.tan(T.MathUtils.degToRad(camera.fov / 2)))
        camera.updateProjectionMatrix()
        const hr = host.getBoundingClientRect()
        const sr = stage.getBoundingClientRect()
        const offsetPx = (hr.top + hr.height / 2) - (sr.top + sr.height / 2 - lift)
        tilt.position.y = offsetPx * pxToWorld
        dirty = true
      }

      /* ── Movimiento ── */
      const pose = hero ? { ry: 1.9, rx: 0.5, rz: -0.12, y: -150, s: 0.86 } : { ...REST, y: 0, s: 1 }
      const scroll = { ry: 0, rx: 0, y: 0 }
      const flick = { v: 0 }
      /* Giro con el mouse: se suma a la pose, con tope, y al soltar vuelve a cero */
      const drag = { ry: 0, rx: 0 }
      let visible = true
      let dirty = true

      const tweens: (gsap.core.Tween | gsap.core.Timeline)[] = []
      let st: ScrollTrigger | null = null
      if (hero) {
        tweens.push(gsap.to(pose, { ...REST, y: 0, s: 1, duration: 2.2, ease: 'expo.out', delay: 0.15 }))
        const section = host.closest('section')
        if (section) {
          const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: 1.2 } })
          tl.to(scroll, { ry: 0.9, rx: 0.22, y: 30, ease: 'none' })
          st = tl.scrollTrigger ?? null
          tweens.push(tl)
        }
      }

      /* Índices de las capturas en las dos capas del slide (A = la que se ve, B = la que entra) */
      let cur = first
      let next = first
      const show = (i: number) => {
        /* Si había un slide a medias, se da por terminado y el nuevo arranca desde ahí */
        gsap.killTweensOf(slide.p)
        if (slide.p.value > 0) { slide.mapA.value = slide.mapB.value; slide.p.value = 0; cur = next }
        if (i === cur || !PHONE_SCREENS[i]) return
        const tex = screens[i]
        /* Todavía no está pintada (scroll muy rápido): se muestra apenas esté, si sigue siendo la pedida */
        if (!tex) { ensureScreen(i).then(() => { if (!disposed && screenRef.current === i) show(i) }); return }
        slide.mapB.value = tex
        slide.dir.value = i >= cur ? 1 : -1
        next = i
        gsap.to(slide.p, {
          value: 1, duration: 0.7, ease: 'power3.inOut',
          onUpdate: () => { dirty = true },
          onComplete: () => { slide.mapA.value = tex; slide.p.value = 0; cur = i; dirty = true },
        })
        if (hero) gsap.timeline()
          .to(flick, { v: 0.16, duration: 0.45, ease: 'power2.out', overwrite: 'auto' })
          .to(flick, { v: 0, duration: 1.1, ease: 'power3.inOut' })
      }
      apiRef.current = { show }

      const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; dirty = true })
      io.observe(host)
      const ro = new ResizeObserver(fit)
      ro.observe(host)
      fit()

      /* Se dibuja sólo cuando cambia algo: la pose (entrada, scroll, giro externo), el slide o el tamaño.
         Con el teléfono quieto no hay ningún frame de GPU. */
      let last = ''
      const tick = () => {
        if (!visible) return
        const ext = spin?.current
        const rx = pose.rx + scroll.rx + drag.rx + (ext?.rx ?? 0)
        const ry = pose.ry + scroll.ry + flick.v + drag.ry + (ext?.ry ?? 0)
        const y = pose.y + scroll.y
        const z = (ext?.z ?? 0) * 14
        const key = `${rx.toFixed(4)},${ry.toFixed(4)},${pose.rz.toFixed(4)},${y.toFixed(3)},${z.toFixed(3)},${pose.s.toFixed(4)}`
        if (!dirty && key === last) return
        last = key
        phone.rotation.set(rx, ry, pose.rz)
        phone.position.set(0, y, z)
        phone.scale.setScalar(pose.s)
        /* La banda de luz se corre con el giro, como un reflejo real */
        sheenTex.offset.set(-ry * 0.55, rx * 0.4)
        renderer.render(scene, camera)
        dirty = false
      }
      /* ── Arrastrar para girar un poco: el giro tiene tope con resistencia elástica (cuanto más se tira,
         menos gira) y al soltar vuelve al reposo. Con los topes nunca llega a verse la espalda. ── */
      const canvas = renderer.domElement
      const LIMIT_Y = 0.55 // ~31° hacia cada lado
      const LIMIT_X = 0.22 // ~13° arriba/abajo
      const soft = (raw: number, limit: number) => limit * Math.tanh(raw / limit)
      let press: { x: number; y: number } | null = null
      const onDown = (e: PointerEvent) => {
        if (e.button !== 0) return
        gsap.killTweensOf(drag)
        canvas.setPointerCapture(e.pointerId)
        canvas.classList.add('is-dragging')
        /* Arranca desde donde esté (si se lo agarra mientras vuelve) */
        press = {
          x: e.clientX - Math.atanh(gsap.utils.clamp(-0.99, 0.99, drag.ry / LIMIT_Y)) * LIMIT_Y / 0.009,
          y: e.clientY - Math.atanh(gsap.utils.clamp(-0.99, 0.99, drag.rx / LIMIT_X)) * LIMIT_X / 0.005,
        }
      }
      const onMove = (e: PointerEvent) => {
        if (!press) return
        drag.ry = soft((e.clientX - press.x) * 0.009, LIMIT_Y)
        drag.rx = soft((e.clientY - press.y) * 0.005, LIMIT_X)
      }
      const onUp = (e: PointerEvent) => {
        if (!press) return
        press = null
        canvas.releasePointerCapture(e.pointerId)
        canvas.classList.remove('is-dragging')
        gsap.to(drag, { ry: 0, rx: 0, duration: 1.1, ease: 'elastic.out(1, 0.75)' })
      }
      canvas.addEventListener('pointerdown', onDown)
      canvas.addEventListener('pointermove', onMove)
      canvas.addEventListener('pointerup', onUp)
      canvas.addEventListener('pointercancel', onUp)

      cleanup = () => {
        canvas.removeEventListener('pointerdown', onDown)
        canvas.removeEventListener('pointermove', onMove)
        canvas.removeEventListener('pointerup', onUp)
        canvas.removeEventListener('pointercancel', onUp)
        gsap.ticker.remove(tick)
        tweens.forEach(t => t.kill())
        st?.kill()
        gsap.killTweensOf([slide.p, flick, drag])
        io.disconnect()
        ro.disconnect()
        disposables.forEach(d => d.dispose())
        renderer.domElement.remove()
        apiRef.current = null
      }
      if (disposed) { cleanup(); return }

      /* Los shaders se compilan en paralelo (KHR_parallel_shader_compile) antes del primer frame,
         así el primer render no congela el hilo principal; recién ahí aparece el teléfono. */
      await renderer.compileAsync(scene, camera)
      /* Si se desmontó mientras compilaba, el cleanup ya liberó todo */
      if (disposed) return
      clearTimeout(deadline)
      gsap.ticker.add(tick)
      tick()
      host.classList.add('is-ready')
      /* Si la sección cambió de paso mientras cargaba, se pasa a la pantalla actual */
      if (screenRef.current !== first) show(screenRef.current)
      /* El resto de las capturas, en ratos libres y en orden de cercanía a la actual */
      PHONE_SCREENS.map((_, i) => i).sort((a, b) => Math.abs(a - first) - Math.abs(b - first)).forEach(i => { void ensureScreen(i) })
    })().catch(giveUp)

    return () => {
      clearTimeout(deadline)
      disposed = true
      abort.abort()
      cleanup()
    }
  }, [variant, spin, lift])

  if (fallback) {
    /* Mismo comportamiento que el SVG que se usa en cada sección: el hero con prioridad, el recorrido con slide */
    return <div className="lv2-phone-wrap"><RealPhone screen={screen} eager={variant === 'hero'} slide={variant === 'journey'} /></div>
  }
  return (
    <div
      ref={hostRef}
      className="lv2-phone3d"
      role="img"
      aria-label={PHONE_SCREENS[screen]?.alt ?? PHONE_SCREENS[0].alt}
    />
  )
}
