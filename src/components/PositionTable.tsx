import { useMemo, useState } from 'react'
import { angka, formatLembar, formatLot, rpDesimal, rp } from '../domain/money'
import { jumlahkan, posisiTerbuka, rasioTerhadapModal, type BarisPosisi } from '../domain/portfolio'
import type { Broker } from '../domain/types'
import { usePreferences } from '../hooks/PreferencesContext'
import { usePortfolio } from '../hooks/usePositions'
import { BrokerChip, Badge, Ticker } from './ui/Badge'
import { Pnl } from './ui/Pnl'
import { Segmented } from './ui/Segmented'

type Mode = 'SEMUA' | Broker

/** Unrealized kotor atau setelah biaya, sesuai toggle. */
function pilih(b: BarisPosisi, bersih: boolean) {
  return bersih
    ? { nilai: b.unrealizedBersih, persen: b.unrealizedBersihPersen }
    : { nilai: b.unrealized, persen: b.unrealizedPersen }
}

function SetelahBiayaToggle() {
  const { pref, ubahPref } = usePreferences()
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-[13px] text-muted select-none">
      <input
        type="checkbox"
        checked={pref.setelahBiaya}
        onChange={(e) => ubahPref({ setelahBiaya: e.target.checked })}
        className="h-4 w-4 accent-[var(--accent)]"
      />
      Unrealized setelah biaya jual
    </label>
  )
}

export function PositionTable({
  batas,
  ringkas = false,
  onKeHarga,
}: {
  batas?: number
  ringkas?: boolean
  onKeHarga?: () => void
}) {
  const { baris } = usePortfolio()
  const { pref } = usePreferences()
  const [mode, setMode] = useState<Mode>('SEMUA')
  const bersih = pref.setelahBiaya

  const tampil = useMemo(() => {
    const terbuka = posisiTerbuka(baris).filter((b) => mode === 'SEMUA' || b.broker === mode)
    // Ringkas (dashboard): urut nilai terbesar. Penuh: dikelompokkan per ticker.
    const urut = ringkas
      ? [...terbuka].sort((a, b) => b.nilai - a.nilai)
      : [...terbuka].sort(
          (a, b) => a.ticker.localeCompare(b.ticker) || a.broker.localeCompare(b.broker),
        )
    return batas ? urut.slice(0, batas) : urut
  }, [baris, mode, ringkas, batas])

  const total = useMemo(() => jumlahkan(tampil), [tampil])
  const totalUnreal = bersih ? total.unrealizedBersih : total.unrealized
  const tinggi = pref.kerapatan === 'rapat' ? 'h-10' : 'h-[52px]'

  const hargaSel = (b: BarisPosisi) =>
    b.adaHarga ? (
      angka(b.hargaPasar ?? 0)
    ) : (
      <button type="button" onClick={onKeHarga} className="cursor-pointer" title="Isi harga pasar">
        <Badge variant="warn">belum ada</Badge>
      </button>
    )

  return (
    <div>
      {!ringkas && (
        <div className="flex flex-wrap items-center gap-3 px-5 pb-4">
          <Segmented
            label="Mode broker"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'SEMUA', label: 'Semua' },
              { value: 'BIONS', label: 'BIONS' },
              { value: 'STOCKBIT', label: 'Stockbit' },
            ]}
          />
          <div className="ml-auto">
            <SetelahBiayaToggle />
          </div>
        </div>
      )}

      {tampil.length === 0 ? (
        <p className="px-5 py-10 text-center text-muted">Belum ada posisi terbuka di sini.</p>
      ) : (
        <>
          <div className="hidden overflow-x-auto sm:block">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="border-y border-border text-left text-[11px] tracking-[.08em] text-muted uppercase">
                  <th scope="col" className="px-5 py-2.5 font-semibold">
                    Saham
                  </th>
                  <th scope="col" className="num px-3 py-2.5 font-semibold">
                    Lot
                  </th>
                  <th scope="col" className="num px-3 py-2.5 font-semibold">
                    Avg
                  </th>
                  <th scope="col" className="num px-3 py-2.5 font-semibold">
                    Harga
                  </th>
                  <th scope="col" className="num px-3 py-2.5 font-semibold">
                    Nilai
                  </th>
                  <th scope="col" className="num px-5 py-2.5 font-semibold">
                    Unrealized{bersih ? ' (bersih)' : ''}
                  </th>
                </tr>
              </thead>
              <tbody>
                {tampil.map((b, i) => {
                  const u = pilih(b, bersih)
                  const tickerBaru = i === 0 || tampil[i - 1].ticker !== b.ticker
                  return (
                    <tr
                      key={`${b.ticker}|${b.broker}`}
                      className={`${tinggi} border-border hover:bg-surface-sunk/50 ${tickerBaru && i > 0 ? 'border-t' : ''}`}
                    >
                      <td className="px-5">
                        <span className="inline-flex items-center gap-2">
                          <Ticker>{b.ticker}</Ticker>
                          <BrokerChip broker={b.broker} />
                        </span>
                      </td>
                      <td className="num px-3 whitespace-nowrap" title={formatLembar(b.lembar)}>
                        {formatLot(b.lembar)}
                      </td>
                      <td
                        className="num px-3 text-muted italic"
                        title="Harga rata-rata = modal ÷ lembar (nilai turunan)"
                      >
                        {rpDesimal(b.hargaRataRata)}
                      </td>
                      <td className="num px-3">{hargaSel(b)}</td>
                      <td className="num px-3 font-medium">{rp(b.nilai)}</td>
                      <td className="num px-5">
                        {b.adaHarga ? (
                          <Pnl nilai={u.nilai} persen={u.persen} />
                        ) : (
                          <span className="text-subtle">—</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
              {!ringkas && (
                <tfoot>
                  <tr className="h-[52px] border-t-2 border-border-strong font-semibold">
                    <th scope="row" className="px-5 text-left">
                      Total <span className="font-normal text-muted">· {tampil.length} posisi</span>
                    </th>
                    {/* Tidak ada rata-rata harga lintas broker — hanya penjumlahan. */}
                    <td className="px-3" />
                    <td className="px-3" />
                    <td className="px-3" />
                    <td className="num px-3">{rp(total.nilai)}</td>
                    <td className="num px-5">
                      <Pnl
                        nilai={totalUnreal}
                        persen={rasioTerhadapModal(totalUnreal, total.modal)}
                      />
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          <ul className="divide-y divide-border border-t border-border sm:hidden">
            {tampil.map((b) => {
              const u = pilih(b, bersih)
              return (
                <li key={`${b.ticker}|${b.broker}`} className="px-4 py-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Ticker>{b.ticker}</Ticker>
                        <BrokerChip broker={b.broker} />
                      </div>
                      <p className="tnum mt-1 text-[12.5px] text-muted">
                        {formatLot(b.lembar)} · avg <i>{rpDesimal(b.hargaRataRata)}</i>
                      </p>
                      <p className="tnum text-[12.5px] text-muted">harga {hargaSel(b)}</p>
                    </div>
                    <div className="text-right">
                      <p className="tnum text-[15px] font-semibold">{rp(b.nilai)}</p>
                      {b.adaHarga && (
                        <Pnl nilai={u.nilai} persen={u.persen} stacked className="text-[13px]" />
                      )}
                    </div>
                  </div>
                </li>
              )
            })}
            {!ringkas && (
              <li className="flex items-center justify-between bg-surface-sunk/50 px-4 py-3 font-semibold">
                <span>Total</span>
                <span className="text-right">
                  <span className="tnum block">{rp(total.nilai)}</span>
                  <Pnl
                    nilai={totalUnreal}
                    persen={rasioTerhadapModal(totalUnreal, total.modal)}
                    stacked
                    className="text-[13px]"
                  />
                </span>
              </li>
            )}
          </ul>
        </>
      )}
    </div>
  )
}

export { SetelahBiayaToggle }
