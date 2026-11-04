import type { Broker, BrokerConfig } from '../config/brokers'

export type { Broker, BrokerConfig }

export type JenisTransaksi =
  'BELI' | 'JUAL' | 'DIVIDEN_TUNAI' | 'DIVIDEN_SAHAM' | 'SPLIT' | 'REVERSE_SPLIT' | 'RIGHTS'

export type Transaction = {
  id: string // UUID
  tanggal: string // 'YYYY-MM-DD'
  dibuatPada: string // ISO datetime — pemecah seri transaksi setanggal
  broker: Broker
  ticker: string // huruf besar, 4 karakter
  jenis: JenisTransaksi

  lembar: number // LEMBAR, bukan lot. 1 lot = 100 lembar
  harga: number // rupiah per lembar, bilangan bulat
  fee: number // rupiah, total — dihitung otomatis lalu DISIMPAN
  pajak: number // rupiah — PPh final 0,1% saat jual

  rasio?: number // hanya untuk SPLIT / REVERSE_SPLIT
  jumlah?: number // hanya untuk DIVIDEN_TUNAI — rupiah bersih diterima

  tesis?: string // alasan beli/jual — jurnal trading
  catatan?: string
}

/** Transaksi yang belum disimpan — id & dibuatPada diisi oleh repository. */
export type TransaksiBaru = Omit<Transaction, 'id' | 'dibuatPada'>

export type Position = {
  ticker: string
  broker: Broker // kunci posisi = (ticker, broker)
  lembar: number
  modal: number // rupiah, sudah termasuk fee beli
  hargaRataRata: number // turunan — presisi penuh, khusus tampilan
  realized: number // rupiah, dari transaksi jual
  dividen: number // rupiah, dipisah dari realized
}
