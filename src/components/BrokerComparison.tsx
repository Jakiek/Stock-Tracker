import { useMemo, type ReactNode } from 'react'
import { angka, persen, rp } from '../domain/money'
import { ringkasanPerBroker } from '../domain/portfolio'
import { useBrokers } from '../hooks/BrokersContext'
import { usePrices } from '../hooks/PricesContext'
import { useTransactions } from '../hooks/TransactionsContext'
import { Pnl } from './ui/Pnl'

/**
 * Pemakaian broker — pertanyaan yang tidak bisa dijawab aplikasi broker mana pun:
 * "trade di broker kecil itu sebenarnya untung, atau habis di biaya?"
 * Kolom mengikuti broker yang benar-benar punya transaksi.
 */
export function BrokerComparison() {
  const { transaksi } = useTransactions()
  const { petaHarga } = usePrices()
  const brokers = useBrokers()
  const data = useMemo(
    () => ringkasanPerBroker(transaksi, petaHarga, brokers.daftar),
    [transaksi, petaHarga, brokers.daftar],
  )

  if (data.length === 0) {
    return <p className="py-6 text-center text-muted">Belum ada transaksi di broker mana pun.</p>
  }

  const baris: { label: string; isi: (i: number) => ReactNode; tebal?: boolean }[] = [
    { label: 'Transaksi', isi: (i) => angka(data[i].jumlahTransaksi) },
    { label: 'Volume beli + jual', isi: (i) => rp(data[i].volume, { ringkas: true }) },
    { label: 'Biaya dibayar', isi: (i) => rp(data[i].biaya) },
    {
      label: 'Tarif efektif',
      isi: (i) => {
        const t = data[i].biayaPerVolume
        return t === null ? '—' : persen(t, 2)
      },
    },
    { label: 'Realized (bersih)', isi: (i) => <Pnl nilai={data[i].realized} /> },
    { label: 'Dividen', isi: (i) => rp(data[i].dividen) },
    { label: 'Unrealized', isi: (i) => <Pnl nilai={data[i].unrealized} /> },
    { label: 'Hasil total', isi: (i) => <Pnl nilai={data[i].hasilTotal} />, tebal: true },
  ]

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-[13px]">
        <caption className="sr-only">Perbandingan hasil dan biaya per broker</caption>
        <thead>
          <tr className="text-[11px] tracking-[.08em] text-muted uppercase">
            <th scope="col" className="pb-2 text-left font-semibold">
              <span className="sr-only">Metrik</span>
            </th>
            {data.map((d) => (
              <th key={d.broker} scope="col" className="num pb-2 font-semibold">
                {brokers.namaPendek(d.broker)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {baris.map((b) => (
            <tr
              key={b.label}
              className={`border-t border-border ${b.tebal ? 'font-semibold' : ''}`}
            >
              <th scope="row" className="py-2 pr-2 text-left font-normal text-muted">
                {b.label}
              </th>
              {data.map((_, i) => (
                <td key={i} className="num py-2 pl-2 whitespace-nowrap">
                  {b.isi(i)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
