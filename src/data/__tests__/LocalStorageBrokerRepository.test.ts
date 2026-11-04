import { describe, expect, it } from 'vitest'
import { BROKER_AWAL } from '../../config/brokers'
import { KUNCI_BROKER, LocalStorageBrokerRepository } from '../LocalStorageBrokerRepository'
import type { KeyValueStorage } from '../LocalStorageRepository'

function storagePalsu(): KeyValueStorage {
  const isi = new Map<string, string>()
  return { getItem: (k) => isi.get(k) ?? null, setItem: (k, v) => void isi.set(k, v) }
}

const ajaib = {
  id: 'AJAIB',
  nama: 'Ajaib',
  feeBeli: 0.0015,
  feeJual: 0.0015,
  feeMinimum: 0,
  pphFinal: 0.001,
}

describe('LocalStorageBrokerRepository', () => {
  it('perangkat baru: berisi broker awal dan tersimpan', async () => {
    const s = storagePalsu()
    expect(await new LocalStorageBrokerRepository(s).getAll()).toEqual(BROKER_AWAL)
    expect(s.getItem(KUNCI_BROKER)).not.toBeNull()
  })

  it('tambah broker bertahan di instance baru, urut sesuai penambahan', async () => {
    const s = storagePalsu()
    await new LocalStorageBrokerRepository(s).add(ajaib)
    const ids = (await new LocalStorageBrokerRepository(s).getAll()).map((b) => b.id)
    expect(ids).toEqual(['BIONS', 'STOCKBIT', 'AJAIB'])
  })

  it('id ganda ditolak', async () => {
    const repo = new LocalStorageBrokerRepository(storagePalsu())
    await expect(repo.add({ ...ajaib, id: 'BIONS' })).rejects.toThrow(/sudah ada/)
  })

  it('ubah tarif tidak bisa mengubah id', async () => {
    const repo = new LocalStorageBrokerRepository(storagePalsu())
    const hasil = await repo.update('STOCKBIT', { feeBeli: 0.001 })
    expect(hasil).toMatchObject({ id: 'STOCKBIT', feeBeli: 0.001 })
  })

  it('tarif tidak masuk akal ditolak skema', async () => {
    const repo = new LocalStorageBrokerRepository(storagePalsu())
    await expect(repo.add({ ...ajaib, feeBeli: 0.15 })).rejects.toThrow()
  })
})
