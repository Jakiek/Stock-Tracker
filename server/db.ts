import pg from 'pg'

/*
 * Akses Postgres memakai SQL biasa lewat node-postgres (lihat ADR 002 — kenapa bukan Prisma).
 *
 * DATE (OID 1082) dikembalikan sebagai teks 'YYYY-MM-DD' apa adanya. Bawaan pg mengubahnya
 * menjadi Date jam 00:00 waktu LOKAL server — di zona UTC+7 tanggal bisa mundur sehari, dan
 * pemecah seri dibuatPada di hitungPosisi() tidak pernah jalan (CLAUDE.md § Kesalahan umum).
 */
pg.types.setTypeParser(1082, (v: string) => v)
// NUMERIC (OID 1700) → number. Hanya dipakai untuk tarif broker (desimal), BUKAN uang.
pg.types.setTypeParser(1700, (v: string) => Number(v))

export type Kueri = <T extends pg.QueryResultRow>(sql: string, params?: unknown[]) => Promise<T[]>

export type Db = {
  query: Kueri
  /** Menjalankan fn di dalam satu transaksi database: COMMIT kalau sukses, ROLLBACK kalau melempar. */
  transaksi: <T>(fn: (q: Kueri) => Promise<T>) => Promise<T>
  tutup: () => Promise<void>
}

export function buatDb(connectionString: string): Db {
  // Serverless: satu pool per instance fungsi, koneksi sedikit (Neon memakai pooler).
  const pool = new pg.Pool({ connectionString, max: 3 })

  const query: Kueri = async (sql, params = []) => (await pool.query(sql, params)).rows

  return {
    query,
    async transaksi(fn) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const hasil = await fn(async (sql, params = []) => (await client.query(sql, params)).rows)
        await client.query('COMMIT')
        return hasil
      } catch (e) {
        await client.query('ROLLBACK')
        throw e
      } finally {
        client.release()
      }
    },
    tutup: () => pool.end(),
  }
}
