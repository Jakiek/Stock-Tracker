import type { AddressInfo } from 'node:net'
import type { Server } from 'node:http'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import { buatDataContoh } from '../../src/data/seed'
import { buatApp } from '../app'
import { buatDb, type Db } from '../db'
import { jalankanMigrasi } from '../migrations'

/*
 * Test integrasi API terhadap Postgres SUNGGUHAN. Butuh DATABASE_URL_TEST, mis.
 *   DATABASE_URL_TEST=postgres://app:app@localhost/saham_test npm run test:run
 * Tanpa variabel itu seluruh file dilewati. Database test DIKOSONGKAN setiap kali jalan.
 */
const URL_TEST = process.env.DATABASE_URL_TEST

describe.skipIf(!URL_TEST)('API', () => {
  let db: Db
  let server: Server
  let dasar: string

  beforeAll(async () => {
    db = buatDb(URL_TEST!)
    await db.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;')
    await jalankanMigrasi(db)
    await jalankanMigrasi(db) // idempoten
    const app = buatApp({ db, rahasiaJwt: 'r'.repeat(40), cookieAman: false })
    server = app.listen(0)
    dasar = `http://localhost:${(server.address() as AddressInfo).port}`
  })

  afterAll(async () => {
    server?.close()
    await db?.tutup()
  })

  /** Klien kecil yang menyimpan cookie sesi seperti browser. */
  function klien() {
    let cookie = ''
    return async (metode: string, path: string, body?: unknown) => {
      const res = await fetch(dasar + path, {
        method: metode,
        headers: { 'content-type': 'application/json', cookie },
        body: body === undefined ? undefined : JSON.stringify(body),
      })
      const set = res.headers.get('set-cookie')
      if (set) cookie = set.split(';')[0]
      const teks = await res.text()
      return { status: res.status, data: teks ? JSON.parse(teks) : null }
    }
  }

  const beli = {
    tanggal: '2026-01-05',
    broker: 'BIONS',
    ticker: 'BBCA',
    jenis: 'BELI',
    lembar: 1000,
    harga: 9000,
    fee: 15_300,
    pajak: 0,
  }

  it('tanpa sesi: 401', async () => {
    const api = klien()
    expect((await api('GET', '/api/transactions')).status).toBe(401)
    expect((await api('GET', '/api/auth/saya')).status).toBe(401)
  })

  it('daftar → broker awal tersedia → keluar → masuk lagi', async () => {
    const api = klien()
    const d = await api('POST', '/api/auth/daftar', {
      email: 'A@Contoh.id',
      password: 'rahasia123',
    })
    expect(d).toMatchObject({ status: 201, data: { email: 'a@contoh.id' } })
    expect((await api('GET', '/api/brokers')).data.map((b: { id: string }) => b.id)).toEqual([
      'BIONS',
      'STOCKBIT',
    ])
    expect(
      (await api('POST', '/api/auth/daftar', { email: 'a@contoh.id', password: 'rahasia123' }))
        .status,
    ).toBe(409)
    await api('POST', '/api/auth/keluar')
    expect((await api('GET', '/api/auth/saya')).status).toBe(401)
    expect(
      (await api('POST', '/api/auth/masuk', { email: 'a@contoh.id', password: 'salah12345' }))
        .status,
    ).toBe(401)
    expect(
      (await api('POST', '/api/auth/masuk', { email: 'a@contoh.id', password: 'rahasia123' }))
        .status,
    ).toBe(200)
    expect((await api('GET', '/api/auth/saya')).data).toEqual({ email: 'a@contoh.id' })
  })

  it('transaksi: tanggal tetap YYYY-MM-DD, dibuatPada naik ketat, field kosong tidak null', async () => {
    const api = klien()
    await api('POST', '/api/auth/daftar', { email: 'b@contoh.id', password: 'rahasia123' })
    const a = await api('POST', '/api/transactions', beli)
    const b = await api('POST', '/api/transactions', { ...beli, lembar: 100 })
    expect(a.status).toBe(201)
    expect(a.data.tanggal).toBe('2026-01-05')
    expect(a.data).not.toHaveProperty('rasio')
    expect(Date.parse(b.data.dibuatPada)).toBeGreaterThan(Date.parse(a.data.dibuatPada))
    const semua = await api('GET', '/api/transactions')
    expect(semua.data).toHaveLength(2)
  })

  it('validasi domain dipakai ulang di server: jual melebihi kepemilikan ditolak', async () => {
    const api = klien()
    await api('POST', '/api/auth/daftar', { email: 'c@contoh.id', password: 'rahasia123' })
    const b = await api('POST', '/api/transactions', beli)
    const jual = await api('POST', '/api/transactions', {
      ...beli,
      jenis: 'JUAL',
      lembar: 2000,
      pajak: 18_000,
    })
    expect(jual.status).toBe(409)
    // menghapus BELI yang menopang JUAL juga ditolak
    await api('POST', '/api/transactions', { ...beli, jenis: 'JUAL', lembar: 500, pajak: 4500 })
    expect((await api('DELETE', `/api/transactions/${b.data.id}`)).status).toBe(409)
    expect((await api('GET', '/api/transactions')).data).toHaveLength(2)
    // skema Zod yang sama dengan form
    expect((await api('POST', '/api/transactions', { ...beli, harga: 9000.5 })).status).toBe(400)
  })

  it('patch: null menghapus field opsional; id & dibuatPada tidak berubah', async () => {
    const api = klien()
    await api('POST', '/api/auth/daftar', { email: 'd@contoh.id', password: 'rahasia123' })
    const a = await api('POST', '/api/transactions', { ...beli, tesis: 'murah' })
    const u = await api('PATCH', `/api/transactions/${a.data.id}`, {
      tesis: null,
      fee: 15_000,
      dibuatPada: '2000-01-01T00:00:00.000Z',
    })
    expect(u.status).toBe(200)
    expect(u.data).not.toHaveProperty('tesis')
    expect(u.data.fee).toBe(15_000)
    expect(u.data.dibuatPada).toBe(a.data.dibuatPada)
  })

  it('broker: harus terdaftar, tidak bisa dihapus selama dipakai', async () => {
    const api = klien()
    await api('POST', '/api/auth/daftar', { email: 'e@contoh.id', password: 'rahasia123' })
    expect((await api('POST', '/api/transactions', { ...beli, broker: 'AJAIB' })).status).toBe(409)
    const ajaib = {
      id: 'AJAIB',
      nama: 'Ajaib',
      feeBeli: 0.0015,
      feeJual: 0.0015,
      feeMinimum: 0,
      pphFinal: 0.001,
    }
    expect((await api('POST', '/api/brokers', ajaib)).status).toBe(201)
    expect((await api('POST', '/api/brokers', ajaib)).status).toBe(409)
    expect((await api('POST', '/api/transactions', { ...beli, broker: 'AJAIB' })).status).toBe(201)
    expect((await api('DELETE', '/api/brokers/AJAIB')).status).toBe(409)
    const ubah = await api('PATCH', '/api/brokers/AJAIB', { feeBeli: 0.001, id: 'LAIN' })
    expect(ubah.data).toMatchObject({ id: 'AJAIB', feeBeli: 0.001 })
  })

  it('data per pengguna terpisah', async () => {
    const x = klien()
    const y = klien()
    await x('POST', '/api/auth/daftar', { email: 'x@contoh.id', password: 'rahasia123' })
    await y('POST', '/api/auth/daftar', { email: 'y@contoh.id', password: 'rahasia123' })
    const t = await x('POST', '/api/transactions', beli)
    await x('PUT', '/api/prices/BBCA', { harga: 9500 })
    expect((await y('GET', '/api/transactions')).data).toEqual([])
    expect((await y('GET', '/api/prices')).data).toEqual({})
    expect((await y('DELETE', `/api/transactions/${t.data.id}`)).status).toBe(204)
    expect((await x('GET', '/api/transactions')).data).toHaveLength(1)
  })

  it('ganti semua dengan data contoh + harga', async () => {
    const api = klien()
    await api('POST', '/api/auth/daftar', { email: 'f@contoh.id', password: 'rahasia123' })
    const contoh = buatDataContoh()
    const r = await api('PUT', '/api/transactions', contoh)
    expect(r.status).toBe(200)
    expect(r.data).toHaveLength(contoh.length)
    await api('PUT', '/api/prices', {
      peta: { BBCA: 9000, TLKM: 3000 },
      diperbarui: '2026-11-03T09:00:00.000Z',
    })
    const h = await api('GET', '/api/prices')
    expect(h.data.BBCA).toEqual({ harga: 9000, diperbarui: '2026-11-03T09:00:00.000Z' })
    expect((await api('PUT', '/api/transactions', [])).data).toEqual([])
  })
})
