import type { ReactNode } from 'react'

type Varian = 'neutral' | 'gain' | 'loss' | 'warn' | 'accent'

const GAYA: Record<Varian, string> = {
  neutral: 'bg-surface-sunk text-muted',
  gain: 'bg-gain-bg text-gain',
  loss: 'bg-loss-bg text-loss',
  warn: 'bg-warn-bg text-warn',
  accent: 'bg-accent-bg text-accent',
}

export function Badge({
  variant = 'neutral',
  children,
  className = '',
}: {
  variant?: Varian
  children: ReactNode
  className?: string
}) {
  return (
    <span
      className={`inline-flex h-5 items-center rounded-chip px-1.5 text-[11px] leading-none font-semibold whitespace-nowrap ${GAYA[variant]} ${className}`}
    >
      {children}
    </span>
  )
}

/**
 * Chip broker — SELALU netral. Ia penanda identitas, bukan status, dan
 * tidak boleh berebut perhatian dengan angka untung/rugi.
 */
export function BrokerChip({ broker }: { broker: 'BIONS' | 'STOCKBIT' }) {
  return <Badge>{broker === 'BIONS' ? 'BIONS' : 'Stockbit'}</Badge>
}

export function Ticker({ children }: { children: ReactNode }) {
  return <span className="font-mono text-[13px] font-semibold tracking-tight">{children}</span>
}
