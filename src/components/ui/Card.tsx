import type { ReactNode } from 'react'

export function Card({
  title,
  action,
  children,
  className = '',
  padded = true,
}: {
  title?: ReactNode
  action?: ReactNode
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <section
      className={`rounded-card border border-border bg-surface shadow-sm ${className}`}
    >
      {(title || action) && (
        <header className="flex min-h-14 items-center justify-between gap-3 px-5 pt-4 pb-2">
          {title && <h2 className="text-[15px] leading-[1.3] font-semibold">{title}</h2>}
          {action}
        </header>
      )}
      <div className={padded ? 'px-5 pb-5' : ''}>{children}</div>
    </section>
  )
}
