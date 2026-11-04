import { bulat } from './money'
import type { Position, Transaction } from './types'

/** Data transaksi tidak konsisten (mis. jual melebihi kepemilikan). */
export class TransaksiTidakKonsisten extends Error {
  readonly transaksi: Transaction
  constructor(pesan: string, transaksi: Transaction) {
    super(pesan)
    this.name = 'TransaksiTidakKonsisten'
    this.transaksi = transaksi
  }
}

/** Kunci posisi = (ticker, broker). Tidak ada perata-rataan lintas broker. */
export function kunciPosisi(p: { ticker: string; broker: string }): string {
  return `${p.ticker}|${p.broker}`
}

/**
 * Urutan pemrosesan: tanggal, lalu dibuatPada sebagai pemecah seri.
 * `id` hanya penjaga terakhir supaya hasil sort selalu deterministik.
 */
export function urutkanTransaksi(transaksi: readonly Transaction[]): Transaction[] {
  return [...transaksi].sort((a, b) =>
    a.tanggal !== b.tanggal
      ? a.tanggal.localeCompare(b.tanggal)
      : a.dibuatPada !== b.dibuatPada
        ? a.dibuatPada.localeCompare(b.dibuatPada)
        : a.id.localeCompare(b.id),
  )
}

/**
 * Inti aplikasi: membangun posisi dari daftar transaksi.
 * Posisi TIDAK pernah disimpan — selalu dihitung ulang dari sini.
 */
export function hitungPosisi(transaksi: readonly Transaction[]): Position[] {
  const peta = new Map<string, Position>()

  for (const tx of urutkanTransaksi(transaksi)) {
    const kunci = kunciPosisi(tx)
    const p = peta.get(kunci) ?? posisiKosong(tx)
    terapkan(p, tx)
    peta.set(kunci, p)
  }

  return [...peta.values()].map((p) => ({
    ...p,
    // Turunan, presisi penuh, khusus tampilan — tidak pernah jadi input rumus.
    hargaRataRata: p.lembar > 0 ? p.modal / p.lembar : 0,
  }))
}

function posisiKosong(tx: Transaction): Position {
  return {
    ticker: tx.ticker,
    broker: tx.broker,
    lembar: 0,
    modal: 0,
    hargaRataRata: 0,
    realized: 0,
    dividen: 0,
  }
}

/**
 * Memutasi p sesuai jenis transaksi. Mutasi lokal disengaja: p tidak pernah
 * keluar dari hitungPosisi() sebelum disalin ulang oleh .map().
 */
function terapkan(p: Position, tx: Transaction): void {
  switch (tx.jenis) {
    case 'BELI':
    case 'RIGHTS': {
      // RIGHTS = BELI secara ekonomi: uang disetor, lembar bertambah.
      p.lembar += tx.lembar
      p.modal += tx.lembar * tx.harga + tx.fee // fee beli MASUK modal
      return
    }

    case 'JUAL': {
      if (tx.lembar > p.lembar) {
        throw new TransaksiTidakKonsisten(
          `Jual ${tx.lembar} lembar ${tx.ticker} di ${tx.broker} pada ${tx.tanggal}, ` +
            `padahal kepemilikan hanya ${p.lembar} lembar`,
          tx,
        )
      }
      // HPP proporsional terhadap sisa modal (metode rata-rata tertimbang).
      const hpp = bulat((p.modal * tx.lembar) / p.lembar)
      const bersih = tx.lembar * tx.harga - tx.fee - tx.pajak
      p.realized += bersih - hpp
      p.modal -= hpp
      p.lembar -= tx.lembar
      return
    }

    case 'SPLIT': {
      p.lembar *= wajibRasio(tx) // modal tetap → avg turun otomatis
      return
    }

    case 'REVERSE_SPLIT': {
      // Pecahan tidak boleh muncul; sisa diuangkan broker dan dicatat terpisah.
      p.lembar = Math.floor(p.lembar / wajibRasio(tx))
      return
    }

    case 'DIVIDEN_SAHAM': {
      p.lembar += tx.lembar // tidak ada uang keluar → modal tetap
      return
    }

    case 'DIVIDEN_TUNAI': {
      p.dividen += tx.jumlah ?? 0 // TIDAK masuk realized
      return
    }

    default: {
      const tidakMungkin: never = tx.jenis
      throw new Error(`Jenis transaksi tidak dikenal: ${String(tidakMungkin)}`)
    }
  }
}

function wajibRasio(tx: Transaction): number {
  if (tx.rasio === undefined || !Number.isInteger(tx.rasio) || tx.rasio < 2) {
    throw new TransaksiTidakKonsisten(`${tx.jenis} ${tx.ticker} tanpa rasio yang valid`, tx)
  }
  return tx.rasio
}
