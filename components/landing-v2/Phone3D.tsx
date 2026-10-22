'use client'

import { useEffect, useRef, useState } from 'react'

import { gsap, ScrollTrigger } from './gsap'
import { prefersReducedMotion } from './hooks'
import RealPhone, { PHONE_SCREENS } from './RealPhone'

/*
 * iPhone 15 Pro en 3D real (three.js), modelado en código: cuerpo de titanio con canto redondeado,
 * vidrio frontal con reflejo del entorno, Dynamic Island, botones laterales y módulo de cámaras.
 * La pantalla es una textura armada con las capturas reales del flujo comprador.
 * Movimiento con GSAP: entrada girando desde abajo, flotación suave,
 * gira al scrollear fuera del hero y hace un pequeño giro al cambiar de pantalla.
 * En "Cómo funciona" (`variant="journey"`) el giro lo maneja la sección a través de `spin`
 * (una vuelta de 360° por paso) y la pantalla cambia de golpe, a mitad de vuelta, cuando se ve la espalda.
 * Si no hay WebGL se muestra el iPhone en SVG (`RealPhone`).
 */

type Three = typeof import('three')

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

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image()
    img.decoding = 'async'
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** Pantalla completa de iOS: barra de estado dibujada + la captura (que viene sin barra). */
function paintScreen(img: HTMLImageElement, dark: boolean) {
  const c = document.createElement('canvas')
  c.width = 1179
  c.height = 2556
  const g = c.getContext('2d')!
  const fg = dark ? '#fff' : '#000'
  g.fillStyle = dark ? '#0B0B10' : '#fff'
  g.fillRect(0, 0, c.width, c.height)
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

    ;(async () => {
      const probe = document.createElement('canvas')
      if (!probe.getContext('webgl2') && !probe.getContext('webgl')) throw new Error('Sin WebGL')

      const [T, { RoomEnvironment }, { RoundedBoxGeometry }] = await Promise.all([
        import('three'),
        import('three/examples/jsm/environments/RoomEnvironment.js'),
        import('three/examples/jsm/geometries/RoundedBoxGeometry.js'),
      ])
      const [imgs] = await Promise.all([Promise.all(PHONE_SCREENS.map(s => loadImage(s.src))), document.fonts.ready])
      if (disposed) return

      const reduced = prefersReducedMotion()
      const renderer = new T.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
      renderer.toneMapping = T.ACESFilmicToneMapping
      renderer.toneMappingExposure = 1.05
      renderer.domElement.setAttribute('aria-hidden', 'true')
      host.appendChild(renderer.domElement)

      const scene = new T.Scene()
      const pmrem = new T.PMREMGenerator(renderer)
      const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
      scene.environment = envTex
      const key = new T.DirectionalLight('#ffffff', 1.4)
      key.position.set(-60, 120, 160)
      scene.add(key)

      const camera = new T.PerspectiveCamera(26, 1, 10, 2000)
      const disposables: { dispose: () => void }[] = [renderer, pmrem, envTex]
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

      /* Pantalla: dos capas para hacer el fundido entre capturas */
      const screens = imgs.map((img, i) => {
        const tex = keep(new T.CanvasTexture(paintScreen(img, PHONE_SCREENS[i].dark)))
        tex.colorSpace = T.SRGBColorSpace
        tex.anisotropy = renderer.capabilities.getMaxAnisotropy()
        return tex
      })
      const screenGeo = keep(roundedPlane(T, SCREEN_W, SCREEN_H, SCREEN_R))
      /* Brillo de la pantalla al 80% (en sRGB, como un brightness(0.8)) para que no se vea quemada */
      const dim = new T.Color().setRGB(0.8, 0.8, 0.8, T.SRGBColorSpace)
      const baseMat = keep(new T.MeshBasicMaterial({ map: screens[screenRef.current], color: dim, toneMapped: false }))
      const topMat = keep(new T.MeshBasicMaterial({ map: screens[screenRef.current], color: dim, toneMapped: false, transparent: true, opacity: 0 }))
      const base = new T.Mesh(screenGeo, baseMat)
      base.position.z = front + 0.02
      const top = new T.Mesh(screenGeo, topMat)
      top.position.z = front + 0.03
      phone.add(base, top)

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

      /* ── Espalda, tomada de las fotos de Apple: vidrio esmerilado, meseta de vidrio pulido con
         canto suave, tres lentes con aro de titanio alto y biselado, flash, LiDAR y micrófono ── */
      const backTex = keep(new T.CanvasTexture(paintBack(getComputedStyle(host).fontFamily)))
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
      const hero = variant === 'hero'
      const pose = reduced || !hero ? { ...REST, y: 0, s: 1 } : { ry: 1.9, rx: 0.5, rz: -0.12, y: -150, s: 0.86 }
      const scroll = { ry: 0, rx: 0, y: 0 }
      const flick = { v: 0 }
      let visible = true
      let dirty = true

      const tweens: (gsap.core.Tween | gsap.core.Timeline)[] = []
      let st: ScrollTrigger | null = null
      if (!reduced && hero) {
        tweens.push(gsap.to(pose, { ...REST, y: 0, s: 1, duration: 2.2, ease: 'expo.out', delay: 0.15 }))
        const section = host.closest('section')
        if (section) {
          const tl = gsap.timeline({ scrollTrigger: { trigger: section, start: 'top top', end: 'bottom top', scrub: 1.2 } })
          tl.to(scroll, { ry: 0.9, rx: 0.22, y: 30, ease: 'none' })
          st = tl.scrollTrigger ?? null
          tweens.push(tl)
        }
      }

      const show = (i: number) => {
        const tex = screens[i]
        if (!tex || baseMat.map === tex) return
        /* En "Cómo funciona" el cambio ocurre de espaldas: no hace falta fundido */
        if (reduced || !hero) {
          baseMat.map = tex
          dirty = true
          return
        }
        topMat.map = tex
        topMat.needsUpdate = true
        gsap.fromTo(topMat, { opacity: 0 }, {
          opacity: 1, duration: 0.6, ease: 'power2.inOut', overwrite: 'auto',
          onComplete: () => { baseMat.map = tex; baseMat.needsUpdate = true; topMat.opacity = 0 },
        })
        gsap.timeline()
          .to(flick, { v: 0.16, duration: 0.45, ease: 'power2.out', overwrite: 'auto' })
          .to(flick, { v: 0, duration: 1.1, ease: 'power3.inOut' })
      }
      apiRef.current = { show }

      const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; dirty = true })
      io.observe(host)
      const ro = new ResizeObserver(fit)
      ro.observe(host)
      fit()

      const tick = (time: number) => {
        if (!visible) return
        if (reduced && !dirty) return
        const bob = reduced ? 0 : Math.sin(time * 1.1) * 1.2
        const ext = spin?.current
        phone.rotation.set(
          pose.rx + scroll.rx + (ext?.rx ?? 0),
          pose.ry + scroll.ry + flick.v + (ext?.ry ?? 0),
          pose.rz + (reduced ? 0 : Math.sin(time * 0.7) * 0.012),
        )
        phone.position.y = pose.y + scroll.y + bob
        phone.position.z = (ext?.z ?? 0) * 14
        phone.scale.setScalar(pose.s)
        /* La banda de luz se corre con el giro, como un reflejo real */
        sheenTex.offset.set(-phone.rotation.y * 0.55, phone.rotation.x * 0.4)
        renderer.render(scene, camera)
        dirty = false
      }
      gsap.ticker.add(tick)
      if (!disposed) host.classList.add('is-ready')

      cleanup = () => {
        gsap.ticker.remove(tick)
        tweens.forEach(t => t.kill())
        st?.kill()
        gsap.killTweensOf([topMat, flick])
        io.disconnect()
        ro.disconnect()
        disposables.forEach(d => d.dispose())
        renderer.domElement.remove()
        apiRef.current = null
      }
      if (disposed) cleanup()
    })().catch(() => { if (!disposed) setFallback(true) })

    return () => {
      disposed = true
      cleanup()
    }
  }, [variant, spin, lift])

  if (fallback) {
    return <div className="lv2-phone-wrap"><RealPhone screen={screen} eager /></div>
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
