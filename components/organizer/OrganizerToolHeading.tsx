'use client'

import type { ReactNode } from 'react'

const titleStyle = {
  fontSize: '22px',
  fontWeight: 600,
  letterSpacing: '-0.03em',
  color: '#0A0A0F',
  margin: '0 0 6px 0',
} as const

const descStyle = {
  fontSize: '13px',
  color: '#9A9AA8',
  margin: 0,
} as const

export type OrganizerToolHeadingProps = {
  title: string
  description?: ReactNode
  /** Icono o marca previa al bloque de título (p. ej. escáner). */
  prefix?: ReactNode
  actions?: ReactNode
}

export function OrganizerToolHeading({ title, description, prefix, actions }: OrganizerToolHeadingProps) {
  return (
    <div
      className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      style={{ marginTop: '-20px' }}
    >
      <div className={`flex min-w-0 gap-3 ${prefix ? 'items-start' : ''}`}>
        {prefix ? <span className="shrink-0">{prefix}</span> : null}
        <div className="min-w-0">
          <h1 style={titleStyle}>{title}</h1>
          {description == null ? null : typeof description === 'string' ? (
            <p style={descStyle}>{description}</p>
          ) : (
            description
          )}
        </div>
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </div>
  )
}
