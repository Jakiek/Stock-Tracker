import { useMemo, type ReactNode } from 'react'
import { BROKERS } from '../config/brokers'
import { angka, persen, rp } from '../domain/money'
import { ringkasanPerBroker } from '../domain/portfolio'
import { usePrices } from '../hooks/PricesContext'
import { useTransactions } from '../hooks/TransactionsContext'
import { Pnl } from './ui/Pnl'

/**
 * BIONS vs Stockbit — pertanyaan yang tidak bisa dijawab aplikasi broker mana pun:
 * "trade di Stockbit itu sebenarnya untung, atau habis di biaya?"
 */
export function BrokerComparison() {
  const { transaksi } = useTransactions()
  const { petaHarga } = usePrices()
  const data = useMemo(() => ringkasanPerBroker(transaksi, petaHarga), [transaksi, petaHarga])

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
    <table className="w-full text-[13px]">
      <caption className="sr-only">Perbandingan hasil dan biaya per broker</caption>
      <thead>
        <tr className="text-[11px] tracking-[.08em] text-muted uppercase">
          <th scope="col" className="pb-2 text-left font-semibold">
            <span className="sr-only">Metrik</span>
          </th>
          {data.map((d) => (
            <th key={d.broker} scope="col" className="num pb-2 font-semibold">
              {BROKERS[d.broker].nama.replace(' (BNI)', '')}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {baris.map((b) => (
          <tr key={b.label} className={`border-t border-border ${b.tebal ? 'font-semibold' : ''}`}>
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
  )
}
