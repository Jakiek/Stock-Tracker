import type { Db } from './db'

/*
 * Migrasi skema, ditulis sebagai SQL biasa dan dijalankan berurutan oleh jalankanMigrasi().
 * Migrasi yang sudah dijalankan TIDAK boleh diubah — tambahkan migrasi baru.
 *
 * Aturan domain yang ditegakkan oleh skema:
 *  - uang selalu INTEGER rupiah (tidak ada float). Tarif broker NUMERIC karena bukan uang.
 *  - tanggal bertipe DATE; dibuat_pada sebagai pemecah seri.
 *  - broker transaksi wajib terdaftar (foreign key), dan broker yang masih dipakai tidak
 *    bisa dihapus (ON DELETE RESTRICT).
 *  - posisi TIDAK disimpan — tidak ada tabel posisi.
 */
export const MIGRASI: readonly { nama: string; sql: string }[] = [
  {
    nama: '001_awal',
    sql: `
CREATE TABLE users (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email         text NOT NULL UNIQUE,
  password_hash text NOT NULL,
  dibuat_pada   timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE brokers (
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  id          text NOT NULL CHECK (id ~ '^[A-Z0-9]{1,12}$'),
  nama        text NOT NULL,
  fee_beli    numeric(10,8) NOT NULL CHECK (fee_beli >= 0),
  fee_jual    numeric(10,8) NOT NULL CHECK (fee_jual >= 0),
  fee_minimum integer NOT NULL DEFAULT 0 CHECK (fee_minimum >= 0),
  pph_final   numeric(10,8) NOT NULL CHECK (pph_final >= 0),
  urutan      bigint GENERATED ALWAYS AS IDENTITY,
  PRIMARY KEY (user_id, id)
);

CREATE TABLE transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tanggal     date NOT NULL,
  dibuat_pada timestamptz NOT NULL,
  broker      text NOT NULL,
  ticker      text NOT NULL,
  jenis       text NOT NULL CHECK (jenis IN
                ('BELI','JUAL','DIVIDEN_TUNAI','DIVIDEN_SAHAM','SPLIT','REVERSE_SPLIT','RIGHTS')),
  lembar      integer NOT NULL CHECK (lembar >= 0),
  harga       integer NOT NULL CHECK (harga >= 0),
  fee         integer NOT NULL CHECK (fee >= 0),
  pajak       integer NOT NULL CHECK (pajak >= 0),
  rasio       integer,
  jumlah      integer,
  tesis       text,
  catatan     text,
  FOREIGN KEY (user_id, broker) REFERENCES brokers(user_id, id) ON DELETE RESTRICT
);
CREATE INDEX transactions_user_ticker_broker ON transactions (user_id, ticker, broker);
CREATE INDEX transactions_user_tanggal ON transactions (user_id, tanggal);

CREATE TABLE prices (
  user_id    uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ticker     text NOT NULL,
  harga      integer NOT NULL CHECK (harga > 0),
  diperbarui timestamptz NOT NULL,
  PRIMARY KEY (user_id, ticker)
);
`,
  },
]

export async function jalankanMigrasi(db: Db, log: (s: string) => void = () => {}): Promise<void> {
  await db.query(`CREATE TABLE IF NOT EXISTS _migrasi (
    nama text PRIMARY KEY, dijalankan_pada timestamptz NOT NULL DEFAULT now())`)
  for (const m of MIGRASI) {
    await db.transaksi(async (q) => {
      // Kunci supaya dua build yang berjalan bersamaan tidak menjalankan migrasi yang sama.
      await q('SELECT pg_advisory_xact_lock(727274)')
      const sudah = await q('SELECT 1 FROM _migrasi WHERE nama = $1', [m.nama])
      if (sudah.length) return
      await q(m.sql)
      await q('INSERT INTO _migrasi (nama) VALUES ($1)', [m.nama])
      log(`migrasi ${m.nama} dijalankan`)
    })
  }
}
