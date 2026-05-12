'use client'

import type { ButtonHTMLAttributes, CSSProperties } from 'react'

import { organizerAccentFilledButtonStyle } from '@/lib/organizerAccentCss'

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'solid' | 'outline'
}

const OUTLINE_STYLE: CSSProperties = {
  backgroundColor: 'transparent',
  border: '1px solid rgba(0,0,0,0.12)',
  color: '#111827',
}

export function AccentButton({ variant = 'solid', style, className, ...props }: Props) {
  const base =
    'rounded-full text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none'

  const hasPadding =
    typeof className === 'string' && (/\bp-/.test(className) || /\bpy-/.test(className) || /\bpx-/.test(className))
  const padding = hasPadding ? '' : ' py-3 px-5'

  const mergedClassName = `${base}${padding}${className ? ` ${className}` : ''}`

  const variantStyle = variant === 'solid' ? organizerAccentFilledButtonStyle() : OUTLINE_STYLE

  return <button {...props} className={mergedClassName} style={{ ...variantStyle, ...style }} />
}
