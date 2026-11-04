# ARCHITECTURE — Tracker Saham

> Rancangan teknis: struktur, model data, mesin hitung, dan kontrak antar lapisan.
> Urutan pengerjaannya ada di [`ROADMAP.md`](./ROADMAP.md).

---

## 1. Prinsip arsitektur

Seluruh desain ini berdiri di atas satu aturan:

> **Logika yang menghitung uang tidak boleh tahu apa-apa tentang React, jaringan, atau tempat data disimpan.**

Konsekuensinya, aplikasi terbagi jadi tiga lapisan dengan arah ketergantungan satu arah:

```
┌────────────────────────────────────────────────────┐
│  presentasi   components/ · pages/ · hooks/        │  → domain, data, config
├────────────────────────────────────────────────────┤
│  data/        repository, penyimpanan              │  → domain, config
├────────────────────────────────────────────────────┤
│  domain/      tipe, rumus, mesin hitung            │  → config saja
├────────────────────────────────────────────────────┤
│  config/      tarif broker, konstanta              │  → tidak impor apa pun
└────────────────────────────────────────────────────┘
                    ↑ arah ketergantungan
```

**`domain/` tidak boleh mengimpor apa pun dari `data/` maupun lapisan presentasi.** Satu-satunya yang boleh diimpor adalah `config/`, yang isinya konstanta murni. Kalau suatu saat kamu tergoda melanggarnya, itu tanda rumus dan penyimpanan mulai bercampur — dan mesin hitungmu tidak lagi bisa dites tanpa memalsukan browser.

> Jangan tertukar: **lapisan** presentasi berisi seluruh `components/`, `pages/`, dan `hooks/`. Folder `src/components/ui/` adalah hal yang berbeda — kumpulan primitif tampilan (tombol, input, tabel) tanpa logika bisnis.

Dua manfaat langsungnya:

- `domain/` bisa dites tanpa merender apa pun dan tanpa memalsukan `localStorage`
- di fase 6, mengganti localStorage dengan API tidak menyentuh `domain/` maupun `ui/`

---

## 2. Struktur folder

```
saham-tracker/
├── CLAUDE.md                    # aturan untuk coding agent
├── README.md                    # ditulis di fase 5
├── docs/
│   ├── ROADMAP.md
│   ├── ARCHITECTURE.md
│   └── decisions/               # ADR — saat sebuah keputusan §11 berubah
│
├── src/
│   ├── main.tsx                 # satu-satunya tempat repository dipilih
│   ├── App.tsx
│   │
│   ├── domain/                  # murni — tanpa React, tanpa I/O
│   │   ├── types.ts             # Transaction, Position, BrokerConfig
│   │   ├── money.ts             # pembulatan & format rupiah
│   │   ├── fees.ts              # hitungBiaya()
│   │   ├── positions.ts         # hitungPosisi()   ← inti aplikasi
│   │   ├── portfolio.ts         # ringkasan agregat
│   │   └── __tests__/
│   │       ├── positions.test.ts
│   │       ├── fees.test.ts
│   │       └── data-asli.test.ts    # dari fase 0, tidak masuk repo publik
│   │
│   ├── data/
│   │   ├── TransactionRepository.ts    # interface
│   │   ├── LocalStorageRepository.ts   # fase 1
│   │   ├── ApiRepository.ts            # fase 6
│   │   ├── prices.ts                   # ambilHarga() — manual (f4) → API (f8)
│   │   └── seed.ts                     # data demo, fase 5
│   │
│   ├── config/
│   │   └── brokers.ts           # tarif & fee minimum
│   │
│   ├── hooks/
│   │   ├── useTransactions.ts
│   │   └── usePositions.ts
│   │
│   ├── components/
│   │   ├── TransactionForm.tsx
│   │   ├── TransactionList.tsx
│   │   ├── PositionTable.tsx
│   │   ├── PortfolioSummary.tsx
│   │   └── ui/                  # tombol, input, tabel — tanpa logika bisnis
│   │
│   └── pages/
│       ├── Dashboard.tsx
│       ├── Transactions.tsx
│       ├── Prices.tsx           # input harga pasar manual, fase 4
│       └── Settings.tsx         # tarif broker, muat/kosongkan data demo
│
└── server/                      # fase 6
    ├── src/
    │   ├── index.ts
    │   ├── routes/transactions.ts
    │   └── schema.ts            # validasi Zod, dipakai bersama klien
    └── prisma/schema.prisma
```

---

## 3. Model data

### `src/domain/types.ts`

```ts
export type Broker = 'BIONS' | 'STOCKBIT'

export type JenisTransaksi =
  | 'BELI'
  | 'JUAL'
  | 'DIVIDEN_TUNAI'
  | 'DIVIDEN_SAHAM'
  | 'SPLIT'
  | 'REVERSE_SPLIT'
  | 'RIGHTS'

export type Transaction = {
  id: string              // UUID
  tanggal: string         // 'YYYY-MM-DD'
  dibuatPada: string      // ISO datetime — pemecah seri transaksi setanggal
  broker: Broker
  ticker: string          // huruf besar, 4 karakter
  jenis: JenisTransaksi

  lembar: number          // LEMBAR, bukan lot. 1 lot = 100 lembar
  harga: number           // rupiah per lembar, bilangan bulat
  fee: number             // rupiah, total — dihitung otomatis lalu DISIMPAN
  pajak: number           // rupiah — PPh final 0,1% saat jual

  rasio?: number          // hanya untuk SPLIT / REVERSE_SPLIT
  jumlah?: number         // hanya untuk DIVIDEN_TUNAI — rupiah bersih diterima

  tesis?: string          // alasan beli/jual — jurnal trading
  catatan?: string
}

export type Position = {
  ticker: string
  broker: Broker          // kunci posisi = (ticker, broker)
  lembar: number
  modal: number           // rupiah, sudah termasuk fee beli
  hargaRataRata: number   // turunan — presisi penuh, khusus tampilan (lihat catatan)
  realized: number        // rupiah, dari transaksi jual
  dividen: number         // rupiah, dipisah dari realized
}
```

> **Pengecualian bilangan bulat: `hargaRataRata`.** Nilai ini adalah satu-satunya angka rupiah yang boleh berupa pecahan, karena ia **turunan** (`modal / lembar`), bukan sumber kebenaran. Membulatkannya lalu memakainya kembali sebagai input perhitungan akan menghasilkan galat yang menumpuk — karena itu `hargaRataRata` **tidak pernah dipakai sebagai input rumus apa pun**; semua perhitungan memakai `modal`. Pembulatan hanya terjadi saat diformat untuk layar.

### Kenapa `dibuatPada` ada

`tanggal` saja tidak cukup. Kalau di hari yang sama kamu beli lalu jual, urutan pemrosesan menentukan hasilnya — dan urutan sebuah array tidak dijamin stabil setelah data melewati penyimpanan. `dibuatPada` memberi pemecah seri yang deterministik.

### Tiga aturan penyimpanan

| Aturan | Alasan |
|---|---|
| **Lembar, bukan lot** | Stock split menghasilkan pecahan lot yang menyakitkan. Konversi ke lot hanya di lapisan tampilan. |
| **Bilangan bulat rupiah** | `0.1 + 0.2 !== 0.3`. Untuk data yang menghitung uang, galat floating point akan muncul sebagai selisih yang mustahil dilacak. Rupiah tidak punya sen. |
| **Fee disimpan, bukan dihitung ulang** | Lihat §5. |

---

## 4. Config broker

### `src/config/brokers.ts`

```ts
export type BrokerConfig = {
  id: Broker
  nama: string
  feeBeli: number       // desimal, mis. 0.0015
  feeJual: number       // desimal, di luar PPh final
  feeMinimum: number    // rupiah per transaksi, 0 jika tidak ada
  pphFinal: number      // 0.001 — dari nilai jual
}

// Isi dari hasil fase 0 — jangan menyalin dari brosur,
// verifikasi dengan konfirmasi transaksi asli.
export const BROKERS: Record<Broker, BrokerConfig> = {
  BIONS:    { id: 'BIONS',    nama: 'BIONS (BNI)', feeBeli: 0, feeJual: 0, feeMinimum: 0, pphFinal: 0.001 },
  STOCKBIT: { id: 'STOCKBIT', nama: 'Stockbit',    feeBeli: 0, feeJual: 0, feeMinimum: 0, pphFinal: 0.001 },
}
```

---

## 5. Mesin hitung

### 5.1 Biaya — `src/domain/fees.ts`

```ts
import { BROKERS } from '../config/brokers'

export function hitungBiaya(
  nilai: number,
  broker: Broker,
  jenis: 'BELI' | 'JUAL',
): { fee: number; pajak: number } {
  const c = BROKERS[broker]
  const tarif = jenis === 'BELI' ? c.feeBeli : c.feeJual

  const fee   = Math.max(Math.round(nilai * tarif), c.feeMinimum)
  const pajak = jenis === 'JUAL' ? Math.round(nilai * c.pphFinal) : 0

  return { fee, pajak }
}
```

**Fungsi ini hanya mengisi nilai default di form.** Angka yang tersimpan di `Transaction` adalah hasilnya, bukan rumusnya. Ini satu-satunya tempat `domain/` mengimpor `config/`.

> **Kenapa disimpan, bukan dihitung ulang saat ditampilkan.**
> Kalau fee dihitung ulang dari config setiap kali, maka saat broker mengubah tarifnya dan kamu memperbarui config, **seluruh transaksi lamamu ikut dihitung ulang dengan tarif baru** — harga rata-rata dan realized P/L historismu berubah diam-diam, tanpa peringatan apa pun. Ditambah pembulatan broker yang bisa meleset satu-dua rupiah dari rumusmu. Yang benar selalu angka yang betul-betul didebit dari RDN.

> **Fee minimum.** `Math.max(...)` di atas bukan detail sepele. Pada tarif 0,15% dengan minimum Rp5.000, transaksi Rp1.000.000 tetap ditagih Rp5.000 — tarif efektif **0,50%**, lebih dari tiga kali lipat. Pada posisi besar, minimum ini tidak pernah aktif dan tidak terasa; pada transaksi kecil, ia bisa jadi komponen biaya terbesar.

### 5.2 Posisi — `src/domain/positions.ts`

```ts
export function hitungPosisi(transaksi: Transaction[]): Position[] {
  // Urutkan dulu — hasil tidak boleh bergantung pada urutan input
  const urut = [...transaksi].sort((a, b) =>
    a.tanggal !== b.tanggal
      ? a.tanggal.localeCompare(b.tanggal)
      : a.dibuatPada.localeCompare(b.dibuatPada),
  )

  const peta = new Map<string, Position>()

  for (const tx of urut) {
    const kunci = `${tx.ticker}|${tx.broker}`   // ← kunci posisi
    const p = peta.get(kunci) ?? posisiKosong(tx)
    terapkan(p, tx)
    peta.set(kunci, p)
  }

  return [...peta.values()]
    .map(p => ({ ...p, hargaRataRata: p.lembar > 0 ? p.modal / p.lembar : 0 }))
}

// posisiKosong(tx): Position
//   → ticker & broker diambil dari tx, semua angka 0
//
// terapkan(p: Position, tx: Transaction): void
//   → memutasi p sesuai tabel aturan di bawah.
//     Mutasi lokal disengaja: p tidak pernah keluar dari fungsi ini
//     sebelum disalin ulang oleh .map() di atas.
```

Aturan per jenis transaksi:

```
BELI  n lembar @ p, fee f
  lembar += n
  modal  += n*p + f                      // fee beli masuk modal

JUAL  n lembar @ p, fee f, pajak t
  if (n > lembar) throw  →  data tidak konsisten, bukan angka negatif
  hpp        = bulat(modal * n / lembar) // proporsional terhadap sisa modal
  bersih     = n*p - f - t
  realized  += bersih - hpp
  modal     -= hpp
  lembar    -= n

SPLIT rasio r  (1:r)
  lembar *= r
  modal   tetap                          // avg turun otomatis

REVERSE_SPLIT rasio r
  lembar = Math.floor(lembar / r)        // pecahan tidak boleh muncul
  modal   tetap

RIGHTS  n lembar @ harga tebus p, fee f
  lembar += n                            // perlakuan sama seperti BELI
  modal  += n*p + f

DIVIDEN_SAHAM n lembar
  lembar += n
  modal   tetap                          // tidak ada uang keluar

DIVIDEN_TUNAI jumlah d
  dividen += d                           // TIDAK masuk realized
```

> **Pecahan pada reverse split.** 150 lembar dengan rasio 1:4 menghasilkan 37,5 lembar — mustahil, karena `lembar` adalah bilangan bulat. Broker menguangkan sisa pecahan itu. Aplikasi ini membulatkan ke bawah, dan uang penggantinya dicatat sebagai transaksi terpisah (`DIVIDEN_TUNAI` atau `JUAL` kecil, sesuai bunyi konfirmasi brokermu).

> **RIGHTS diperlakukan seperti BELI**, karena secara ekonomi memang itu: kamu menyetor uang dan menerima lembar baru. Yang membedakan hanya harganya ditentukan emiten, bukan pasar. Kalau kamu tidak menebus haknya, tidak ada transaksi yang dicatat sama sekali.

### 5.3 Dua hal yang membuat angkamu jujur

**Fee beli masuk ke modal.** Kalau tidak, "untung"-mu bohong, dan angkamu tidak akan pernah cocok dengan aplikasi BIONS. Ini penyebab nomor satu tracker buatan sendiri meleset.

**Unrealized P/L itu sebelum biaya keluar.** `lembar × hargaPasar − modal` belum dikurangi fee jual dan PPh final yang pasti kamu bayar saat merealisasikannya. Sediakan versi "setelah biaya":

```ts
const unrealizedKotor  = lembar * hargaPasar - modal
const { fee, pajak }   = hitungBiaya(lembar * hargaPasar, broker, 'JUAL')
const unrealizedBersih = unrealizedKotor - fee - pajak
```

### 5.4 Posisi dipisah per broker

Kunci posisi adalah `(ticker, broker)`. BBCA di BIONS dan BBCA di Stockbit adalah dua baris berbeda dengan modal, harga rata-rata, dan realized sendiri-sendiri.

Alasannya bukan preferensi tampilan: **rata-rata gabungan lintas broker adalah angka yang tidak berarti apa-apa** — tidak cocok dengan aplikasi manapun dan tidak menjawab pertanyaan apa pun. Pemisahan ini yang memungkinkan rekonsiliasi: angka tiap baris bisa langsung disandingkan dengan yang tampil di aplikasi broker.

Yang digabung hanya di level ringkasan portofolio — total nilai, total unrealized, total realized. Itu **penjumlahan**, bukan perata-rataan.

---

## 6. Kasus uji wajib

Ditulis di fase 2, sebelum UI ada. Ini yang paling membedakan portofoliomu dari portofolio junior lain.

| # | Kasus | Yang dibuktikan |
|---|---|---|
| 1 | Satu kali beli | `modal = n×p + fee`, `avg > harga beli` |
| 2 | Tiga kali beli di harga berbeda | Rata-rata tertimbang, bukan rata-rata sederhana |
| 3 | Jual sebagian | HPP proporsional, sisa modal benar |
| 4 | Jual habis | `lembar = 0`, `modal = 0`, realized = total keuntungan bersih |
| 5 | Jual habis lalu beli lagi | Harga rata-rata baru tidak terkontaminasi posisi lama |
| 6 | Jual rugi | Realized negatif, dan pajak tetap dipotong |
| 7 | Stock split 1:5 | `lembar ×5`, modal tetap, `avg` jadi seperlima |
| 8 | Reverse split dengan sisa pecahan | `lembar` dibulatkan ke bawah, tetap bilangan bulat |
| 9 | Rights issue ditebus | Modal bertambah sebesar harga tebus + fee |
| 10 | Fee minimum aktif | Transaksi kecil ditagih minimum, bukan persentase |
| 11 | Ticker sama di dua broker | Menghasilkan **dua** posisi terpisah |
| 12 | Input tidak urut tanggal | Hasil identik dengan input yang sudah urut |
| 13 | Beli dan jual di tanggal sama | `dibuatPada` menentukan urutan, hasil deterministik |
| 14 | Jual melebihi kepemilikan | **Melempar error**, bukan menghasilkan lembar negatif |
| 15 | Data asli fase 0 | Hasil cocok dengan aplikasi BIONS |

Kasus 12, 13, dan 14 adalah yang paling sering terlewat — dan paling sering ditanyakan saat interview teknis.

> Kasus 15 memakai data finansial aslimu. Simpan di file terpisah yang masuk `.gitignore`, dan buat variannya dengan angka fiktif untuk repo publik.

---

## 7. Lapisan penyimpanan

### `src/data/TransactionRepository.ts`

```ts
export interface TransactionRepository {
  getAll(): Promise<Transaction[]>
  add(tx: Omit<Transaction, 'id' | 'dibuatPada'>): Promise<Transaction>
  update(id: string, patch: Partial<Transaction>): Promise<Transaction>
  remove(id: string): Promise<void>
}
```

**Semua method `async`, walaupun localStorage sinkron dan tidak memerlukannya.**

Ini disengaja. Kalau fase 1 ditulis sinkron, mengganti ke API di fase 6 memaksa setiap komponen yang memakainya ikut jadi async — persis pekerjaan yang seharusnya dihindari oleh desain ini. Biayanya nol sekarang; mahal nanti.

### Pemilihan implementasi

Hanya di satu tempat, supaya penggantian di fase 6 adalah perubahan satu baris:

```tsx
// src/main.tsx
const repo: TransactionRepository = new LocalStorageRepository()
// fase 6:  new ApiRepository(import.meta.env.VITE_API_URL)

createRoot(el).render(
  <RepositoryProvider value={repo}>
    <App />
  </RepositoryProvider>,
)
```

Komponen mengaksesnya lewat hook, tidak pernah mengimpor implementasi langsung:

```ts
export function useTransactions() {
  const repo = useRepository()
  // ...
}
```

---

## 8. Kontrak API (fase 6)

```
GET    /api/transactions              → Transaction[]
POST   /api/transactions              → Transaction
PATCH  /api/transactions/:id          → Transaction
DELETE /api/transactions/:id          → 204

GET    /api/brokers                   → BrokerConfig[]
GET    /api/prices?tickers=BBCA,TLKM  → Record<string, number>   (fase 8)
```

### Keputusan: posisi dihitung di klien, bukan di server

Server hanya menyimpan dan mengembalikan transaksi. `hitungPosisi()` tetap berjalan di browser.

**Alasannya:** logika hitungan tinggal di satu tempat. Kalau server ikut menghitung, kamu punya dua implementasi yang harus dijaga tetap sama — dan suatu hari keduanya akan berbeda tanpa kamu sadari. Beban komputasinya juga tidak berarti; ribuan transaksi selesai dalam hitungan milidetik.

**Kapan keputusan ini perlu ditinjau ulang:** kalau nanti ada aplikasi mobile native, atau laporan yang dibuat di server (misalnya rekap pajak yang dikirim lewat email). Saat itu, `domain/` dipindahkan ke paket bersama yang diimpor keduanya — bukan diduplikasi.

### Validasi

Skema Zod ditulis sekali dan dipakai di kedua sisi. Server tetap memvalidasi walaupun klien sudah — **jangan pernah percaya klien**, dan ini pertanyaan interview yang hampir pasti muncul untuk posisi fullstack.

### Normalisasi tanggal — wajib

Di klien, `tanggal` bertipe `string` berformat `'YYYY-MM-DD'`. Di database ia `DateTime @db.Date`, dan Prisma mengembalikannya sebagai ISO datetime lengkap (`'2026-01-15T00:00:00.000Z'`).

`ApiRepository` **harus menormalkan format itu di kedua arah**, misalnya dengan `.slice(0, 10)` saat membaca. Kalau tidak, komparator di `hitungPosisi()` — yang memakai `a.tanggal !== b.tanggal` sebagai gerbang sebelum jatuh ke `dibuatPada` — akan menganggap dua transaksi di hari yang sama sebagai beda tanggal, dan pemecah seri tidak pernah dijalankan.

Ini gagal **diam-diam**: tidak ada error, angkanya saja yang salah. Kasus uji 13 adalah yang menangkapnya.

---

## 9. Skema database (fase 6 → 7)

Skema dibangun dua tahap. Fase 6 belum punya konsep pengguna — autentikasi baru masuk di fase 7 — jadi kolom `userId` belum ada di sini. Memasukkannya lebih awal akan langsung memblokir fase 6: endpoint CRUD dan skrip migrasi tidak punya nilai untuk mengisinya.

### Fase 6 — satu pengguna, tanpa autentikasi

```prisma
model Transaction {
  id         String   @id @default(uuid())

  tanggal    DateTime @db.Date
  dibuatPada DateTime @default(now())
  broker     String
  ticker     String
  jenis      String

  lembar     Int
  harga      Int      // rupiah — Int, bukan Float
  fee        Int
  pajak      Int
  rasio      Float?
  jumlah     Int?

  tesis      String?
  catatan    String?

  @@index([ticker, broker])
  @@index([tanggal])
}
```

### Fase 7 — tambahan untuk multi-pengguna

```prisma
model User {
  id           String        @id @default(uuid())
  email        String        @unique
  passwordHash String
  createdAt    DateTime      @default(now())
  transactions Transaction[]
}

// Tambahkan ke model Transaction:
//   userId String
//   user   User @relation(fields: [userId], references: [id], onDelete: Cascade)
//   @@index([userId, ticker, broker])
//   @@index([userId, tanggal])
```

Migrasinya bertahap: tambahkan `userId` sebagai opsional, isi seluruh baris lama dengan id akunmu, baru jadikan wajib. Ini pola migrasi kolom non-nullable yang akan kamu temui terus di dunia kerja — layak dilatih sekali di proyek yang risikonya nol.

### Kenapa `Int` untuk uang

`harga`, `fee`, dan `pajak` bertipe `Int`. Godaan memakai `Float` atau `Decimal` itu besar — tapi rupiah tidak punya satuan pecahan, jadi bilangan bulat adalah representasi yang paling tepat sekaligus paling aman.

---

## 10. Strategi testing

| Lapisan | Cakupan | Alasan |
|---|---|---|
| `domain/` | **Menyeluruh** | Di sini uang dihitung. Fungsi murni, jadi murah untuk dites. |
| `data/` | Secukupnya | Cukup pastikan simpan-dan-baca kembali bekerja. |
| `hooks/` | Alur utama saja | Tambah, ubah, hapus. |
| `components/` | Hampir tidak ada | Mahal untuk ditulis, cepat basi, jarang menangkap bug nyata. |

Kamu tidak sedang mengejar angka cakupan — kamu sedang melindungi angka rupiah. Test suite yang berisi 13 kasus domain yang bermakna jauh lebih berkesan daripada cakupan 90% yang isinya memverifikasi bahwa tombol merender teks.

---

## 11. Keputusan yang sudah dikunci

Ringkasan, dengan alasan yang bisa kamu ceritakan saat interview.

| Keputusan | Alasan |
|---|---|
| Transaksi sebagai sumber kebenaran | Posisi bisa dibangun ulang; kesalahan input bisa diperbaiki tanpa merusak histori |
| Lembar, bukan lot | Corporate action tidak menghasilkan pecahan |
| Bilangan bulat rupiah | Menghindari galat floating point pada data keuangan |
| Fee disimpan, bukan dihitung ulang | Perubahan tarif tidak mengubah histori secara diam-diam |
| `RIGHTS` diperlakukan seperti `BELI` | Secara ekonomi identik: uang disetor, lembar bertambah |
| Posisi berkunci `(ticker, broker)` | Memungkinkan rekonsiliasi dengan aplikasi broker |
| Repository sebagai interface, async sejak awal | Penggantian localStorage → API tanpa menyentuh UI |
| Posisi dihitung di klien | Satu implementasi logika, bukan dua yang bisa berbeda |
| `domain/` tanpa dependensi | Bisa dites tanpa merender atau memalsukan browser |

Kalau salah satu keputusan ini berubah di kemudian hari, tulis alasannya di `docs/decisions/` — kebiasaan yang akan langsung dikenali di lingkungan kerja profesional.
