import { describe, expect, it } from 'vitest'
import {
  arusKas,
  biayaTransaksi,
  hitungBarisPosisi,
  hitungRingkasan,
  jumlahkan,
  komposisi,
  rasioTerhadapModal,
  realizedSejak,
  ringkasanPerBroker,
} from '../portfolio'
import { hitungPosisi } from '../positions'
import { tx } from './helpers'

describe('portfolio', () => {
  const txs = [
    tx({ tanggal: '2025-11-03', broker: 'BIONS', ticker: 'BBCA', jenis: 'BELI', lembar: 1000, harga: 9000, fee: 15_300 }),
    tx({ tanggal: '2025-12-01', broker: 'BIONS', ticker: 'BBCA', jenis: 'JUAL', lembar: 200, harga: 9500, fee: 3230, pajak: 1900 }),
    tx({ tanggal: '2026-02-01', broker: 'BIONS', ticker: 'BBCA', jenis: 'JUAL', lembar: 300, harga: 9800, fee: 4998, pajak: 2940 }),
    tx({ tanggal: '2026-01-10', broker: 'STOCKBIT', ticker: 'BBCA', jenis: 'BELI', lembar: 100, harga: 9200, fee: 1380 }),
    tx({ tanggal: '2026-01-15', broker: 'STOCKBIT', ticker: 'GOTO', jenis: 'BELI', lembar: 10_000, harga: 70, fee: 1050 }),
  ]

  it('unrealized setelah biaya = kotor − fee jual − PPh', () => {
    // 100 lembar, modal 921.380, harga 10.000 → nilai 1.000.000
    // kotor 78.620; Stockbit jual 0,15% (1.500) + PPh 0,1% (1.000) → bersih 76.120
    const [p] = hitungPosisi([txs[3]])
    const b = hitungBarisPosisi(p, 10_000)
    expect(b.nilai).toBe(1_000_000)
    expect(b.unrealized).toBe(78_620)
    expect(b.unrealizedBersih).toBe(76_120)
  })

  it('posisi tanpa harga: nilai = modal, unrealized 0, ditandai', () => {
    const [p] = hitungPosisi([txs[3]])
    const b = hitungBarisPosisi(p, undefined)
    expect(b).toMatchObject({ nilai: 921_380, unrealized: 0, adaHarga: false })
  })

  it('ringkasan menjumlahkan, tidak merata-ratakan lintas broker', () => {
    const posisi = hitungPosisi(txs)
    const r = hitungRingkasan(posisi, { BBCA: 10_000 })
    // BIONS BBCA 500 lembar + Stockbit BBCA 100 lembar → nilai 6.000.000, GOTO tanpa harga
    const goto = posisi.find((p) => p.ticker === 'GOTO')!
    expect(r.nilai).toBe(500 * 10_000 + 100 * 10_000 + goto.modal)
    expect(r.jumlahPosisi).toBe(3)
    expect(r.tickerTanpaHarga).toEqual(['GOTO'])
    expect(r.realized).toBe(posisi.reduce((s, p) => s + p.realized, 0))
  })

  it('realized YTD hanya menghitung penjualan sejak tanggal tsb', () => {
    const semua = hitungPosisi(txs).reduce((s, p) => s + p.realized, 0)
    const sebelum = hitungPosisi(txs.slice(0, 2)).reduce((s, p) => s + p.realized, 0)
    expect(realizedSejak(txs, '2026-01-01')).toBe(semua - sebelum)
    expect(realizedSejak(txs, '2026-01-01')).not.toBe(semua)
  })

  it('komposisi menggabung segmen < 3% jadi "Lainnya"', () => {
    // GOTO 10.000 lembar @10 = 100.000 → 1,6% dari 6.100.000 → masuk "Lainnya"
    const baris = hitungPosisi(txs).map((p) => hitungBarisPosisi(p, p.ticker === 'BBCA' ? 10_000 : 10))
    const k = komposisi(baris)
    expect(k[0]).toMatchObject({ label: 'BBCA', nilai: 6_000_000 })
    expect(k.at(-1)).toMatchObject({ label: 'Lainnya', nilai: 100_000, lainnya: true })
    expect(k.reduce((s, x) => s + x.porsi, 0)).toBeCloseTo(1, 10)
  })

  it('rasio terhadap modal aman untuk modal 0', () => {
    expect(rasioTerhadapModal(50, 1000)).toBe(0.05)
    expect(rasioTerhadapModal(50, 0)).toBeNull()
  })

  it('jumlahkan = penjumlahan murni', () => {
    const baris = hitungPosisi(txs).map((p) => hitungBarisPosisi(p, 10_000))
    const t = jumlahkan(baris)
    expect(t.modal).toBe(baris.reduce((s, b) => s + b.modal, 0))
  })

  it('arus kas & biaya memakai fee & pajak tersimpan', () => {
    expect(biayaTransaksi(txs[1])).toBe(3230 + 1900)
    expect(arusKas(txs[0])).toBe(-(9_000_000 + 15_300))
    expect(arusKas(txs[1])).toBe(1_900_000 - 3230 - 1900)
  })

  it('ringkasan per broker memisahkan biaya yang dibayar', () => {
    const [bions, sb] = ringkasanPerBroker(txs, { BBCA: 10_000, GOTO: 70 })
    expect(bions.broker).toBe('BIONS')
    expect(bions.biaya).toBe(15_300 + 3230 + 1900 + 4998 + 2940)
    expect(sb.biaya).toBe(1380 + 1050)
    expect(sb.volume).toBe(920_000 + 700_000)
    expect(sb.hasilTotal).toBe(sb.realized + sb.dividen + sb.unrealized)
  })
})
