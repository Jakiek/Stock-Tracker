import { useMemo, useState } from 'react'
import { BROKERS } from '../config/brokers'
import { angka, formatLembar, formatLot, rp } from '../domain/money'
import { arusKas, biayaTransaksi } from '../domain/portfolio'
import { urutkanTransaksi } from '../domain/positions'
import type { Broker, JenisTransaksi, Transaction } from '../domain/types'
import { useFormDrawer } from '../hooks/FormDrawerContext'
import { usePreferences } from '../hooks/PreferencesContext'
import { useTransactions } from '../hooks/TransactionsContext'
import { formatTanggal } from './format'
import { JENIS_LABEL, JENIS_PENDEK } from './labels'
import { Badge, BrokerChip, Ticker } from './ui/Badge'
import { Button, IconButton } from './ui/Button'
import { Icon } from './ui/Icon'
import { Segmented } from './ui/Segmented'

type FilterBroker = 'SEMUA' | Broker

const MINUS = '−'

/** Arus kas BUKAN untung/rugi — ditampilkan netral, hanya dengan tanda. */
function ArusKas({ tx }: { tx: Transaction }) {
  const n = arusKas(tx)
  if (n === 0) return <span className="text-subtle">—</span>
  return (
    <span className="tnum font-medium whitespace-nowrap">
      {n > 0 ? '+' : MINUS}
      {rp(Math.abs(n))}
    </span>
  )
}

function Rincian({ tx }: { tx: Transaction }) {
  switch (tx.jenis) {
    case 'SPLIT':
      return <>1 : {tx.rasio}</>
    case 'REVERSE_SPLIT':
      return <>{tx.rasio} : 1</>
    case 'DIVIDEN_TUNAI':
      return <span className="text-muted">Dividen</span>
    default:
      return (
        <span title={formatLembar(tx.lembar)} className="tnum">
          {formatLot(tx.lembar)}
        </span>
      )
  }
}

export function TransactionList({ batas, ringkas = false }: { batas?: number; ringkas?: boolean }) {
  const { transaksi, hapus } = useTransactions()
  const { bukaEdit } = useFormDrawer()
  const { pref } = usePreferences()
  const [broker, setBroker] = useState<FilterBroker>('SEMUA')
  const [ticker, setTicker] = useState('')
  const [jenis, setJenis] = useState<'SEMUA' | JenisTransaksi>('SEMUA')
  const [terbaruDulu, setTerbaruDulu] = useState(true)
  const [konfirmasiHapus, setKonfirmasiHapus] = useState<string | null>(null)

  const tampil = useMemo(() => {
    const urut = urutkanTransaksi(transaksi)
    if (terbaruDulu) urut.reverse()
    const hasil = urut.filter(
      (t) =>
        (broker === 'SEMUA' || t.broker === broker) &&
        (jenis === 'SEMUA' || t.jenis === jenis) &&
        (!ticker || t.ticker.includes(ticker.toUpperCase())),
    )
    return batas ? hasil.slice(0, batas) : hasil
  }, [transaksi, broker, jenis, ticker, terbaruDulu, batas])

  const tinggi = pref.kerapatan === 'rapat' ? 'h-10' : 'h-[52px]'

  async function onHapus(id: string) {
    if (konfirmasiHapus !== id) {
      setKonfirmasiHapus(id)
      return
    }
    await hapus(id)
    setKonfirmasiHapus(null)
  }

  const aksi = (tx: Transaction) => (
    <div className="flex items-center justify-end gap-1">
      {konfirmasiHapus === tx.id ? (
        <>
          <Button size="sm" variant="danger" onClick={() => onHapus(tx.id)}>
            Hapus?
          </Button>
          <IconButton icon="x" label="Batal hapus" onClick={() => setKonfirmasiHapus(null)} />
        </>
      ) : (
        <>
          <IconButton icon="edit" label={`Ubah transaksi ${tx.ticker} ${formatTanggal(tx.tanggal)}`} onClick={() => bukaEdit(tx)} />
          <IconButton icon="trash" label={`Hapus transaksi ${tx.ticker} ${formatTanggal(tx.tanggal)}`} onClick={() => onHapus(tx.id)} />
        </>
      )}
    </div>
  )

  return (
    <div>
      {!ringkas && (
        <div className="flex flex-wrap items-end gap-3 px-5 pb-4">
          <Segmented
            label="Filter broker"
            value={broker}
            onChange={setBroker}
            options={[
              { value: 'SEMUA', label: 'Semua' },
              { value: 'BIONS', label: 'BIONS' },
              { value: 'STOCKBIT', label: 'Stockbit' },
            ]}
          />
          <label className="sr-only" htmlFor="filter-ticker">
            Cari ticker
          </label>
          <input
            id="filter-ticker"
            value={ticker}
            onChange={(e) => setTicker(e.target.value.replace(/[^a-zA-Z]/g, ''))}
            placeholder="Cari ticker"
            maxLength={4}
            className="h-9 w-32 rounded-control border border-border-strong bg-surface px-3 font-mono text-[13px] uppercase placeholder:font-ui placeholder:normal-case placeholder:text-subtle"
          />
          <label className="sr-only" htmlFor="filter-jenis">
            Jenis transaksi
          </label>
          <select
            id="filter-jenis"
            value={jenis}
            onChange={(e) => setJenis(e.target.value as 'SEMUA' | JenisTransaksi)}
            className="h-9 rounded-control border border-border-strong bg-surface px-2 text-[13px]"
          >
            <option value="SEMUA">Semua jenis</option>
            {(Object.keys(JENIS_LABEL) as JenisTransaksi[]).map((j) => (
              <option key={j} value={j}>
                {JENIS_LABEL[j]}
              </option>
            ))}
          </select>
          <span className="ml-auto text-[12.5px] text-muted">{tampil.length} transaksi</span>
        </div>
      )}

      {tampil.length === 0 ? (
        <p className="px-5 py-10 text-center text-muted">Tidak ada transaksi yang cocok dengan filter.</p>
      ) : (
        <>
          {/* ≥ 640px: tabel */}
          <div className="hidden max-h-[70vh] overflow-auto sm:block">
            <table className="w-full border-collapse text-sm">
              <thead className="sticky top-0 z-10 bg-surface">
                <tr className="border-y border-border text-left text-[11px] tracking-[.08em] text-muted uppercase">
                  <th scope="col" className="w-[120px] px-5 py-2.5 font-semibold">
                    <button
                      type="button"
                      onClick={() => setTerbaruDulu((x) => !x)}
                      className="inline-flex items-center gap-1 uppercase hover:text-text"
                      aria-label={`Urutkan tanggal ${terbaruDulu ? 'terlama dulu' : 'terbaru dulu'}`}
                    >
                      Tanggal <Icon name="sort" size={13} />
                    </button>
                  </th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Saham</th>
                  <th scope="col" className="px-3 py-2.5 font-semibold">Jenis</th>
                  <th scope="col" className="num px-3 py-2.5 font-semibold">Jumlah</th>
                  {!ringkas && <th scope="col" className="num px-3 py-2.5 font-semibold">Harga</th>}
                  {!ringkas && <th scope="col" className="num px-3 py-2.5 font-semibold">Fee + pajak</th>}
                  <th scope="col" className="num px-3 py-2.5 font-semibold">Arus kas</th>
                  {!ringkas && <th scope="col" className="w-[96px] px-5 py-2.5"><span className="sr-only">Aksi</span></th>}
                </tr>
              </thead>
              <tbody>
                {tampil.map((tx) => (
                  <tr key={tx.id} className={`${tinggi} border-b border-border last:border-0 hover:bg-surface-sunk/50`}>
                    <td className="tnum px-5 whitespace-nowrap text-muted">{formatTanggal(tx.tanggal)}</td>
                    <td className="px-3">
                      <span className="inline-flex items-center gap-2">
                        <Ticker>{tx.ticker}</Ticker>
                        <BrokerChip broker={tx.broker} />
                      </span>
                    </td>
                    <td className="px-3">
                      <Badge>{JENIS_PENDEK[tx.jenis]}</Badge>
                    </td>
                    <td className="num px-3 whitespace-nowrap">
                      <Rincian tx={tx} />
                    </td>
                    {!ringkas && (
                      <td className="num px-3">{tx.harga > 0 ? angka(tx.harga) : <span className="text-subtle">—</span>}</td>
                    )}
                    {!ringkas && (
                      <td className="num px-3 text-muted">
                        {biayaTransaksi(tx) > 0 ? angka(biayaTransaksi(tx)) : <span className="text-subtle">—</span>}
                      </td>
                    )}
                    <td className="num px-3">
                      <ArusKas tx={tx} />
                    </td>
                    {!ringkas && <td className="px-4">{aksi(tx)}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* < 640px: daftar kartu — tabel keuangan yang digulir menyamping tidak terpakai di HP */}
          <ul className="divide-y divide-border border-t border-border sm:hidden">
            {tampil.map((tx) => (
              <li key={tx.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <Ticker>{tx.ticker}</Ticker>
                      <BrokerChip broker={tx.broker} />
                      <Badge>{JENIS_PENDEK[tx.jenis]}</Badge>
                    </div>
                    <p className="mt-1 text-[12.5px] text-muted">
                      {formatTanggal(tx.tanggal)} · <Rincian tx={tx} />
                      {tx.harga > 0 && <> @ {angka(tx.harga)}</>}
                    </p>
                  </div>
                  <div className="text-right text-[15px]">
                    <ArusKas tx={tx} />
                    {!ringkas && biayaTransaksi(tx) > 0 && (
                      <p className="tnum text-[12px] text-subtle">biaya {angka(biayaTransaksi(tx))}</p>
                    )}
                  </div>
                </div>
                {!ringkas && <div className="mt-1 -mr-2">{aksi(tx)}</div>}
              </li>
            ))}
          </ul>
        </>
      )}
      {!ringkas && broker !== 'SEMUA' && (
        <p className="px-5 pt-3 text-[12.5px] text-muted">Menampilkan transaksi {BROKERS[broker].nama} saja.</p>
      )}
    </div>
  )
}
