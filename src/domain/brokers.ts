import type { Broker, BrokerConfig, Transaction } from './types'

/** Daftar broker milik pengguna, dalam urutan yang ia tentukan. */
export type DaftarBroker = readonly BrokerConfig[]

/** Bagian config yang dibutuhkan untuk menghitung biaya. */
export type TarifBroker = Pick<BrokerConfig, 'feeBeli' | 'feeJual' | 'feeMinimum' | 'pphFinal'>

export function cariBroker(daftar: DaftarBroker, id: Broker): BrokerConfig | undefined {
  return daftar.find((b) => b.id === id)
}

/** Nama tampilan broker. Id yang tidak terdaftar ditampilkan apa adanya. */
export function namaBroker(daftar: DaftarBroker, id: Broker): string {
  return cariBroker(daftar, id)?.nama ?? id
}

/** Nama pendek untuk chip & kolom: bagian dalam kurung dibuang ("BIONS (BNI)" → "BIONS"). */
export function namaPendekBroker(daftar: DaftarBroker, id: Broker): string {
  return namaBroker(daftar, id).replace(/\s*\(.*\)\s*$/, '') || id
}

/**
 * Id broker dari namanya: huruf besar, hanya A–Z dan 0–9, maksimal 12 karakter.
 * "Mirae Asset" → "MIRAEASSET", "IPOT (Indo Premier)" → "IPOTINDOPREM".
 */
export function buatIdBroker(nama: string): Broker {
  return nama
    .normalize('NFKD')
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, '')
    .slice(0, 12)
}

/**
 * Broker yang benar-benar punya transaksi, urut sesuai daftar pengguna.
 * Id yang muncul di transaksi tapi tidak terdaftar ditaruh di akhir (urut abjad),
 * supaya angkanya tetap terlihat, bukan hilang diam-diam.
 */
export function brokerDipakai(
  daftar: DaftarBroker,
  transaksi: readonly Pick<Transaction, 'broker'>[],
): Broker[] {
  const dipakai = new Set(transaksi.map((t) => t.broker))
  const terdaftar = daftar.map((b) => b.id).filter((id) => dipakai.has(id))
  const asing = [...dipakai].filter((id) => !cariBroker(daftar, id)).sort()
  return [...terdaftar, ...asing]
}

/**
 * Tarif dari teks persen yang diketik pengguna ("0,15" atau "0.15") → desimal (0.0015).
 * Dibulatkan ke 6 angka di belakang koma persen supaya 0,15 tidak jadi 0.0015000000000000002.
 * null kalau teks bukan angka.
 */
export function tarifDariPersen(teks: string): number | null {
  const bersih = teks.trim().replace(',', '.')
  if (!/^\d+(\.\d+)?$/.test(bersih)) return null
  return Math.round(Number(bersih) * 1e6) / 1e8
}

/** Kebalikan tarifDariPersen, untuk mengisi form ubah: 0.0015 → "0,15". */
export function persenDariTarif(tarif: number): string {
  return String(Math.round(tarif * 1e8) / 1e6).replace('.', ',')
}
