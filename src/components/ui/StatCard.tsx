import type { ReactNode } from 'react'
import { Icon, type IconName } from './Icon'

/**
 * Kartu KPI. Hanya SATU kartu per halaman memakai size="lg" — angka utama.
 */
export function StatCard({
  icon,
  label,
  value,
  sub,
  pill,
  size = 'md',
  className = '',
}: {
  icon: IconName
  label: string
  value: ReactNode
  sub?: ReactNode
  pill?: ReactNode
  size?: 'md' | 'lg'
  className?: string
}) {
  const besar = size === 'lg'
  return (
    <section
      className={`flex flex-col gap-3 rounded-card border bg-surface p-5 shadow-sm ${
        besar ? 'border-accent/30' : 'border-border'
      } ${className}`}
    >
      <div className="flex items-center gap-2.5">
        <span
          className={`flex h-8 w-8 items-center justify-center rounded-control ${
            besar ? 'bg-accent text-white' : 'bg-accent-bg text-accent'
          }`}
        >
          <Icon name={icon} size={17} />
        </span>
        <h2 className="text-[12.5px] font-semibold text-muted">{label}</h2>
      </div>
      <div
        className={`tnum font-bold tracking-tight ${
          besar ? 'text-[26px] leading-[1.1] sm:text-[32px]' : 'text-[20px] leading-[1.15] sm:text-[22px] xl:text-[24px]'
        }`}
      >
        {value}
      </div>
      {(pill || sub) && (
        <div className="flex flex-wrap items-center gap-2 text-[12.5px] text-muted">
          {pill}
          {sub}
        </div>
      )}
    </section>
  )
}
