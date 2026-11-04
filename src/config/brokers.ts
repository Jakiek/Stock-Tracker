// config/ tidak mengimpor apa pun — karena itu tipe Broker didefinisikan di sini
// dan diekspor ulang oleh domain/types.ts.

export type Broker = 'BIONS' | 'STOCKBIT'

export const DAFTAR_BROKER: readonly Broker[] = ['BIONS', 'STOCKBIT']

export type BrokerConfig = {
  id: Broker
  nama: string
  feeBeli: number // desimal, mis. 0.0015
  feeJual: number // desimal, DI LUAR PPh final
  feeMinimum: number // rupiah per transaksi, 0 jika tidak ada
  pphFinal: number // 0.001 — dari nilai jual
}

export const LEMBAR_PER_LOT = 100

// TODO fase 0: pastikan tarif jual sudah termasuk PPh, verifikasi dengan konfirmasi transaksi asli
//
// Tarif jual yang disebut broker (BIONS 0,27%, Stockbit 0,25%) sudah termasuk PPh final 0,1%,
// jadi feeJual di bawah adalah selisihnya. Kedua broker tidak punya fee minimum.
export const BROKERS: Record<Broker, BrokerConfig> = {
  BIONS: {
    id: 'BIONS',
    nama: 'BIONS (BNI)',
    feeBeli: 0.0017,
    feeJual: 0.0017,
    feeMinimum: 0,
    pphFinal: 0.001,
  },
  STOCKBIT: {
    id: 'STOCKBIT',
    nama: 'Stockbit',
    feeBeli: 0.0015,
    feeJual: 0.0015,
    feeMinimum: 0,
    pphFinal: 0.001,
  },
}
