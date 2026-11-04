import { describe, expect, it } from 'vitest'
import { hitungBiaya } from '../fees'
import { hitungPosisi } from '../positions'
import type { Transaction } from '../types'
import { tx } from './helpers'

/*
 * Kasus uji #15 — versi DATA FIKTIF untuk repo publik.
 * Versi data asli ada di data-asli.test.ts (masuk .gitignore).
 *
 * Skenario: riwayat TLKM di BIONS, dengan fee diisi dari hitungBiaya() seperti
 * yang dilakukan form, lalu dibandingkan dengan angka yang "tampil di aplikasi
 * broker" (dihitung manual).
 */

function dariForm(t: Omit<Transaction, 'id' | 'dibuatPada' | 'fee' | 'pajak'>): Transaction {
  const jenis = t.jenis === 'JUAL' ? 'JUAL' : 'BELI'
  return tx({ ...t, ...hitungBiaya(t.lembar * t.harga, t.broker, jenis) })
}

describe('#15 data fiktif — cocok dengan angka broker', () => {
  const riwayat = [
    // 3.100.000 × 0,17% = 5.270
    dariForm({ tanggal: '2026-02-03', broker: 'BIONS', ticker: 'TLKM', jenis: 'BELI', lembar: 1000, harga: 3100 }),
    // 1.450.000 × 0,17% = 2.465
    dariForm({ tanggal: '2026-03-11', broker: 'BIONS', ticker: 'TLKM', jenis: 'BELI', lembar: 500, harga: 2900 }),
    // 1.980.000 → fee 3.366, PPh 1.980
    dariForm({ tanggal: '2026-05-20', broker: 'BIONS', ticker: 'TLKM', jenis: 'JUAL', lembar: 600, harga: 3300 }),
    // 900.000 × 0,17% = 1.530
    dariForm({ tanggal: '2026-07-08', broker: 'BIONS', ticker: 'TLKM', jenis: 'BELI', lembar: 300, harga: 3000 }),
  ]

  it('fee yang terisi otomatis sesuai tarif', () => {
    expect(riwayat.map((t) => [t.fee, t.pajak])).toEqual([
      [5270, 0],
      [2465, 0],
      [3366, 1980],
      [1530, 0],
    ])
  })

  it('lembar, modal, avg, dan realized cocok dengan hitungan manual', () => {
    // modal setelah 2 beli: 3.105.270 + 1.452.465 = 4.557.735 (1.500 lembar)
    // jual 600: hpp = 4.557.735 × 600/1.500 = 1.823.094
    //           bersih = 1.980.000 − 3.366 − 1.980 = 1.974.654 → realized 151.560
    // sisa modal 2.734.641 + beli 901.530 = 3.636.171 (1.200 lembar)
    // avg = 3.030,1425 → aplikasi broker menampilkan "3.030"
    const [p] = hitungPosisi(riwayat)
    expect(p.lembar).toBe(1200)
    expect(p.modal).toBe(3_636_171)
    expect(p.realized).toBe(151_560)
    expect(Math.round(p.hargaRataRata)).toBe(3030)
  })
})
