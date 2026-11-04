import { BROKERS } from '../config/brokers'
import type { Broker } from './types'
import { bulat } from './money'

/**
 * Menghitung fee & pajak DEFAULT untuk sebuah transaksi.
 *
 * Fungsi ini hanya mengisi nilai awal di form. Angka yang tersimpan di
 * Transaction adalah hasilnya (yang benar-benar didebit broker), bukan rumusnya.
 * Jangan pernah memanggil fungsi ini untuk menampilkan transaksi lama — kalau
 * tarif di config berubah, histori ikut berubah diam-diam.
 */
export function hitungBiaya(
  nilai: number,
  broker: Broker,
  jenis: 'BELI' | 'JUAL',
): { fee: number; pajak: number } {
  const c = BROKERS[broker]
  const tarif = jenis === 'BELI' ? c.feeBeli : c.feeJual

  const fee = Math.max(bulat(nilai * tarif), c.feeMinimum)
  const pajak = jenis === 'JUAL' ? bulat(nilai * c.pphFinal) : 0

  return { fee, pajak }
}
