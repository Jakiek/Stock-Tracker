import { z } from 'zod'

/*
 * Skema Zod untuk Transaction — ditulis sekali, dipakai oleh form (fase 3),
 * repository (validasi saat membaca), dan nanti server (fase 6).
 *
 * Zod bukan I/O dan bukan React, jadi ia boleh tinggal di domain/.
 */

const rupiah = z.number().int('Harus bilangan bulat rupiah').nonnegative('Tidak boleh negatif')

/**
 * Id broker — hanya FORMAT yang diperiksa. Keanggotaan (apakah broker terdaftar)
 * diperiksa form, karena daftar broker adalah data milik pengguna (ADR 001).
 */
export const brokerSchema = z
  .string()
  .regex(/^[A-Z0-9]{1,12}$/, 'Id broker 1–12 huruf besar/angka, mis. AJAIB')

const tarifPersen = z
  .number()
  .min(0, 'Tarif tidak boleh negatif')
  .max(0.05, 'Tarif maksimal 5% — tulis sebagai desimal, mis. 0.0015')

export const brokerConfigSchema = z.object({
  id: brokerSchema,
  nama: z.string().trim().min(1, 'Nama broker wajib diisi').max(40),
  feeBeli: tarifPersen,
  feeJual: tarifPersen,
  feeMinimum: z.number().int('Harus bilangan bulat rupiah').nonnegative(),
  pphFinal: tarifPersen,
})

export const daftarBrokerSchema = z.array(brokerConfigSchema)

export const jenisSchema = z.enum([
  'BELI',
  'JUAL',
  'DIVIDEN_TUNAI',
  'DIVIDEN_SAHAM',
  'SPLIT',
  'REVERSE_SPLIT',
  'RIGHTS',
])

export const tanggalSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Format tanggal harus 'YYYY-MM-DD'")

const baseSchema = z.object({
  tanggal: tanggalSchema,
  broker: brokerSchema,
  ticker: z.string().regex(/^[A-Z]{4}$/, 'Ticker 4 huruf besar, mis. BBCA'),
  jenis: jenisSchema,
  lembar: z.number().int('Lembar harus bilangan bulat').nonnegative(),
  harga: rupiah,
  fee: rupiah,
  pajak: rupiah,
  rasio: z.number().int('Rasio harus bilangan bulat').min(2, 'Rasio minimal 2').optional(),
  jumlah: rupiah.optional(),
  tesis: z.string().max(2000).optional(),
  catatan: z.string().max(2000).optional(),
})

/** Aturan yang bergantung pada jenis transaksi. */
function cekPerJenis(tx: z.infer<typeof baseSchema>, ctx: z.RefinementCtx): void {
  const perluLembar = ['BELI', 'JUAL', 'RIGHTS', 'DIVIDEN_SAHAM'].includes(tx.jenis)
  const perluHarga = ['BELI', 'JUAL', 'RIGHTS'].includes(tx.jenis)

  if (perluLembar && tx.lembar <= 0) {
    ctx.addIssue({ code: 'custom', path: ['lembar'], message: 'Jumlah lembar wajib diisi' })
  }
  if (perluHarga && tx.harga <= 0) {
    ctx.addIssue({ code: 'custom', path: ['harga'], message: 'Harga wajib diisi' })
  }
  if ((tx.jenis === 'SPLIT' || tx.jenis === 'REVERSE_SPLIT') && tx.rasio === undefined) {
    ctx.addIssue({ code: 'custom', path: ['rasio'], message: 'Rasio wajib diisi' })
  }
  if (tx.jenis === 'DIVIDEN_TUNAI' && (tx.jumlah === undefined || tx.jumlah <= 0)) {
    ctx.addIssue({ code: 'custom', path: ['jumlah'], message: 'Jumlah dividen wajib diisi' })
  }
}

export const transaksiBaruSchema = baseSchema.superRefine(cekPerJenis)

export const transactionSchema = baseSchema
  .extend({
    id: z.string().min(1),
    dibuatPada: z.string().min(1),
  })
  .superRefine(cekPerJenis)

export const daftarTransaksiSchema = z.array(transactionSchema)
