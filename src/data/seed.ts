import { BROKER_AWAL, LEMBAR_PER_LOT } from '../config/brokers'
import { cariBroker } from '../domain/brokers'
import { hitungBiaya } from '../domain/fees'
import type { Broker, JenisTransaksi, TransaksiBaru } from '../domain/types'
import { sudahPernahDibuka, tandaiSudahDibuka } from './preferences'
import type { Penyimpanan } from './Penyimpanan'

/*
 * DATA CONTOH — FIKTIF.
 * Ticker nyata dipakai supaya mudah dibaca, tetapi seluruh transaksi, harga,
 * dividen, dan corporate action (termasuk stock split ICBP) adalah karangan
 * untuk demo, BUKAN data historis maupun data finansial pemilik repo.
 */

type Baris =
  | [
      tanggal: string,
      broker: Broker,
      ticker: string,
      jenis: 'BELI' | 'JUAL' | 'RIGHTS',
      lot: number,
      harga: number,
      tesis?: string,
    ]
  | [tanggal: string, broker: Broker, ticker: string, jenis: 'DIVIDEN_TUNAI', jumlah: number]
  | [
      tanggal: string,
      broker: Broker,
      ticker: string,
      jenis: 'SPLIT' | 'REVERSE_SPLIT',
      rasio: number,
    ]

const B: Broker = 'BIONS'
const S: Broker = 'STOCKBIT'

// Urut kronologis — urutan array menjadi urutan dibuatPada.
const RIWAYAT: Baris[] = [
  ['2025-01-14', B, 'BMRI', 'BELI', 40, 6200, 'Bank BUMN, valuasi wajar'],
  ['2025-02-10', B, 'BBCA', 'BELI', 30, 9650, 'Inti portofolio jangka panjang'],
  ['2025-03-05', B, 'TLKM', 'BELI', 100, 3400, 'Dividen stabil'],
  ['2025-03-18', B, 'ICBP', 'BELI', 10, 11200],
  ['2025-04-07', S, 'GOTO', 'BELI', 50, 68, 'Coba-coba, spekulatif'],
  ['2025-04-22', B, 'BBCA', 'DIVIDEN_TUNAI', 765_000],
  ['2025-05-12', B, 'ASII', 'BELI', 60, 4900],
  ['2025-05-20', S, 'ADRO', 'BELI', 20, 2400, 'Momentum batu bara'],
  ['2025-05-28', B, 'TLKM', 'DIVIDEN_TUNAI', 1_520_000],
  ['2025-06-11', S, 'GOTO', 'BELI', 100, 62, 'Average down'],
  ['2025-06-16', B, 'BBCA', 'BELI', 20, 8900, 'Tambah saat koreksi'],
  ['2025-07-02', B, 'ANTM', 'BELI', 80, 1520, 'Harga emas naik'],
  ['2025-07-24', B, 'ASII', 'DIVIDEN_TUNAI', 1_014_000],
  ['2025-08-05', S, 'BUKA', 'BELI', 100, 140],
  ['2025-08-19', B, 'UNVR', 'BELI', 30, 1980, 'Turnaround?'],
  ['2025-09-09', S, 'BBCA', 'BELI', 3, 8500, 'Ticker sama, broker beda'],
  ['2025-09-23', B, 'TLKM', 'BELI', 50, 2750, 'Average down'],
  ['2025-10-06', B, 'ICBP', 'SPLIT', 5],
  ['2025-10-21', S, 'GOTO', 'JUAL', 80, 58, 'Cut loss sebagian'],
  ['2025-11-11', B, 'BMRI', 'JUAL', 15, 5800, 'Kurangi eksposur bank'],
  ['2025-12-03', S, 'ADRO', 'JUAL', 20, 2650, 'Ambil untung'],
  ['2026-01-13', B, 'ANTM', 'JUAL', 40, 2650, 'Ambil untung separuh'],
  ['2026-01-27', B, 'ICBP', 'BELI', 20, 2150],
  ['2026-02-04', S, 'MDKA', 'BELI', 15, 2300],
  ['2026-02-12', B, 'BBCA', 'JUAL', 10, 9900, 'Rebalancing'],
  ['2026-03-10', S, 'BBCA', 'JUAL', 3, 9200],
  ['2026-04-14', S, 'MDKA', 'JUAL', 15, 2100, 'Tesis gagal'],
  ['2026-04-21', B, 'BBCA', 'DIVIDEN_TUNAI', 1_020_000],
  ['2026-05-06', S, 'BBCA', 'BELI', 2, 8800],
  ['2026-05-27', B, 'TLKM', 'DIVIDEN_TUNAI', 2_150_000],
  ['2026-06-09', S, 'PGAS', 'BELI', 25, 1600],
  ['2026-07-15', B, 'ASII', 'BELI', 20, 5100],
  ['2026-08-04', S, 'BUKA', 'BELI', 50, 124, 'Average down kecil'],
  ['2026-09-08', B, 'BMRI', 'BELI', 10, 5300],
  ['2026-10-13', S, 'PGAS', 'JUAL', 10, 1720],
  ['2026-10-28', B, 'ANTM', 'BELI', 20, 2900],
]

/** Harga pasar contoh — fiktif. */
export const HARGA_CONTOH: Record<string, number> = {
  BBCA: 8700,
  TLKM: 3050,
  BMRI: 5150,
  ASII: 5425,
  ANTM: 2980,
  UNVR: 1740,
  ICBP: 2300,
  GOTO: 54,
  BUKA: 118,
  PGAS: 1580,
}

export const TANGGAL_HARGA_CONTOH = '2026-11-03T09:00:00.000Z'

/** Bangun transaksi contoh. Fee & pajak diisi persis seperti yang dilakukan form. */
export function buatDataContoh(): TransaksiBaru[] {
  return RIWAYAT.map((b): TransaksiBaru => {
    const [tanggal, broker, ticker, jenis] = b
    const dasar = {
      tanggal,
      broker,
      ticker,
      jenis: jenis as JenisTransaksi,
      lembar: 0,
      harga: 0,
      fee: 0,
      pajak: 0,
    }
    switch (b[3]) {
      case 'BELI':
      case 'JUAL':
      case 'RIGHTS': {
        const lembar = b[4] * LEMBAR_PER_LOT
        const harga = b[5]
        // Data contoh selalu memakai tarif broker AWAL, bukan tarif yang sudah diubah pengguna.
        const tarif = cariBroker(BROKER_AWAL, broker)
        if (!tarif) throw new Error(`Broker contoh ${broker} tidak ada di BROKER_AWAL`)
        const biaya = hitungBiaya(lembar * harga, tarif, b[3] === 'JUAL' ? 'JUAL' : 'BELI')
        return { ...dasar, lembar, harga, ...biaya, ...(b[6] ? { tesis: b[6] } : {}) }
      }
      case 'DIVIDEN_TUNAI':
        return { ...dasar, jumlah: b[4] }
      case 'SPLIT':
      case 'REVERSE_SPLIT':
        return { ...dasar, rasio: b[4] }
    }
  })
}

/** Broker yang dipakai data contoh harus terdaftar — tambahkan yang belum ada. */
async function pastikanBrokerContoh(p: Penyimpanan): Promise<void> {
  const ada = new Set((await p.broker.getAll()).map((b) => b.id))
  for (const b of BROKER_AWAL) if (!ada.has(b.id)) await p.broker.add({ ...b })
}

export async function muatDataContoh(p: Penyimpanan): Promise<void> {
  await pastikanBrokerContoh(p)
  await p.transaksi.replaceAll(buatDataContoh())
  await p.harga.replaceAll(HARGA_CONTOH, TANGGAL_HARGA_CONTOH)
}

/** Menghapus transaksi & harga. Daftar broker dipertahankan. */
export async function kosongkanData(p: Penyimpanan): Promise<void> {
  await p.transaksi.replaceAll([])
  await p.harga.replaceAll({}, new Date().toISOString())
}

/**
 * Saat aplikasi pertama kali dibuka di sebuah perangkat (mode lokal) dan penyimpanannya
 * kosong, isi dengan data contoh — supaya pengunjung (recruiter) tidak melihat layar kosong.
 * Setelah itu tidak pernah otomatis lagi: "Kosongkan data" tetap kosong.
 * Akun (mode API) tidak pernah diisi otomatis — itu data sungguhan.
 */
let pemuatanPertama: Promise<void> | null = null

export function muatContohSaatPertamaDibuka(p: Penyimpanan): Promise<void> {
  if (p.jenis !== 'lokal') return Promise.resolve()
  // Satu promise per sesi: efek ganda StrictMode menunggu pemuatan yang sama,
  // bukan membaca penyimpanan yang masih kosong.
  pemuatanPertama ??= (async () => {
    if (sudahPernahDibuka()) return
    tandaiSudahDibuka()
    if ((await p.transaksi.getAll()).length === 0) await muatDataContoh(p)
  })()
  return pemuatanPertama
}
