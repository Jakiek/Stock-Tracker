import type { TarifBroker } from './brokers'
import { bulat } from './money'

/**
 * Menghitung fee & pajak DEFAULT untuk sebuah transaksi.
 *
 * Fungsi ini hanya mengisi nilai awal di form. Angka yang tersimpan di
 * Transaction adalah hasilnya (yang benar-benar didebit broker), bukan rumusnya.
 * Jangan pernah memanggil fungsi ini untuk menampilkan transaksi lama — kalau
 * tarif broker diubah, histori ikut berubah diam-diam.
 *
 * Tarif dikirim sebagai argumen (bukan dicari di config) karena daftar broker
 * adalah data milik pengguna — domain tetap murni.
 */
export function hitungBiaya(
  nilai: number,
  tarif: TarifBroker,
  jenis: 'BELI' | 'JUAL',
): { fee: number; pajak: number } {
  const persen = jenis === 'BELI' ? tarif.feeBeli : tarif.feeJual

  const fee = Math.max(bulat(nilai * persen), tarif.feeMinimum)
  const pajak = jenis === 'JUAL' ? bulat(nilai * tarif.pphFinal) : 0

  return { fee, pajak }
}
