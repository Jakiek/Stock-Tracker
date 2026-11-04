import { describe, expect, it } from 'vitest'
import { hitungPosisi, periksaRiwayat, TransaksiTidakKonsisten } from '../positions'
import { tx } from './helpers'

/*
 * Kasus uji wajib — ARCHITECTURE.md §6.
 * Angka harapan dihitung manual dan ditulis di komentar supaya bisa diperiksa ulang.
 */

const satu = (txs: Parameters<typeof hitungPosisi>[0]) => {
  const hasil = hitungPosisi(txs)
  expect(hasil).toHaveLength(1)
  return hasil[0]
}

describe('hitungPosisi — kasus uji wajib', () => {
  it('#1 satu kali beli: modal = n×p + fee, avg > harga beli', () => {
    // 100 × 9.000 + 1.530 = 901.530
    const p = satu([tx({ jenis: 'BELI', lembar: 100, harga: 9000, fee: 1530 })])
    expect(p.lembar).toBe(100)
    expect(p.modal).toBe(901_530)
    expect(p.hargaRataRata).toBeCloseTo(9015.3, 10)
    expect(p.hargaRataRata).toBeGreaterThan(9000)
  })

  it('#2 tiga kali beli: rata-rata tertimbang, bukan rata-rata sederhana', () => {
    // 100×1.000+170 = 100.170 · 200×1.200+408 = 240.408 · 300×900+459 = 270.459
    // modal 611.037 / 600 lembar = 1.018,395  (rata-rata sederhana harga: 1.033,33)
    const p = satu([
      tx({ jenis: 'BELI', lembar: 100, harga: 1000, fee: 170 }),
      tx({ jenis: 'BELI', lembar: 200, harga: 1200, fee: 408 }),
      tx({ jenis: 'BELI', lembar: 300, harga: 900, fee: 459 }),
    ])
    expect(p.lembar).toBe(600)
    expect(p.modal).toBe(611_037)
    expect(p.hargaRataRata).toBeCloseTo(1018.395, 10)
    expect(p.hargaRataRata).not.toBeCloseTo((1000 + 1200 + 900) / 3, 0)
  })

  it('#3 jual sebagian: HPP proporsional, sisa modal benar', () => {
    // beli 1.000 @1.000 fee 1.700 → modal 1.001.700
    // jual 400 @1.200 fee 816 pajak 480
    //   hpp = 1.001.700 × 400/1.000 = 400.680
    //   bersih = 480.000 − 816 − 480 = 478.704 → realized 78.024
    //   sisa modal 601.020, 600 lembar, avg tetap 1.001,7
    const p = satu([
      tx({ jenis: 'BELI', lembar: 1000, harga: 1000, fee: 1700 }),
      tx({ jenis: 'JUAL', lembar: 400, harga: 1200, fee: 816, pajak: 480 }),
    ])
    expect(p.lembar).toBe(600)
    expect(p.modal).toBe(601_020)
    expect(p.realized).toBe(78_024)
    expect(p.hargaRataRata).toBeCloseTo(1001.7, 10)
  })

  it('#4 jual habis: lembar 0, modal 0, realized = total keuntungan bersih', () => {
    // beli 500 @2.000 fee 1.700 → modal 1.001.700
    // jual 500 @2.200 fee 1.870 pajak 1.100 → bersih 1.097.030 → realized 95.330
    const p = satu([
      tx({ jenis: 'BELI', lembar: 500, harga: 2000, fee: 1700 }),
      tx({ jenis: 'JUAL', lembar: 500, harga: 2200, fee: 1870, pajak: 1100 }),
    ])
    expect(p.lembar).toBe(0)
    expect(p.modal).toBe(0)
    expect(p.realized).toBe(95_330)
    expect(p.hargaRataRata).toBe(0)
  })

  it('#5 jual habis lalu beli lagi: avg baru tidak terkontaminasi posisi lama', () => {
    // setelah #4, beli 100 @1.500 fee 255 → modal 150.255, avg 1.502,55
    const p = satu([
      tx({ jenis: 'BELI', lembar: 500, harga: 2000, fee: 1700 }),
      tx({ jenis: 'JUAL', lembar: 500, harga: 2200, fee: 1870, pajak: 1100 }),
      tx({ jenis: 'BELI', lembar: 100, harga: 1500, fee: 255 }),
    ])
    expect(p.lembar).toBe(100)
    expect(p.modal).toBe(150_255)
    expect(p.hargaRataRata).toBeCloseTo(1502.55, 10)
    expect(p.realized).toBe(95_330) // realized lama tetap tercatat
  })

  it('#6 jual rugi: realized negatif, pajak tetap dipotong', () => {
    // beli 1.000 @500 fee 850 → modal 500.850
    // jual 1.000 @400 fee 680 pajak 400 → bersih 398.920 → realized −101.930
    const p = satu([
      tx({ jenis: 'BELI', lembar: 1000, harga: 500, fee: 850 }),
      tx({ jenis: 'JUAL', lembar: 1000, harga: 400, fee: 680, pajak: 400 }),
    ])
    expect(p.realized).toBe(-101_930)
    // tanpa pajak, rugi akan −101.530 — pajak 400 ikut memperbesar rugi
    expect(p.realized).toBe(400_000 - 680 - 400 - 500_850)
  })

  it('#7 stock split 1:5: lembar ×5, modal tetap, avg jadi seperlima', () => {
    // beli 100 @5.000 fee 850 → modal 500.850, avg 5.008,5 → setelah split avg 1.001,7
    const p = satu([
      tx({ jenis: 'BELI', lembar: 100, harga: 5000, fee: 850 }),
      tx({ jenis: 'SPLIT', rasio: 5 }),
    ])
    expect(p.lembar).toBe(500)
    expect(p.modal).toBe(500_850)
    expect(p.hargaRataRata).toBeCloseTo(5008.5 / 5, 10)
  })

  it('#8 reverse split dengan sisa pecahan: dibulatkan ke bawah, tetap bilangan bulat', () => {
    // 150 lembar, rasio 4 → 37,5 → 37 lembar; modal tetap
    const p = satu([
      tx({ jenis: 'BELI', lembar: 150, harga: 100, fee: 26 }),
      tx({ jenis: 'REVERSE_SPLIT', rasio: 4 }),
    ])
    expect(p.lembar).toBe(37)
    expect(Number.isInteger(p.lembar)).toBe(true)
    expect(p.modal).toBe(15_026)
  })

  it('#9 rights issue ditebus: modal bertambah sebesar harga tebus + fee', () => {
    // beli 1.000 @1.000 fee 1.700 → 1.001.700; rights 500 @800 fee 600 → +400.600
    const p = satu([
      tx({ jenis: 'BELI', lembar: 1000, harga: 1000, fee: 1700 }),
      tx({ jenis: 'RIGHTS', lembar: 500, harga: 800, fee: 600 }),
    ])
    expect(p.lembar).toBe(1500)
    expect(p.modal).toBe(1_402_300)
  })

  // #10 (fee minimum) ada di fees-minimum.test.ts — butuh vi.mock config tersendiri.

  it('#11 ticker sama di dua broker: menghasilkan DUA posisi terpisah', () => {
    const hasil = hitungPosisi([
      tx({ jenis: 'BELI', broker: 'BIONS', lembar: 100, harga: 9000, fee: 1530 }),
      tx({ jenis: 'BELI', broker: 'STOCKBIT', lembar: 100, harga: 9200, fee: 1380 }),
    ])
    expect(hasil).toHaveLength(2)
    const bions = hasil.find((p) => p.broker === 'BIONS')
    const sb = hasil.find((p) => p.broker === 'STOCKBIT')
    expect(bions?.modal).toBe(901_530)
    expect(sb?.modal).toBe(921_380)
    // tidak ada posisi gabungan dengan avg (9.015,3 + 9.213,8)/2
  })

  it('#12 input tidak urut tanggal: hasil identik dengan input yang sudah urut', () => {
    const urut = [
      tx({ tanggal: '2026-01-05', jenis: 'BELI', lembar: 1000, harga: 1000, fee: 1700 }),
      tx({ tanggal: '2026-02-10', jenis: 'JUAL', lembar: 400, harga: 1200, fee: 816, pajak: 480 }),
      tx({ tanggal: '2026-03-01', jenis: 'SPLIT', rasio: 2 }),
      tx({ tanggal: '2026-03-15', jenis: 'JUAL', lembar: 1200, harga: 650, fee: 1326, pajak: 780 }),
      tx({ tanggal: '2026-04-01', jenis: 'BELI', lembar: 200, harga: 700, fee: 238 }),
    ]
    const acak = [urut[3], urut[0], urut[4], urut[2], urut[1]]
    const terbalik = [...urut].reverse()

    expect(hitungPosisi(acak)).toEqual(hitungPosisi(urut))
    expect(hitungPosisi(terbalik)).toEqual(hitungPosisi(urut))
    // tanpa pengurutan, JUAL 1.200 di urutan pertama akan melempar error
  })

  it('#13 beli dan jual di tanggal sama: dibuatPada menentukan urutan, hasil deterministik', () => {
    const beli = tx({
      tanggal: '2026-05-04',
      dibuatPada: '2026-05-04T02:00:00.000Z',
      jenis: 'BELI',
      lembar: 100,
      harga: 1000,
      fee: 170,
    })
    const jual = tx({
      tanggal: '2026-05-04',
      dibuatPada: '2026-05-04T03:00:00.000Z',
      jenis: 'JUAL',
      lembar: 100,
      harga: 1050,
      fee: 179,
      pajak: 105,
    })
    // urutan array terbalik, tapi dibuatPada beli lebih awal → beli diproses dulu
    const a = hitungPosisi([jual, beli])
    const b = hitungPosisi([beli, jual])
    expect(a).toEqual(b)
    expect(a[0].lembar).toBe(0)
    expect(a[0].realized).toBe(105_000 - 179 - 105 - 100_170)

    // bukti bahwa dibuatPada-lah yang menentukan: kalau dibalik, jual duluan → error
    const jualDuluan = { ...jual, dibuatPada: '2026-05-04T01:00:00.000Z' }
    expect(() => hitungPosisi([beli, jualDuluan])).toThrow(TransaksiTidakKonsisten)
  })

  it('#14 jual melebihi kepemilikan: melempar error, bukan lembar negatif', () => {
    const txs = [
      tx({ jenis: 'BELI', lembar: 100, harga: 1000, fee: 170 }),
      tx({ jenis: 'JUAL', lembar: 200, harga: 1100, fee: 374, pajak: 220 }),
    ]
    expect(() => hitungPosisi(txs)).toThrow(TransaksiTidakKonsisten)
    expect(() => hitungPosisi(txs)).toThrow(/kepemilikan hanya 100 lembar/)
  })
})

describe('hitungPosisi — jenis lain', () => {
  it('DIVIDEN_TUNAI masuk dividen, TIDAK masuk realized', () => {
    const p = satu([
      tx({ jenis: 'BELI', lembar: 100, harga: 9000, fee: 1530 }),
      tx({ jenis: 'DIVIDEN_TUNAI', jumlah: 25_500 }),
    ])
    expect(p.dividen).toBe(25_500)
    expect(p.realized).toBe(0)
    expect(p.modal).toBe(901_530)
  })

  it('DIVIDEN_SAHAM menambah lembar, modal tetap', () => {
    const p = satu([
      tx({ jenis: 'BELI', lembar: 1000, harga: 500, fee: 850 }),
      tx({ jenis: 'DIVIDEN_SAHAM', lembar: 100 }),
    ])
    expect(p.lembar).toBe(1100)
    expect(p.modal).toBe(500_850)
  })

  it('SPLIT tanpa rasio dianggap data tidak konsisten', () => {
    expect(() =>
      hitungPosisi([tx({ jenis: 'BELI', lembar: 100, harga: 100 }), tx({ jenis: 'SPLIT' })]),
    ).toThrow(TransaksiTidakKonsisten)
  })

  it('modal dan lembar selalu bilangan bulat setelah jual berkali-kali', () => {
    // 3 lembar modal 1.000 → jual 1 lembar: hpp = 333,33 → dibulatkan 333
    const p = satu([
      tx({ jenis: 'BELI', lembar: 3, harga: 333, fee: 1 }),
      tx({ jenis: 'JUAL', lembar: 1, harga: 400 }),
      tx({ jenis: 'JUAL', lembar: 1, harga: 400 }),
    ])
    expect(Number.isInteger(p.modal)).toBe(true)
    expect(Number.isInteger(p.realized)).toBe(true)
    expect(p.modal).toBe(1000 - 333 - 334) // 1.000×1/3=333 · 667×1/2=333,5→334
  })

  it('periksaRiwayat mengembalikan pesan, bukan melempar', () => {
    const beli = tx({ jenis: 'BELI', lembar: 100, harga: 1000 })
    expect(periksaRiwayat([beli])).toBeNull()
    expect(periksaRiwayat([beli, tx({ jenis: 'JUAL', lembar: 200, harga: 1000 })])).toMatch(
      /kepemilikan hanya 100/,
    )
  })

  it('tidak memutasi array input', () => {
    const txs = [
      tx({ tanggal: '2026-02-01', jenis: 'BELI', lembar: 100, harga: 100 }),
      tx({ tanggal: '2026-01-01', jenis: 'BELI', lembar: 100, harga: 100 }),
    ]
    const salinan = structuredClone(txs)
    hitungPosisi(txs)
    expect(txs).toEqual(salinan)
  })
})
