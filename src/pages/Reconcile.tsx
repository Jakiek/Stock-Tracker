import { useMemo, useState } from 'react'
import { Badge, BrokerChip, Ticker } from '../components/ui/Badge'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Icon } from '../components/ui/Icon'
import { formatLot, rpDesimal } from '../domain/money'
import { kunciPosisi } from '../domain/positions'
import { posisiTerbuka, rekonsiliasi } from '../domain/portfolio'
import { usePositions } from '../hooks/usePositions'

/**
 * Menyandingkan avg hitungan aplikasi dengan avg di aplikasi broker.
 * Hijau/merah TIDAK dipakai — selisih bukan untung atau rugi.
 */
export function Reconcile() {
  const { posisi } = usePositions()
  const [avgBroker, setAvgBroker] = useState<Record<string, string>>({})

  const baris = useMemo(
    () =>
      posisiTerbuka(posisi).sort(
        (a, b) => a.broker.localeCompare(b.broker) || a.ticker.localeCompare(b.ticker),
      ),
    [posisi],
  )

  if (baris.length === 0) {
    return (
      <Card>
        <EmptyState icon="scale" title="Belum ada posisi untuk dicocokkan">
          Setelah ada posisi, masukkan harga rata-rata yang tampil di aplikasi broker untuk memeriksa
          apakah hitungan di sini sudah benar.
        </EmptyState>
      </Card>
    )
  }

  return (
    <Card title="Apakah hitungan saya benar?" padded={false}>
      <p className="px-5 pb-3 text-[13px] text-muted">
        Ketik avg yang tampil di aplikasi BIONS / Stockbit. Selisih di bawah Rp1 dianggap cocok. Kalau
        tidak cocok, cek: fee beli sudah masuk modal? fee yang tersimpan sama dengan konfirmasi? ada
        corporate action yang belum dicatat?
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-sm">
          <thead>
            <tr className="border-y border-border text-left text-[11px] tracking-[.08em] text-muted uppercase">
              <th scope="col" className="px-5 py-2.5 font-semibold">Saham</th>
              <th scope="col" className="num px-3 py-2.5 font-semibold">Lot</th>
              <th scope="col" className="num px-3 py-2.5 font-semibold">Avg (aplikasi ini)</th>
              <th scope="col" className="num px-3 py-2.5 font-semibold">Avg (di broker)</th>
              <th scope="col" className="num px-5 py-2.5 font-semibold">Selisih</th>
            </tr>
          </thead>
          <tbody>
            {baris.map((p) => {
              const k = kunciPosisi(p)
              const teks = avgBroker[k] ?? ''
              const angkaBroker = Number(teks.replace(/\./g, '').replace(',', '.'))
              const hasil = teks ? rekonsiliasi(p, angkaBroker) : null
              return (
                <tr key={k} className="h-[52px] border-b border-border last:border-0">
                  <td className="px-5">
                    <span className="inline-flex items-center gap-2">
                      <Ticker>{p.ticker}</Ticker>
                      <BrokerChip broker={p.broker} />
                    </span>
                  </td>
                  <td className="num px-3">{formatLot(p.lembar)}</td>
                  <td className="num px-3 italic">{rpDesimal(p.hargaRataRata)}</td>
                  <td className="px-3 text-right">
                    <label className="sr-only" htmlFor={`avg-${k}`}>
                      Avg {p.ticker} di {p.broker}
                    </label>
                    <input
                      id={`avg-${k}`}
                      inputMode="decimal"
                      value={teks}
                      placeholder="—"
                      onChange={(e) => setAvgBroker((x) => ({ ...x, [k]: e.target.value.replace(/[^\d.,]/g, '') }))}
                      className="tnum h-9 w-32 rounded-control border border-border-strong bg-surface px-3 text-right"
                    />
                  </td>
                  <td className="num px-5 whitespace-nowrap">
                    {hasil === null ? (
                      <span className="text-subtle">—</span>
                    ) : hasil.cocok ? (
                      <span className="inline-flex items-center gap-1.5 text-muted">
                        <Icon name="check" size={15} /> {rpDesimal(Math.abs(hasil.selisih))}
                      </span>
                    ) : (
                      <Badge variant="warn">
                        <Icon name="alert" size={12} className="mr-1" />
                        {rpDesimal(Math.abs(hasil.selisih))}
                      </Badge>
                    )}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
