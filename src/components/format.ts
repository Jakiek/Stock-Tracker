const fmtTanggal = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' })
const fmtWaktu = new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })

/** '2026-01-05' → '5 Jan 2026'. Tanggal transaksi tidak punya jam, jadi dibaca sebagai UTC. */
export function formatTanggal(yyyyMmDd: string): string {
  return fmtTanggal.format(new Date(`${yyyyMmDd}T00:00:00Z`))
}

/** ISO datetime → '5 Jan, 14.30' (zona lokal). */
export function formatWaktu(iso: string): string {
  return fmtWaktu.format(new Date(iso))
}

/** '3 hari lalu' — untuk penanda kapan harga terakhir diperbarui. */
export function relatif(iso: string, sekarang = new Date()): string {
  const detik = Math.round((sekarang.getTime() - new Date(iso).getTime()) / 1000)
  const rtf = new Intl.RelativeTimeFormat('id-ID', { numeric: 'auto' })
  if (detik < 60) return 'baru saja'
  if (detik < 3600) return rtf.format(-Math.round(detik / 60), 'minute')
  if (detik < 86400) return rtf.format(-Math.round(detik / 3600), 'hour')
  return rtf.format(-Math.round(detik / 86400), 'day')
}
