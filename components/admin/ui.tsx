'use client'

import {
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Info,
  Minus,
  X,
  XCircle,
} from 'lucide-react'
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react'
import { createPortal } from 'react-dom'

import { ORDER_STATUS_LABEL, PAYMENT_STATUS_LABEL } from './theme'

export const cx = (...parts: (string | false | null | undefined)[]) => parts.filter(Boolean).join(' ')

// ---------------------------------------------------------------------------
// Card & layout
// ---------------------------------------------------------------------------

export function Card({
  title,
  subtitle,
  action,
  children,
  className,
  flush,
}: {
  title?: ReactNode
  subtitle?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  /** Sin padding interno (tablas que llegan al borde). */
  flush?: boolean
}) {
  return (
    <section className={cx('admin-panel', className)}>
      {(title || action) && (
        <header className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2 px-5 pt-4 pb-3">
          <div className="min-w-0">
            {title && <h2 className="text-[13px] font-medium text-white">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-xs text-white/60">{subtitle}</p>}
          </div>
          {action && <div className="max-w-full">{action}</div>}
        </header>
      )}
      <div className={flush ? '' : 'px-5 pb-5 ' + (title || action ? '' : 'pt-5')}>{children}</div>
    </section>
  )
}

/** Número que sube hasta su valor: mismo dato, sin saltos entre períodos. */
export function CountUp({ value, format }: { value: number; format: (n: number) => string }) {
  const [shown, setShown] = useState(0)
  const from = useRef(0)
  useEffect(() => {
    const instant = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const start = performance.now()
    const origin = from.current
    let raf = 0
    const step = (t: number) => {
      const p = instant ? 1 : Math.min(1, (t - start) / 600)
      const next = p === 1 ? value : origin + (value - origin) * (1 - (1 - p) ** 3)
      from.current = next
      setShown(next)
      if (p < 1) raf = requestAnimationFrame(step)
    }
    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [value])
  return <>{format(shown === value ? value : Math.round(shown))}</>
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cx('animate-pulse rounded-md bg-white/[0.06]', className)} />
}

export function EmptyState({ title, hint }: { title: string; hint?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-1 px-6 py-12 text-center">
      <p className="text-sm font-medium text-white/70">{title}</p>
      {hint && <p className="text-xs text-white/55">{hint}</p>}
    </div>
  )
}

export function ErrorNote({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-red-400/20 bg-red-400/[0.07] px-4 py-3">
      <p className="text-sm text-red-200">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="flex-shrink-0 rounded-md border border-white/10 px-3 py-1 text-xs text-white/80 hover:bg-white/5"
        >
          Reintentar
        </button>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Buttons & inputs
// ---------------------------------------------------------------------------

type BtnVariant = 'primary' | 'ghost' | 'danger' | 'subtle'

const BTN: Record<BtnVariant, string> = {
  primary: 'bg-admin-primary text-white hover:bg-admin-primary-hover font-medium',
  ghost: 'border border-white/10 text-white/80 hover:border-white/20 hover:bg-white/[0.05]',
  subtle: 'bg-white/[0.06] text-white/85 hover:bg-white/10',
  danger: 'border border-red-400/30 bg-red-400/10 text-red-200 hover:bg-red-400/20',
}

export function Btn({
  variant = 'ghost',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: BtnVariant; size?: 'sm' | 'md' }) {
  return (
    <button
      type="button"
      {...props}
      className={cx(
        'inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm transition-colors duration-150',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent',
        'disabled:cursor-not-allowed disabled:opacity-40',
        size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2',
        BTN[variant],
        className,
      )}
    />
  )
}

const inputBase =
  'rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm text-white placeholder:text-white/40 transition-colors duration-150 hover:border-white/20 [color-scheme:dark] ' +
  'focus:border-admin-accent/60 focus:outline-none focus:ring-2 focus:ring-admin-accent/20'

/** Ancho completo por defecto; `inputAutoCls` para controles que se acomodan en una fila. */
export const inputCls = `w-full ${inputBase}`
export const inputAutoCls = `w-auto ${inputBase}`

export function Select({
  value,
  onChange,
  options,
  label,
  className,
  disabled,
}: {
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
  label: string
  className?: string
  disabled?: boolean
}) {
  return (
    <span className={cx('relative', className ? 'inline-flex' : 'flex w-full')}>
      <select
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={cx(className ? inputAutoCls : inputCls, 'appearance-none pr-8 disabled:opacity-40', className)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-admin-surface">
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown size={14} aria-hidden className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-white/50" />
    </span>
  )
}

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T
  onChange: (v: T) => void
  options: { value: T; label: string }[]
  label: string
}) {
  return (
    <div role="radiogroup" aria-label={label} className="inline-flex max-w-full overflow-x-auto rounded-md border border-white/10 bg-white/[0.03] p-0.5">
      {options.map((o) => {
        const on = o.value === value
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={on}
            onClick={() => onChange(o.value)}
            className={cx(
              'flex-shrink-0 whitespace-nowrap rounded px-3 py-1 text-xs font-medium transition-colors duration-150',
              on ? 'bg-white/[0.1] text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]' : 'text-white/50 hover:text-white/80',
            )}
          >
            {o.label}
          </button>
        )
      })}
    </div>
  )
}

export function Toggle({
  checked,
  onChange,
  disabled,
  label,
}: {
  checked: boolean
  onChange: (v: boolean) => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        'relative inline-flex h-6 w-10 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-admin-accent',
        checked ? 'bg-admin-primary' : 'bg-white/15',
      )}
    >
      <span
        className={cx(
          'inline-block h-5 w-5 rounded-full bg-white shadow transition-transform',
          checked ? 'translate-x-[18px]' : 'translate-x-0.5',
        )}
      />
    </button>
  )
}

// ---------------------------------------------------------------------------
// Pills (el estado nunca va solo en color: icono + texto)
// ---------------------------------------------------------------------------

export type Tone = 'neutral' | 'good' | 'warning' | 'critical' | 'info'

const TONE: Record<Tone, string> = {
  neutral: 'border-white/10 bg-white/[0.04] text-white/70',
  good: 'border-emerald-400/20 bg-emerald-400/[0.07] text-emerald-300',
  warning: 'border-amber-400/20 bg-amber-400/[0.07] text-amber-300',
  critical: 'border-red-400/25 bg-red-400/[0.08] text-red-300',
  info: 'border-sky-400/20 bg-sky-400/[0.07] text-sky-300',
}

const TONE_ICON: Record<Tone, ReactNode> = {
  neutral: <CircleDot size={11} />,
  good: <CheckCircle2 size={11} />,
  warning: <AlertTriangle size={11} />,
  critical: <XCircle size={11} />,
  info: <Info size={11} />,
}

export function Pill({ tone = 'neutral', children }: { tone?: Tone; children: ReactNode }) {
  return (
    <span className={cx('inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-0.5 text-[11px] font-medium', TONE[tone])}>
      {TONE_ICON[tone]}
      {children}
    </span>
  )
}

const ORDER_TONE: Record<string, Tone> = {
  queued: 'warning',
  pending_payment: 'neutral',
  paid: 'info',
  partially_delivered: 'info',
  delivered: 'good',
  cancelled: 'critical',
  failed: 'critical',
}

export function OrderStatusPill({ status }: { status: string }) {
  return <Pill tone={ORDER_TONE[status] ?? 'neutral'}>{ORDER_STATUS_LABEL[status] ?? status}</Pill>
}

const PAYMENT_TONE: Record<string, Tone> = {
  approved: 'good',
  paid: 'good',
  pending: 'neutral',
  rejected: 'critical',
  refunded: 'warning',
}

export function PaymentStatusPill({ status }: { status: string }) {
  return <Pill tone={PAYMENT_TONE[status] ?? 'neutral'}>{PAYMENT_STATUS_LABEL[status] ?? status}</Pill>
}

/** Variación vs período anterior. `upIsGood=false` invierte el color (ej. fallas). */
export function Delta({ value, suffix = '%', upIsGood = true }: { value: number | null; suffix?: string; upIsGood?: boolean }) {
  if (value === null) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-white/50">
        <Minus size={12} /> sin comparación
      </span>
    )
  }
  if (value === 0) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-white/50">
        <Minus size={12} /> igual
      </span>
    )
  }
  const up = value > 0
  const good = up === upIsGood
  return (
    <span className={cx('inline-flex items-center gap-0.5 whitespace-nowrap text-xs font-medium', good ? 'text-emerald-300' : 'text-red-300')}>
      {up ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      {Math.abs(value) >= 1000 ? `${up ? '+' : '-'}999${suffix.trim()}+` : `${up ? '+' : ''}${value.toLocaleString('es-AR')}${suffix}`}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Tablas
// ---------------------------------------------------------------------------

export function Table({ children, min = 720 }: { children: ReactNode; min?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left" style={{ minWidth: min }}>
        {children}
      </table>
    </div>
  )
}

export function Th({ children, align }: { children?: ReactNode; align?: 'right' }) {
  return (
    <th
      className={cx(
        'whitespace-nowrap px-4 py-2.5 font-admin-mono text-[10.5px] font-medium uppercase tracking-[0.06em] text-white/45',
        align === 'right' && 'text-right',
      )}
    >
      {children}
    </th>
  )
}

export function Td({ children, align, muted, className }: { children?: ReactNode; align?: 'right'; muted?: boolean; className?: string }) {
  return (
    <td
      className={cx(
        'px-4 py-2.5 text-sm',
        muted ? 'text-white/60' : 'text-white/85',
        align === 'right' && 'text-right font-admin-mono text-[13px] tabular-nums',
        className,
      )}
    >
      {children}
    </td>
  )
}

export function Pager({
  page,
  total,
  pageSize,
  onPage,
}: {
  page: number
  total: number
  pageSize: number
  onPage: (p: number) => void
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  return (
    <div className="flex items-center justify-between border-t border-white/[0.06] px-4 py-3">
      <p className="text-xs text-white/55">
        {total.toLocaleString('es-AR')} resultado{total === 1 ? '' : 's'} · página {Math.min(page, pages)} de {pages}
      </p>
      <div className="flex gap-2">
        <Btn size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Anterior
        </Btn>
        <Btn size="sm" disabled={page >= pages} onClick={() => onPage(page + 1)}>
          Siguiente
        </Btn>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Drawer & diálogo con motivo
// ---------------------------------------------------------------------------

function useEscape(active: boolean, onClose: () => void) {
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active, onClose])
}

export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
}: {
  open: boolean
  onClose: () => void
  title: ReactNode
  subtitle?: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  useEscape(open, onClose)
  const panelRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (open) panelRef.current?.focus()
  }, [open])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-40 flex justify-end">
      <div className="admin-fade absolute inset-0 bg-black/60 backdrop-blur-[2px]" onClick={onClose} aria-hidden />
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={typeof title === 'string' ? title : 'Detalle'}
        className="admin-drawer relative flex h-full w-full max-w-xl flex-col border-l border-white/10 bg-admin-surface shadow-2xl outline-none"
      >
        <header className="flex items-start justify-between gap-3 border-b border-white/[0.08] px-5 py-4">
          <div className="min-w-0">
            <h2 className="truncate text-base font-semibold text-white">{title}</h2>
            {subtitle && <div className="mt-1 text-xs text-white/60">{subtitle}</div>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="rounded-md p-1.5 text-white/50 hover:bg-white/10 hover:text-white"
          >
            <X size={18} />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
        {footer && <footer className="border-t border-white/[0.08] px-5 py-3">{footer}</footer>}
      </div>
    </div>
  )
}

/** Los diálogos van al raíz del panel: ningún contenedor con transform puede atrapar su `fixed`. */
export function AdminPortal({ children }: { children: ReactNode }) {
  return createPortal(children, document.getElementById('admin-root') ?? document.body)
}

export function ConfirmDialog({
  open,
  title,
  children,
  confirmLabel,
  tone = 'primary',
  onCancel,
  onConfirm,
}: {
  open: boolean
  title: string
  children: ReactNode
  confirmLabel: string
  tone?: 'danger' | 'primary'
  onCancel: () => void
  onConfirm: () => void
}) {
  useEscape(open, onCancel)
  if (!open) return null
  return (
    <AdminPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="admin-fade absolute inset-0 bg-black/70" onClick={onCancel} aria-hidden />
        <div role="alertdialog" aria-modal="true" aria-label={title} className="admin-pop relative w-full max-w-md rounded-lg border border-white/10 bg-admin-raised p-5 shadow-2xl">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <div className="mt-2 text-sm text-white/60">{children}</div>
          <div className="mt-4 flex justify-end gap-2">
            <Btn onClick={onCancel}>Volver</Btn>
            <Btn variant={tone} onClick={onConfirm} autoFocus={tone === 'primary'}>
              {confirmLabel}
            </Btn>
          </div>
        </div>
      </div>
    </AdminPortal>
  )
}

type ReasonDialogProps = {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel: string
  minLength: number
  tone?: 'danger' | 'primary'
  busy?: boolean
  onCancel: () => void
  onConfirm: (reason: string) => void
}

export function ReasonDialog(props: ReasonDialogProps) {
  // Se monta solo mientras está abierto: el motivo arranca vacío cada vez.
  return props.open ? <ReasonDialogBody {...props} /> : null
}

function ReasonDialogBody({
  open,
  title,
  description,
  confirmLabel,
  minLength,
  tone = 'danger',
  busy,
  onCancel,
  onConfirm,
}: ReasonDialogProps) {
  const [reason, setReason] = useState('')
  useEscape(open, onCancel)
  const ok = reason.trim().length >= minLength
  return (
    <AdminPortal>
      <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
        <div className="admin-fade absolute inset-0 bg-black/70" onClick={onCancel} aria-hidden />
        <div role="alertdialog" aria-modal="true" aria-label={title} className="admin-pop relative w-full max-w-md rounded-lg border border-white/10 bg-admin-raised p-5 shadow-2xl">
          <h3 className="text-base font-semibold text-white">{title}</h3>
          <div className="mt-2 text-sm text-white/60">{description}</div>
          <label className="mt-4 block text-xs font-medium text-white/50" htmlFor="admin-reason">
            Motivo (queda registrado en el historial)
          </label>
          <textarea
            id="admin-reason"
            autoFocus
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className={cx(inputCls, 'mt-1.5 resize-none')}
            placeholder={`Mínimo ${minLength} caracteres`}
          />
          <div className="mt-4 flex justify-end gap-2">
            <Btn onClick={onCancel} disabled={busy}>
              Volver
            </Btn>
            <Btn variant={tone === 'danger' ? 'danger' : 'primary'} disabled={!ok || busy} onClick={() => onConfirm(reason.trim())}>
              {busy ? 'Procesando…' : confirmLabel}
            </Btn>
          </div>
        </div>
      </div>
    </AdminPortal>
  )
}

// ---------------------------------------------------------------------------
// Toasts
// ---------------------------------------------------------------------------

type ToastKind = 'success' | 'error'
type ToastItem = { id: number; kind: ToastKind; message: string }
const ToastCtx = createContext<(kind: ToastKind, message: string) => void>(() => {})

export function useToast() {
  return useContext(ToastCtx)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([])
  const seq = useRef(0)
  const push = useCallback((kind: ToastKind, message: string) => {
    const id = ++seq.current
    setItems((cur) => [...cur, { id, kind, message }])
    setTimeout(() => setItems((cur) => cur.filter((t) => t.id !== id)), 4500)
  }, [])
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="pointer-events-none fixed bottom-20 right-4 z-[60] lg:bottom-4 flex flex-col gap-2" aria-live="polite">
        {items.map((t) => (
          <div
            key={t.id}
            className={cx(
              'admin-rise pointer-events-auto flex max-w-sm items-center gap-2 rounded-lg border px-4 py-3 text-sm shadow-xl',
              t.kind === 'success'
                ? 'border-emerald-400/25 bg-[#0f1f18] text-emerald-200'
                : 'border-red-400/25 bg-[#241114] text-red-200',
            )}
          >
            {t.kind === 'success' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
            {t.message}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hooks
// ---------------------------------------------------------------------------

export function useDebounced<T>(value: T, ms = 300): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

/** Página actual que vuelve a 1 cuando cambia `key` (filtros), sin efectos de sincronización. */
export function usePageForKey(key: string): [number, (p: number) => void] {
  const [state, setState] = useState({ key, page: 1 })
  const page = state.key === key ? state.page : 1
  return [page, (p: number) => setState({ key, page: p })]
}

/** Fetch con "refetch keeps the frame": conserva el dato previo mientras recarga. */
export function useAsync<T>(
  fn: () => Promise<{ ok: true; data: T } | { ok: false; error: string }>,
  deps: unknown[],
) {
  const [data, setData] = useState<T | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    let cancelled = false
    // eslint-disable-next-line react-hooks/set-state-in-effect -- marca "recargando" antes de pedir; el dato previo se conserva
    setLoading(true)
    ;(async () => {
      const r = await fn()
      if (cancelled) return
      if (r.ok) {
        setData(r.data)
        setError('')
      } else {
        setError(r.error)
      }
      setLoading(false)
    })()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, tick])

  const reload = useCallback(() => setTick((t) => t + 1), [])
  return { data, error, loading, reload }
}
