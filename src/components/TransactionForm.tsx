import { useMemo, useState, type FormEvent } from 'react'
import { BROKERS, DAFTAR_BROKER } from '../config/brokers'
import { hitungBiaya } from '../domain/fees'
import { formatLot, keLot, lotKeLembar, nilai as nilaiTx, rp } from '../domain/money'
import { arusKas } from '../domain/portfolio'
import { kunciPosisi } from '../domain/positions'
import { transaksiBaruSchema } from '../domain/schema'
import type { Broker, JenisTransaksi, Transaction, TransaksiBaru } from '../domain/types'
import { usePositions } from '../hooks/usePositions'
import { useTransactions } from '../hooks/TransactionsContext'
import { Button } from './ui/Button'
import { NumberInput, SelectInput, TextInput } from './ui/Field'
import { Icon } from './ui/Icon'
import { JENIS_LABEL } from './labels'

type Satuan = 'lot' | 'lembar'

type Draf = {
  jenis: JenisTransaksi
  tanggal: string
  broker: Broker
  ticker: string
  jumlah: number | null // dalam `satuan`
  satuan: Satuan
  harga: number | null
  fee: number | null
  pajak: number | null
  feeManual: boolean
  rasio: number | null
  dividen: number | null
  tesis: string
  catatan: string
}

const BERHARGA: JenisTransaksi[] = ['BELI', 'JUAL', 'RIGHTS']

function hariIni(): string {
  return new Date().toLocaleDateString('sv-SE') // YYYY-MM-DD zona lokal
}

function drafAwal(tx?: Transaction): Draf {
  if (!tx) {
    return {
      jenis: 'BELI',
      tanggal: hariIni(),
      broker: 'BIONS',
      ticker: '',
      jumlah: null,
      satuan: 'lot',
      harga: null,
      fee: null,
      pajak: null,
      feeManual: false,
      rasio: null,
      dividen: null,
      tesis: '',
      catatan: '',
    }
  }
  const { lot, sisa } = keLot(tx.lembar)
  const pakaiLot = sisa === 0 && tx.lembar > 0
  return {
    jenis: tx.jenis,
    tanggal: tx.tanggal,
    broker: tx.broker,
    ticker: tx.ticker,
    jumlah: tx.lembar > 0 ? (pakaiLot ? lot : tx.lembar) : null,
    satuan: pakaiLot ? 'lot' : 'lembar',
    harga: tx.harga || null,
    // Saat edit, fee yang TERSIMPAN dipertahankan — tidak dihitung ulang dari config.
    fee: tx.fee,
    pajak: tx.pajak,
    feeManual: true,
    rasio: tx.rasio ?? null,
    dividen: tx.jumlah ?? null,
    tesis: tx.tesis ?? '',
    catatan: tx.catatan ?? '',
  }
}

export function TransactionForm({
  awal,
  onSelesai,
  onBatal,
}: {
  awal?: Transaction
  onSelesai: () => void
  onBatal: () => void
}) {
  const { transaksi, tambah, ubah, cekSebelumSimpan } = useTransactions()
  const { posisi } = usePositions()
  const [d, setD] = useState<Draf>(() => drafAwal(awal))
  const [galat, setGalat] = useState<Record<string, string>>({})
  const [galatUmum, setGalatUmum] = useState<string | null>(null)
  const [menyimpan, setMenyimpan] = useState(false)

  const set = <K extends keyof Draf>(k: K, v: Draf[K]) => setD((x) => ({ ...x, [k]: v }))

  const lembar = d.jumlah === null ? 0 : d.satuan === 'lot' ? lotKeLembar(d.jumlah) : d.jumlah
  const berharga = BERHARGA.includes(d.jenis)

  // Fee otomatis dari config — HANYA sebagai nilai default.
  const otomatis = useMemo(() => {
    if (!berharga || !d.harga || lembar <= 0) return { fee: 0, pajak: 0 }
    return hitungBiaya(nilaiTx(lembar, d.harga), d.broker, d.jenis === 'JUAL' ? 'JUAL' : 'BELI')
  }, [berharga, d.harga, d.broker, d.jenis, lembar])

  const fee = d.feeManual ? (d.fee ?? 0) : otomatis.fee
  const pajak = d.jenis === 'JUAL' ? (d.feeManual ? (d.pajak ?? 0) : otomatis.pajak) : 0

  const bangun = (): TransaksiBaru => {
    const dasar = {
      tanggal: d.tanggal,
      broker: d.broker,
      ticker: d.ticker.trim().toUpperCase(),
      jenis: d.jenis,
      lembar: 0,
      harga: 0,
      fee: 0,
      pajak: 0,
      ...(d.tesis.trim() ? { tesis: d.tesis.trim() } : {}),
      ...(d.catatan.trim() ? { catatan: d.catatan.trim() } : {}),
    }
    switch (d.jenis) {
      case 'BELI':
      case 'JUAL':
      case 'RIGHTS':
        return { ...dasar, lembar, harga: d.harga ?? 0, fee, pajak }
      case 'DIVIDEN_SAHAM':
        return { ...dasar, lembar }
      case 'DIVIDEN_TUNAI':
        return { ...dasar, jumlah: d.dividen ?? 0 }
      case 'SPLIT':
      case 'REVERSE_SPLIT':
        return { ...dasar, ...(d.rasio !== null ? { rasio: d.rasio } : {}) }
    }
  }

  const kandidat = bangun()
  const arus = arusKas(kandidat)

  const kunciKandidat = kunciPosisi(kandidat)
  const kepemilikan = posisi.find((x) => kunciPosisi(x) === kunciKandidat)?.lembar ?? 0

  const tickerDikenal = useMemo(
    () => [...new Set(transaksi.map((t) => t.ticker))].sort(),
    [transaksi],
  )

  async function kirim(e: FormEvent) {
    e.preventDefault()
    setGalatUmum(null)
    const hasil = transaksiBaruSchema.safeParse(kandidat)
    if (!hasil.success) {
      const g: Record<string, string> = {}
      for (const i of hasil.error.issues) {
        const k = String(i.path[0] ?? '_')
        if (!g[k]) g[k] = i.message
      }
      setGalat(g)
      return
    }
    setGalat({})
    const masalah = cekSebelumSimpan(hasil.data, awal?.id)
    if (masalah) {
      setGalatUmum(masalah)
      return
    }
    setMenyimpan(true)
    try {
      if (awal) await ubah(awal.id, hasil.data)
      else await tambah(hasil.data)
      onSelesai()
    } catch (err) {
      setGalatUmum(err instanceof Error ? err.message : String(err))
    } finally {
      setMenyimpan(false)
    }
  }

  const satuanToggle = (
    <select
      aria-label="Satuan"
      value={d.satuan}
      onChange={(e) => set('satuan', e.target.value as Satuan)}
      className="h-8 rounded-[8px] bg-surface-sunk px-2 text-[12.5px] font-semibold text-muted"
    >
      <option value="lot">lot</option>
      <option value="lembar">lembar</option>
    </select>
  )

  return (
    <form id="form-transaksi" onSubmit={kirim} noValidate className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-3">
        <SelectInput
          label="Jenis"
          value={d.jenis}
          onChange={(e) => set('jenis', e.target.value as JenisTransaksi)}
        >
          {(Object.keys(JENIS_LABEL) as JenisTransaksi[]).map((j) => (
            <option key={j} value={j}>
              {JENIS_LABEL[j]}
            </option>
          ))}
        </SelectInput>
        <TextInput
          label="Tanggal"
          type="date"
          value={d.tanggal}
          max={hariIni()}
          onChange={(e) => set('tanggal', e.target.value)}
          error={galat.tanggal}
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SelectInput
          label="Broker"
          value={d.broker}
          onChange={(e) => set('broker', e.target.value as Broker)}
        >
          {DAFTAR_BROKER.map((b) => (
            <option key={b} value={b}>
              {BROKERS[b].nama}
            </option>
          ))}
        </SelectInput>
        <TextInput
          label="Ticker"
          value={d.ticker}
          maxLength={4}
          placeholder="BBCA"
          autoCapitalize="characters"
          list="daftar-ticker"
          className="font-mono uppercase"
          onChange={(e) => set('ticker', e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
          error={galat.ticker}
        />
        <datalist id="daftar-ticker">
          {tickerDikenal.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </div>

      {(berharga || d.jenis === 'DIVIDEN_SAHAM') && (
        <div className="grid grid-cols-2 gap-3">
          <NumberInput
            label={d.jenis === 'DIVIDEN_SAHAM' ? 'Lembar diterima' : 'Jumlah'}
            value={d.jumlah}
            onChange={(n) => set('jumlah', n)}
            suffix={satuanToggle}
            error={galat.lembar}
            hint={
              d.jenis === 'JUAL' && d.ticker.length === 4
                ? `Dimiliki: ${formatLot(kepemilikan)}`
                : d.satuan === 'lot' && lembar > 0
                  ? `${lembar.toLocaleString('id-ID')} lembar`
                  : undefined
            }
          />
          {berharga && (
            <NumberInput
              label={d.jenis === 'RIGHTS' ? 'Harga tebus / lembar' : 'Harga / lembar'}
              prefix="Rp"
              value={d.harga}
              onChange={(n) => set('harga', n)}
              error={galat.harga}
            />
          )}
        </div>
      )}

      {berharga && (
        <div className="rounded-control border border-border bg-surface-sunk/60 p-3">
          <div className="grid grid-cols-2 gap-3">
            <NumberInput
              label="Fee broker"
              prefix="Rp"
              value={fee}
              onChange={(n) => setD((x) => ({ ...x, feeManual: true, fee: n, pajak: x.feeManual ? x.pajak : otomatis.pajak }))}
              error={galat.fee}
            />
            {d.jenis === 'JUAL' && (
              <NumberInput
                label="PPh final 0,1%"
                prefix="Rp"
                value={pajak}
                onChange={(n) => setD((x) => ({ ...x, feeManual: true, pajak: n, fee: x.feeManual ? x.fee : otomatis.fee }))}
                error={galat.pajak}
              />
            )}
          </div>
          <p className="mt-2 flex items-center justify-between gap-2 text-[12.5px] text-muted">
            {d.feeManual ? (
              <>
                <span>Diisi manual — sesuaikan dengan konfirmasi broker.</span>
                <button
                  type="button"
                  className="font-semibold text-accent hover:underline"
                  onClick={() => setD((x) => ({ ...x, feeManual: false }))}
                >
                  Hitung otomatis
                </button>
              </>
            ) : (
              <span>
                Otomatis dari tarif {BROKERS[d.broker].nama}. Ubah kalau berbeda dengan
                konfirmasi.
              </span>
            )}
          </p>
        </div>
      )}

      {(d.jenis === 'SPLIT' || d.jenis === 'REVERSE_SPLIT') && (
        <NumberInput
          label={d.jenis === 'SPLIT' ? 'Rasio split (1 : r)' : 'Rasio reverse split (r : 1)'}
          value={d.rasio}
          onChange={(n) => set('rasio', n)}
          error={galat.rasio}
          hint={
            d.jenis === 'SPLIT'
              ? 'Mis. 5 → setiap 1 lembar jadi 5. Modal tetap.'
              : 'Mis. 4 → setiap 4 lembar jadi 1, dibulatkan ke bawah. Sisa yang diuangkan dicatat terpisah.'
          }
        />
      )}

      {d.jenis === 'DIVIDEN_TUNAI' && (
        <NumberInput
          label="Dividen bersih diterima"
          prefix="Rp"
          value={d.dividen}
          onChange={(n) => set('dividen', n)}
          error={galat.jumlah}
          hint="Setelah pajak dividen, sesuai yang masuk ke RDN."
        />
      )}

      <TextInput
        label="Tesis (opsional)"
        value={d.tesis}
        placeholder="Kenapa beli/jual?"
        onChange={(e) => set('tesis', e.target.value)}
      />
      <TextInput
        label="Catatan (opsional)"
        value={d.catatan}
        onChange={(e) => set('catatan', e.target.value)}
      />

      {(berharga || d.jenis === 'DIVIDEN_TUNAI') && (
        <dl className="grid grid-cols-2 gap-y-1 rounded-control border border-border p-3 text-[13px]">
          {berharga && (
            <>
              <dt className="text-muted">Nilai transaksi</dt>
              <dd className="num">{rp(nilaiTx(lembar, d.harga ?? 0))}</dd>
            </>
          )}
          <dt className="font-semibold">{arus < 0 ? 'Total didebit' : 'Total diterima'}</dt>
          <dd className="num font-semibold">{rp(Math.abs(arus))}</dd>
        </dl>
      )}

      {galatUmum && (
        <p role="alert" className="flex items-start gap-2 rounded-control bg-loss-bg p-3 text-[13px] text-loss">
          <Icon name="alert" size={16} className="mt-0.5 shrink-0" />
          {galatUmum}
        </p>
      )}

      <div className="flex justify-end gap-3 pt-1">
        <Button variant="ghost" onClick={onBatal}>
          Batal
        </Button>
        <Button variant="primary" type="submit" disabled={menyimpan}>
          {awal ? 'Simpan perubahan' : 'Simpan transaksi'}
        </Button>
      </div>
    </form>
  )
}
