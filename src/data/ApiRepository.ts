import { daftarBrokerSchema, brokerConfigSchema, transactionSchema } from '../domain/schema'
import type { BrokerConfig, Transaction, TransaksiBaru } from '../domain/types'
import type { BrokerRepository } from './BrokerRepository'
import { minta } from './http'
import {
  cekHarga,
  type HargaPasar,
  type PetaHargaPasar,
  type PriceRepository,
} from './PriceRepository'
import { saringHarga } from './prices'
import type { TransactionRepository } from './TransactionRepository'

/**
 * Normalisasi tanggal dari server ke 'YYYY-MM-DD'. Server sudah mengirim format ini, tetapi
 * aturannya ditegakkan DI SINI (CLAUDE.md): kalau suatu saat server mengirim ISO datetime
 * lengkap, pemecah seri dibuatPada di hitungPosisi() diam-diam tidak jalan.
 */
export function normalkanTanggal(t: string): string {
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(t)
  if (!m) throw new Error(`Tanggal dari server tidak dikenali: ${t}`)
  return m[1]
}

function bacaTransaksi(data: unknown): Transaction {
  const mentah = typeof data === 'object' && data !== null ? data : {}
  const t = 'tanggal' in mentah && typeof mentah.tanggal === 'string' ? mentah.tanggal : ''
  return transactionSchema.parse({ ...mentah, tanggal: normalkanTanggal(t) })
}

/** Transaksi lewat REST API — pengganti LocalStorageRepository untuk akun yang masuk. */
export class ApiRepository implements TransactionRepository {
  async getAll(): Promise<Transaction[]> {
    const data = await minta<unknown[]>('GET', '/api/transactions')
    return data.map(bacaTransaksi)
  }
  async add(tx: TransaksiBaru): Promise<Transaction> {
    return bacaTransaksi(await minta('POST', '/api/transactions', tx))
  }
  async update(id: string, patch: Partial<Transaction>): Promise<Transaction> {
    return bacaTransaksi(await minta('PATCH', `/api/transactions/${encodeURIComponent(id)}`, patch))
  }
  async remove(id: string): Promise<void> {
    await minta('DELETE', `/api/transactions/${encodeURIComponent(id)}`)
  }
  async replaceAll(txs: TransaksiBaru[]): Promise<Transaction[]> {
    const data = await minta<unknown[]>('PUT', '/api/transactions', txs)
    return data.map(bacaTransaksi)
  }
}

export class ApiBrokerRepository implements BrokerRepository {
  async getAll(): Promise<BrokerConfig[]> {
    return daftarBrokerSchema.parse(await minta('GET', '/api/brokers'))
  }
  async add(broker: BrokerConfig): Promise<BrokerConfig> {
    return brokerConfigSchema.parse(await minta('POST', '/api/brokers', broker))
  }
  async update(id: string, patch: Partial<Omit<BrokerConfig, 'id'>>): Promise<BrokerConfig> {
    return brokerConfigSchema.parse(
      await minta('PATCH', `/api/brokers/${encodeURIComponent(id)}`, patch),
    )
  }
  async remove(id: string): Promise<void> {
    await minta('DELETE', `/api/brokers/${encodeURIComponent(id)}`)
  }
}

export class ApiPriceRepository implements PriceRepository {
  async getAll(): Promise<PetaHargaPasar> {
    return saringHarga(await minta('GET', '/api/prices'))
  }
  async simpan(ticker: string, harga: number): Promise<HargaPasar> {
    cekHarga(harga)
    return minta<HargaPasar>('PUT', `/api/prices/${encodeURIComponent(ticker)}`, { harga })
  }
  async hapus(ticker: string): Promise<void> {
    await minta('DELETE', `/api/prices/${encodeURIComponent(ticker)}`)
  }
  async replaceAll(peta: Record<string, number>, diperbarui: string): Promise<void> {
    await minta('PUT', '/api/prices', { peta, diperbarui })
  }
}
