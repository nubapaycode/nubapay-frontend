/**
 * Pitidos del escáner continuo (Web Audio, sin archivos). El contexto se crea con un gesto del usuario
 * (el botón que abre el lector); si el navegador no deja sonar, no pasa nada.
 */
let ctx: AudioContext | null = null

export function unlockBeep(): void {
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return
    ctx = ctx ?? new Ctor()
    void ctx.resume?.()
  } catch {
    ctx = null
  }
}

function tone(freq: number, startAt: number, duration: number): void {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  osc.type = 'square'
  osc.frequency.value = freq
  gain.gain.setValueAtTime(0.06, startAt)
  gain.gain.exponentialRampToValueAtTime(0.0001, startAt + duration)
  osc.connect(gain).connect(ctx.destination)
  osc.start(startAt)
  osc.stop(startAt + duration)
}

/** Corto y agudo: entró bien. */
export function beepOk(): void {
  try {
    if (ctx) tone(1760, ctx.currentTime, 0.09)
  } catch {
    /* sin sonido */
  }
}

/** Doble y grave: hay que mirar la pantalla. */
export function beepError(): void {
  try {
    if (!ctx) return
    tone(330, ctx.currentTime, 0.16)
    tone(330, ctx.currentTime + 0.22, 0.16)
  } catch {
    /* sin sonido */
  }
}
