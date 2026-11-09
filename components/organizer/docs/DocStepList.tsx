import type { DocStep } from '@/lib/docs/organizerDocs'

const ACCENT = 'var(--organizer-accent, #C6FF00)'

/** Pasos numerados para las guías sin capturas. Mismo estilo que el recorrido ilustrado. */
export function DocStepList({ steps }: { steps: DocStep[] }) {
  return (
    <ol className="overflow-hidden rounded-2xl border border-gray-200 bg-white">
      {steps.map((step, i) => (
        <li key={step.title} className="flex gap-3.5 border-b border-gray-100 px-4 py-4 last:border-b-0 sm:px-5">
          <span
            className="flex size-7 shrink-0 items-center justify-center rounded-full text-[13px] font-semibold tabular-nums text-gray-900"
            style={{ backgroundColor: ACCENT }}
            aria-hidden
          >
            {i + 1}
          </span>
          <div className="min-w-0">
            <p className="text-[15px] font-semibold leading-7 tracking-[-0.01em] text-gray-900">
              <span className="sr-only">Paso {i + 1}: </span>
              {step.title}
            </p>
            <p className="mt-0.5 max-w-[66ch] text-[13.5px] leading-relaxed text-gray-600">{step.body}</p>
          </div>
        </li>
      ))}
    </ol>
  )
}
