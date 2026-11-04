import { LEMBAR_PER_LOT } from '../config/brokers'

/*
 * Uang selalu bilangan bulat rupiah. Semua titik perhitungan yang bisa
 * menghasilkan pecahan (perkalian tarif, HPP proporsional) lewat `bulat()`.
 */

/** Membulatkan ke rupiah terdekat. Menghindari -0 supaya tidak tampil sebagai "−Rp0". */
export function bulat(n: number): number {
  const r = Math.round(n)
  return r === 0 ? 0 : r
}

/** Nilai transaksi: lembar × harga. Keduanya bilangan bulat, hasilnya juga. */
export function nilai(lembar: number, harga: number): number {
  return lembar * harga
}

// ── Format tampilan ─────────────────────────────────────────────────────────
// Format murni (Intl), tanpa I/O — karena itu boleh tinggal di domain/.

const fmtAngka = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 0 })
const fmtDesimal2 = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})
const fmtDesimal1 = new Intl.NumberFormat('id-ID', { maximumFractionDigits: 1 })

const MINUS = '−' // minus tipografis, sejajar dengan digit

/** `Rp8.980.450` — tanpa desimal, pengelompokan Indonesia 3-3-3 dengan titik. */
export function rp(n: number, opts?: { ringkas?: boolean }): string {
  const tanda = n < 0 ? MINUS : ''
  const a = Math.abs(n)
  if (opts?.ringkas) {
    if (a >= 1e12) return `${tanda}Rp${fmtDesimal1.format(a / 1e12)} T`
    if (a >= 1e9) return `${tanda}Rp${fmtDesimal1.format(a / 1e9)} M`
    if (a >= 1e6) return `${tanda}Rp${fmtDesimal1.format(a / 1e6)} jt`
    if (a >= 1e3) return `${tanda}Rp${fmtAngka.format(Math.round(a / 1e3))} rb`
  }
  return `${tanda}Rp${fmtAngka.format(Math.round(a))}`
}

/** `+Rp1.240.000` / `−Rp340.000` / `Rp0` — tanda selalu eksplisit untuk P/L. */
export function rpBertanda(n: number, opts?: { ringkas?: boolean }): string {
  if (n > 0) return `+${rp(n, opts)}`
  return rp(n, opts) // negatif sudah membawa −, nol tanpa tanda
}

/** Harga rata-rata: satu-satunya angka rupiah yang boleh tampil dengan 2 desimal. */
export function rpDesimal(n: number): string {
  return fmtDesimal2.format(n)
}

/** Harga per lembar tanpa awalan Rp, untuk kolom tabel: `9.233`. */
export function angka(n: number): string {
  return fmtAngka.format(n)
}

/** `+8,2%` / `−2,1%` / `0%` — dari rasio (0.082 → +8,2%). */
export function persenBertanda(rasio: number): string {
  const p = rasio * 100
  const teks = `${fmtDesimal1.format(Math.abs(p))}%`
  if (Math.abs(p) < 0.05) return '0%'
  return p > 0 ? `+${teks}` : `${MINUS}${teks}`
}

export function persen(rasio: number): string {
  return `${fmtDesimal1.format(rasio * 100)}%`
}

// ── Lot & lembar ────────────────────────────────────────────────────────────

/**
 * Lot tidak pernah pecahan. Sisa lembar (odd lot — mis. setelah reverse split)
 * ditampilkan terpisah: `{ lot: 0, sisa: 37 }`.
 */
export function keLot(lembar: number): { lot: number; sisa: number } {
  return { lot: Math.floor(lembar / LEMBAR_PER_LOT), sisa: lembar % LEMBAR_PER_LOT }
}

export function formatLot(lembar: number): string {
  const { lot, sisa } = keLot(lembar)
  if (sisa === 0) return `${angka(lot)} lot`
  if (lot === 0) return `${angka(sisa)} lbr`
  return `${angka(lot)} lot + ${angka(sisa)} lbr`
}

export function formatLembar(lembar: number): string {
  return `${angka(lembar)} lembar`
}

export function lotKeLembar(lot: number): number {
  return lot * LEMBAR_PER_LOT
}

/** Arah nilai untuk penanda warna + panah di UI. */
export type Arah = 'naik' | 'turun' | 'datar'
export function arah(n: number): Arah {
  if (n > 0) return 'naik'
  if (n < 0) return 'turun'
  return 'datar'
}
