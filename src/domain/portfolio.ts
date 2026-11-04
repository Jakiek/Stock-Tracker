import { DAFTAR_BROKER } from '../config/brokers'
import { hitungBiaya } from './fees'
import { hitungPosisi } from './positions'
import type { Broker, Position, Transaction } from './types'

/** Harga pasar per lembar, per ticker. `undefined` = belum diisi. */
export type PetaHarga = Readonly<Record<string, number | undefined>>

export type BarisPosisi = Position & {
  hargaPasar: number | null
  /** lembar × hargaPasar; kalau harga belum ada, sama dengan modal (unrealized 0). */
  nilai: number
  /** Sebelum biaya keluar: nilai − modal. */
  unrealized: number
  /** Setelah fee jual + PPh final yang pasti dibayar saat merealisasikan. */
  unrealizedBersih: number
  /** Rasio unrealized / modal, null kalau tidak bermakna. */
  unrealizedPersen: number | null
  unrealizedBersihPersen: number | null
  adaHarga: boolean
}

export function hitungBarisPosisi(p: Position, hargaPasar: number | undefined): BarisPosisi {
  const adaHarga = hargaPasar !== undefined && hargaPasar > 0 && p.lembar > 0
  if (!adaHarga) {
    return {
      ...p,
      hargaPasar: hargaPasar ?? null,
      nilai: p.modal,
      unrealized: 0,
      unrealizedBersih: 0,
      unrealizedPersen: null,
      unrealizedBersihPersen: null,
      adaHarga: false,
    }
  }
  const nilai = p.lembar * hargaPasar
  const unrealized = nilai - p.modal
  const { fee, pajak } = hitungBiaya(nilai, p.broker, 'JUAL')
  const unrealizedBersih = unrealized - fee - pajak
  return {
    ...p,
    hargaPasar,
    nilai,
    unrealized,
    unrealizedBersih,
    unrealizedPersen: p.modal > 0 ? unrealized / p.modal : null,
    unrealizedBersihPersen: p.modal > 0 ? unrealizedBersih / p.modal : null,
    adaHarga: true,
  }
}

export function posisiTerbuka<T extends Position>(posisi: readonly T[]): T[] {
  return posisi.filter((p) => p.lembar > 0)
}

export function hitungBarisSemua(posisi: readonly Position[], harga: PetaHarga): BarisPosisi[] {
  return posisi.map((p) => hitungBarisPosisi(p, harga[p.ticker]))
}

export type Total = {
  nilai: number
  modal: number
  unrealized: number
  unrealizedBersih: number
  realized: number
  dividen: number
}

/**
 * Baris total: PENJUMLAHAN, tidak pernah perata-rataan harga lintas broker.
 */
export function jumlahkan(baris: readonly BarisPosisi[]): Total {
  const t: Total = { nilai: 0, modal: 0, unrealized: 0, unrealizedBersih: 0, realized: 0, dividen: 0 }
  for (const b of baris) {
    t.nilai += b.nilai
    t.modal += b.modal
    t.unrealized += b.unrealized
    t.unrealizedBersih += b.unrealizedBersih
    t.realized += b.realized
    t.dividen += b.dividen
  }
  return t
}

export type RingkasanPortofolio = Total & {
  jumlahPosisi: number
  /** Ticker posisi terbuka yang belum punya harga pasar — nilainya memakai modal. */
  tickerTanpaHarga: string[]
}

/**
 * Ringkasan portofolio. Nilai/modal/unrealized dari posisi TERBUKA;
 * realized & dividen dari SEMUA posisi (termasuk yang sudah ditutup).
 */
export function hitungRingkasan(posisi: readonly Position[], harga: PetaHarga): RingkasanPortofolio {
  const semua = hitungBarisSemua(posisi, harga)
  const terbuka = posisiTerbuka(semua)
  const tTerbuka = jumlahkan(terbuka)
  const tSemua = jumlahkan(semua)
  return {
    ...tTerbuka,
    realized: tSemua.realized,
    dividen: tSemua.dividen,
    jumlahPosisi: terbuka.length,
    tickerTanpaHarga: [...new Set(terbuka.filter((b) => !b.adaHarga).map((b) => b.ticker))].sort(),
  }
}

/**
 * Realized yang terjadi sejak `tanggal` (inklusif), mis. awal tahun untuk YTD.
 * Dihitung sebagai selisih dua kali hitungPosisi — tetap dari transaksi, tidak disimpan.
 */
export function realizedSejak(transaksi: readonly Transaction[], tanggal: string): number {
  const total = (txs: readonly Transaction[]) =>
    hitungPosisi(txs).reduce((s, p) => s + p.realized, 0)
  return total(transaksi) - total(transaksi.filter((t) => t.tanggal < tanggal))
}

export type SegmenKomposisi = { label: string; nilai: number; porsi: number; lainnya: boolean }

/**
 * Komposisi nilai per ticker (dijumlahkan lintas broker — penjumlahan, bukan rata-rata).
 * Segmen di bawah `batas` digabung jadi "Lainnya".
 */
export function komposisi(baris: readonly BarisPosisi[], batas = 0.03): SegmenKomposisi[] {
  const perTicker = new Map<string, number>()
  for (const b of posisiTerbuka(baris)) {
    perTicker.set(b.ticker, (perTicker.get(b.ticker) ?? 0) + b.nilai)
  }
  const total = [...perTicker.values()].reduce((s, n) => s + n, 0)
  if (total <= 0) return []

  const urut = [...perTicker.entries()].sort((a, b) => b[1] - a[1])
  const utama: SegmenKomposisi[] = []
  let sisa = 0
  for (const [label, n] of urut) {
    if (n / total < batas) sisa += n
    else utama.push({ label, nilai: n, porsi: n / total, lainnya: false })
  }
  if (sisa > 0) utama.push({ label: 'Lainnya', nilai: sisa, porsi: sisa / total, lainnya: true })
  return utama
}

/**
 * Arus kas sebuah transaksi dari sudut RDN: negatif = uang keluar.
 * Memakai fee & pajak yang TERSIMPAN, bukan dihitung ulang.
 */
export function arusKas(
  tx: Pick<Transaction, 'jenis' | 'lembar' | 'harga' | 'fee' | 'pajak' | 'jumlah'>,
): number {
  switch (tx.jenis) {
    case 'BELI':
    case 'RIGHTS':
      return -(tx.lembar * tx.harga + tx.fee)
    case 'JUAL':
      return tx.lembar * tx.harga - tx.fee - tx.pajak
    case 'DIVIDEN_TUNAI':
      return tx.jumlah ?? 0
    default:
      return 0
  }
}

export type RingkasanBroker = {
  broker: Broker
  jumlahTransaksi: number
  /** Total nilai beli + jual (lembar × harga). */
  volume: number
  /** Total fee + pajak yang benar-benar dibayar (angka tersimpan). */
  biaya: number
  /** biaya / volume — tarif efektif. */
  biayaPerVolume: number | null
  realized: number
  dividen: number
  unrealized: number
  nilai: number
  /** realized + dividen + unrealized. */
  hasilTotal: number
}

/**
 * Perbandingan BIONS vs Stockbit — menjawab "trade di Stockbit sebenarnya
 * untung, atau habis di biaya?". realized sudah dikurangi seluruh biaya;
 * `biaya` ditampilkan terpisah supaya terlihat berapa yang tergerus.
 */
export function ringkasanPerBroker(
  transaksi: readonly Transaction[],
  harga: PetaHarga,
): RingkasanBroker[] {
  const baris = hitungBarisSemua(hitungPosisi(transaksi), harga)
  return DAFTAR_BROKER.map((broker) => {
    const txs = transaksi.filter((t) => t.broker === broker)
    let volume = 0
    let biaya = 0
    for (const t of txs) {
      if (t.jenis === 'BELI' || t.jenis === 'JUAL' || t.jenis === 'RIGHTS') {
        volume += t.lembar * t.harga
        biaya += t.fee + t.pajak
      }
    }
    const b = baris.filter((x) => x.broker === broker)
    const t = jumlahkan(b)
    const tTerbuka = jumlahkan(posisiTerbuka(b))
    return {
      broker,
      jumlahTransaksi: txs.length,
      volume,
      biaya,
      biayaPerVolume: volume > 0 ? biaya / volume : null,
      realized: t.realized,
      dividen: t.dividen,
      unrealized: tTerbuka.unrealized,
      nilai: tTerbuka.nilai,
      hasilTotal: t.realized + t.dividen + tTerbuka.unrealized,
    }
  })
}

/** Total biaya yang dibayar sebuah transaksi (fee + pajak tersimpan). */
export function biayaTransaksi(tx: Pick<Transaction, 'fee' | 'pajak'>): number {
  return tx.fee + tx.pajak
}

/** Rasio terhadap modal (mis. unrealized total / modal total). null kalau modal 0. */
export function rasioTerhadapModal(n: number, modal: number): number | null {
  return modal > 0 ? n / modal : null
}

export type HasilRekonsiliasi = {
  /** avg aplikasi − avg di broker, rupiah per lembar (boleh pecahan: turunan). */
  selisih: number
  cocok: boolean
}

/**
 * Membandingkan avg hitungan aplikasi dengan avg yang tampil di aplikasi broker.
 * Avg aplikasi dihitung ulang dari `modal / lembar` — bukan dari hargaRataRata —
 * supaya hargaRataRata tetap tidak pernah jadi input rumus.
 * Selisih di bawah Rp1 dianggap cocok (broker membulatkan tampilan).
 */
export function rekonsiliasi(
  p: Pick<Position, 'modal' | 'lembar'>,
  avgBroker: number,
): HasilRekonsiliasi | null {
  if (p.lembar <= 0 || avgBroker <= 0) return null
  const selisih = p.modal / p.lembar - avgBroker
  return { selisih, cocok: Math.abs(selisih) < 1 }
}
