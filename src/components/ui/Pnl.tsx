import { arah, persenBertanda, rpBertanda } from '../../domain/money'

const WARNA = { naik: 'text-gain', turun: 'text-loss', datar: 'text-muted' } as const
const PANAH = { naik: '↗', turun: '↘', datar: '—' } as const

/**
 * Untung/rugi: tanda eksplisit + panah + warna. Warna tidak pernah jadi
 * satu-satunya penanda. Nol netral, bukan hijau.
 */
export function Pnl({
  nilai,
  persen,
  ringkas,
  className = '',
  stacked = false,
}: {
  nilai: number
  persen?: number | null
  ringkas?: boolean
  className?: string
  stacked?: boolean
}) {
  const a = arah(nilai)
  return (
    <span className={`tnum ${WARNA[a]} ${stacked ? 'inline-flex flex-col items-end' : ''} ${className}`}>
      <span className="font-medium whitespace-nowrap">{rpBertanda(nilai, { ringkas })}</span>
      {persen !== undefined && persen !== null && (
        <span className={`whitespace-nowrap ${stacked ? 'text-[12.5px]' : 'ml-1.5 text-[12.5px]'}`}>
          <span aria-hidden>{PANAH[a]}</span> {persenBertanda(persen)}
        </span>
      )}
      {(persen === undefined || persen === null) && a !== 'datar' && !stacked && (
        <span aria-hidden className="ml-1 text-[12.5px]">
          {PANAH[a]}
        </span>
      )}
    </span>
  )
}

/** `↗ +6,2%` dalam pil. Tidak dirender kalau tidak ada pembanding. */
export function TrendPill({ rasio, label }: { rasio: number | null | undefined; label?: string }) {
  if (rasio === null || rasio === undefined || !Number.isFinite(rasio)) return null
  const a = arah(Math.abs(rasio) < 0.0005 ? 0 : rasio)
  const gaya = {
    naik: 'bg-gain-bg text-gain',
    turun: 'bg-loss-bg text-loss',
    datar: 'bg-surface-sunk text-muted',
  }[a]
  return (
    <span className={`tnum inline-flex items-center gap-1 rounded-pill px-2 py-0.5 text-[12.5px] font-medium ${gaya}`}>
      <span aria-hidden>{PANAH[a]}</span>
      {persenBertanda(rasio)}
      {label && <span className="font-normal opacity-80">{label}</span>}
    </span>
  )
}
