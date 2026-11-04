import { describe, expect, it } from 'vitest'
import { LocalStorageRepository, type KeyValueStorage } from '../LocalStorageRepository'
import type { TransaksiBaru } from '../../domain/types'

function storagePalsu(): KeyValueStorage & { isi: Map<string, string> } {
  const isi = new Map<string, string>()
  return {
    isi,
    getItem: (k) => isi.get(k) ?? null,
    setItem: (k, v) => void isi.set(k, v),
  }
}

const beli: TransaksiBaru = {
  tanggal: '2026-01-05',
  broker: 'BIONS',
  ticker: 'BBCA',
  jenis: 'BELI',
  lembar: 100,
  harga: 9000,
  fee: 1530,
  pajak: 0,
}

describe('LocalStorageRepository', () => {
  it('simpan lalu baca kembali — bertahan di instance baru (≈ refresh)', async () => {
    const s = storagePalsu()
    const repo = new LocalStorageRepository(s)
    const tx = await repo.add(beli)
    expect(tx.id).toBeTruthy()
    expect(tx.dibuatPada).toMatch(/^\d{4}-\d{2}-\d{2}T/)

    const repoBaru = new LocalStorageRepository(s)
    expect(await repoBaru.getAll()).toEqual([tx])
  })

  it('dibuatPada naik ketat walau jam tidak bergerak', async () => {
    const jam = () => new Date('2026-01-05T10:00:00.000Z')
    const repo = new LocalStorageRepository(storagePalsu(), 'k', jam)
    const a = await repo.add(beli)
    const b = await repo.add(beli)
    expect(b.dibuatPada > a.dibuatPada).toBe(true)
  })

  it('update tidak bisa mengubah id maupun dibuatPada', async () => {
    const repo = new LocalStorageRepository(storagePalsu())
    const tx = await repo.add(beli)
    const hasil = await repo.update(tx.id, { harga: 9100, id: 'lain', dibuatPada: 'x' })
    expect(hasil).toMatchObject({ id: tx.id, dibuatPada: tx.dibuatPada, harga: 9100 })
  })

  it('remove menghapus transaksi', async () => {
    const repo = new LocalStorageRepository(storagePalsu())
    const tx = await repo.add(beli)
    await repo.remove(tx.id)
    expect(await repo.getAll()).toEqual([])
  })

  it('data rusak di storage melempar error, bukan diam-diam kosong', async () => {
    const s = storagePalsu()
    s.setItem('k', JSON.stringify([{ ticker: 'BBCA' }]))
    await expect(new LocalStorageRepository(s, 'k').getAll()).rejects.toThrow()
  })
})
