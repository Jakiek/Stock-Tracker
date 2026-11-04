import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

export function EmptyState({
  icon,
  title,
  children,
  action,
  secondary,
}: {
  icon: IconName
  title: string
  children: ReactNode
  action?: ReactNode
  secondary?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-12 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-control bg-accent-bg text-accent">
        <Icon name={icon} size={22} />
      </div>
      <h3 className="text-[15px] font-semibold">{title}</h3>
      <p className="mt-1 max-w-sm text-muted">{children}</p>
      {(action || secondary) && (
        <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
          {action}
          {secondary}
        </div>
      )}
    </div>
  )
}
