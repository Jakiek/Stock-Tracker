import { describe, expect, it } from 'vitest'
import { hitungBarisPosisi, posisiTerbuka } from '../../domain/portfolio'
import { hitungPosisi, periksaRiwayat } from '../../domain/positions'
import { transaksiBaruSchema } from '../../domain/schema'
import type { Transaction } from '../../domain/types'
import { buatDataContoh, HARGA_CONTOH } from '../seed'

const data = buatDataContoh()
const sebagaiTransaksi: Transaction[] = data.map((t, i) => ({
  ...t,
  id: String(i),
  dibuatPada: new Date(Date.UTC(2026, 0, 1, 0, 0, i)).toISOString(),
}))

describe('data contoh', () => {
  it('berisi 30–40 transaksi yang lolos skema', () => {
    expect(data.length).toBeGreaterThanOrEqual(30)
    expect(data.length).toBeLessThanOrEqual(40)
    for (const t of data) expect(transaksiBaruSchema.safeParse(t).success).toBe(true)
  })

  it('konsisten: tidak ada jual melebihi kepemilikan', () => {
    expect(periksaRiwayat(sebagaiTransaksi)).toBeNull()
  })

  it('memuat satu stock split, kedua broker, dan ticker sama di dua broker', () => {
    expect(data.filter((t) => t.jenis === 'SPLIT')).toHaveLength(1)
    expect(new Set(data.map((t) => t.broker))).toEqual(new Set(['BIONS', 'STOCKBIT']))
    const bbca = hitungPosisi(sebagaiTransaksi).filter((p) => p.ticker === 'BBCA')
    expect(bbca).toHaveLength(2)
  })

  it('punya beberapa posisi rugi dan semua posisi terbuka punya harga contoh', () => {
    const baris = posisiTerbuka(hitungPosisi(sebagaiTransaksi)).map((p) =>
      hitungBarisPosisi(p, HARGA_CONTOH[p.ticker]),
    )
    expect(baris.every((b) => b.adaHarga)).toBe(true)
    expect(baris.filter((b) => b.unrealized < 0).length).toBeGreaterThanOrEqual(3)
    expect(baris.filter((b) => b.unrealized > 0).length).toBeGreaterThanOrEqual(2)
  })

  it('lembar selalu kelipatan lot setelah split (tidak ada lot pecahan)', () => {
    for (const p of hitungPosisi(sebagaiTransaksi)) expect(Number.isInteger(p.lembar)).toBe(true)
  })
})
