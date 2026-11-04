// config/ tidak mengimpor apa pun — karena itu tipe Broker didefinisikan di sini
// dan diekspor ulang oleh domain/types.ts.

/**
 * Id broker: huruf besar, dibentuk dari nama saat broker dibuat (mis. "Ajaib" → "AJAIB"),
 * tidak berubah sesudahnya. Daftar broker adalah data milik pengguna — lihat
 * docs/decisions/001-broker-dinamis.md.
 */
export type Broker = string

export type BrokerConfig = {
  id: Broker
  nama: string
  feeBeli: number // desimal, mis. 0.0015
  feeJual: number // desimal, DI LUAR PPh final
  feeMinimum: number // rupiah per transaksi, 0 jika tidak ada
  pphFinal: number // 0.001 — dari nilai jual
}

export const LEMBAR_PER_LOT = 100

/** PPh final atas penjualan saham di BEI. */
export const PPH_FINAL_JUAL = 0.001

// TODO fase 0: pastikan tarif jual sudah termasuk PPh, verifikasi dengan konfirmasi transaksi asli
//
// Tarif jual yang disebut broker (BIONS 0,27%, Stockbit 0,25%) sudah termasuk PPh final 0,1%,
// jadi feeJual di bawah adalah selisihnya. Kedua broker tidak punya fee minimum.
/**
 * Daftar broker AWAL — dimuat sekali ke penyimpanan saat aplikasi pertama dipakai.
 * Setelah itu pengguna bisa menambah, mengubah tarif, atau menghapus broker di Pengaturan.
 */
export const BROKER_AWAL: readonly BrokerConfig[] = [
  {
    id: 'BIONS',
    nama: 'BIONS (BNI)',
    feeBeli: 0.0017,
    feeJual: 0.0017,
    feeMinimum: 0,
    pphFinal: PPH_FINAL_JUAL,
  },
  {
    id: 'STOCKBIT',
    nama: 'Stockbit',
    feeBeli: 0.0015,
    feeJual: 0.0015,
    feeMinimum: 0,
    pphFinal: PPH_FINAL_JUAL,
  },
]
