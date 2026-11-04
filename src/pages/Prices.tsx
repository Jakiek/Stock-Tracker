import { useMemo, useState, type FormEvent } from 'react'
import { relatif, formatWaktu } from '../components/format'
import { BrokerChip, Badge, Ticker } from '../components/ui/Badge'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { NumberInput } from '../components/ui/Field'
import { formatLot } from '../domain/money'
import { posisiTerbuka } from '../domain/portfolio'
import type { Position } from '../domain/types'
import { usePrices } from '../hooks/PricesContext'
import { usePositions } from '../hooks/usePositions'

const BASI_HARI = 7

function BarisHarga({ ticker, posisi }: { ticker: string; posisi: Position[] }) {
  const { harga, simpan } = usePrices()
  const tersimpan = harga[ticker]
  const [draf, setDraf] = useState<number | null>(tersimpan?.harga ?? null)
  const [status, setStatus] = useState<'diam' | 'tersimpan'>('diam')
  const [sekarang] = useState(() => Date.now())

  const berubah = draf !== null && draf !== tersimpan?.harga
  const basi =
    tersimpan && sekarang - new Date(tersimpan.diperbarui).getTime() > BASI_HARI * 86_400_000

  async function kirim(e: FormEvent) {
    e.preventDefault()
    if (draf === null || draf <= 0) return
    await simpan(ticker, draf)
    setStatus('tersimpan')
    window.setTimeout(() => setStatus('diam'), 1500)
  }

  return (
    <li className="px-5 py-4">
      <form onSubmit={kirim} className="flex flex-wrap items-end gap-x-5 gap-y-3">
        <div className="min-w-[160px] flex-1">
          <Ticker>{ticker}</Ticker>
          <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] text-muted">
            {posisi.map((p) => (
              <span key={p.broker} className="inline-flex items-center gap-1">
                <BrokerChip broker={p.broker} /> {formatLot(p.lembar)}
              </span>
            ))}
          </div>
        </div>
        <div className="w-44">
          <NumberInput label={`Harga ${ticker}`} prefix="Rp" value={draf} onChange={setDraf} />
        </div>
        <div className="flex h-10 items-center gap-3">
          <Button
            type="submit"
            size="sm"
            variant={berubah ? 'primary' : 'secondary'}
            disabled={!berubah}
          >
            Simpan
          </Button>
          <span
            className="w-40 text-[12.5px] text-muted"
            title={tersimpan ? formatWaktu(tersimpan.diperbarui) : undefined}
          >
            {status === 'tersimpan' ? (
              <span className="font-semibold text-accent">Tersimpan</span>
            ) : tersimpan ? (
              basi ? (
                <Badge variant="warn">diperbarui {relatif(tersimpan.diperbarui)}</Badge>
              ) : (
                <>diperbarui {relatif(tersimpan.diperbarui)}</>
              )
            ) : (
              <Badge variant="warn">belum diisi</Badge>
            )}
          </span>
        </div>
      </form>
    </li>
  )
}

export function Prices() {
  const { posisi } = usePositions()
  const { harga } = usePrices()

  const perTicker = useMemo(() => {
    const m = new Map<string, Position[]>()
    for (const p of posisiTerbuka(posisi)) m.set(p.ticker, [...(m.get(p.ticker) ?? []), p])
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [posisi])

  if (perTicker.length === 0) {
    return (
      <Card>
        <EmptyState icon="tag" title="Belum ada saham untuk diberi harga">
          Daftar ini berisi saham yang sedang kamu pegang. Catat transaksi beli dulu.
        </EmptyState>
      </Card>
    )
  }

  return (
    <Card
      title="Harga pasar manual"
      padded={false}
      action={
        <span className="text-[12.5px] text-muted">
          Satu harga per ticker, berlaku untuk semua broker
        </span>
      }
    >
      <p className="px-5 pb-3 text-[13px] text-muted">
        Angka portofolio hanya sebaik harga terakhir yang kamu masukkan. Harga yang lebih dari{' '}
        {BASI_HARI} hari ditandai.
      </p>
      <ul className="divide-y divide-border border-t border-border">
        {perTicker.map(([t, ps]) => (
          // key memuat waktu pembaruan → baris di-mount ulang saat harga tersimpan berubah
          <BarisHarga key={`${t}|${harga[t]?.diperbarui ?? ''}`} ticker={t} posisi={ps} />
        ))}
      </ul>
    </Card>
  )
}
