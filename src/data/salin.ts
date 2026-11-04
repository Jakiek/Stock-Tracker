import type { Penyimpanan } from './Penyimpanan'

/**
 * Menyalin seluruh data dari satu penyimpanan ke penyimpanan lain — dipakai untuk
 * memindahkan data browser (mode tamu) ke akun. Broker yang belum ada ditambahkan dulu
 * (transaksi merujuk ke id broker), lalu transaksi & harga MENIMPA isi tujuan.
 */
export async function salinPenyimpanan(dari: Penyimpanan, ke: Penyimpanan): Promise<number> {
  const [broker, transaksi, harga] = await Promise.all([
    dari.broker.getAll(),
    dari.transaksi.getAll(),
    dari.harga.getAll(),
  ])
  const ada = new Set((await ke.broker.getAll()).map((b) => b.id))
  for (const b of broker) {
    if (ada.has(b.id)) await ke.broker.update(b.id, b)
    else await ke.broker.add(b)
  }
  // Urutan asli (tanggal, lalu dibuatPada) dipertahankan: tujuan memberi dibuatPada baru
  // yang naik sesuai urutan array.
  const urut = [...transaksi].sort(
    (a, b) => a.tanggal.localeCompare(b.tanggal) || a.dibuatPada.localeCompare(b.dibuatPada),
  )
  await ke.transaksi.replaceAll(
    urut.map(({ id: _i, dibuatPada: _d, ...t }) => (void _i, void _d, t)),
  )
  // replaceAll hanya menerima satu cap waktu: pakai yang PALING LAMA, supaya harga basi
  // tetap ditandai basi (lebih jujur daripada membuatnya tampak baru).
  const entri = Object.entries(harga)
  const tertua = entri.map(([, h]) => h.diperbarui).sort()[0] ?? new Date().toISOString()
  await ke.harga.replaceAll(Object.fromEntries(entri.map(([t, h]) => [t, h.harga])), tertua)
  return transaksi.length
}
