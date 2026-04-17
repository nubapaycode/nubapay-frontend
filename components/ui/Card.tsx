import { HTMLAttributes } from 'react'
import { cn } from '@/lib/utils'

type CardPadding = 'none' | 'sm' | 'md' | 'lg'

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-3',
  md: 'p-4',
  lg: 'p-6',
}

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padding?: CardPadding
}

export function Card({ padding = 'md', className, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl bg-white shadow-sm border border-gray-100',
        paddingClasses[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
