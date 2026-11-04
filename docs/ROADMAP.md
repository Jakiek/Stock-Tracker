# ROADMAP — Tracker Saham

> Peta jalan pengembangan dari nol sampai aplikasi fullstack yang terdeploy.
> Dokumen ini menjawab **"kerjakan apa, dengan urutan apa, dan kapan boleh lanjut"**.
> Rancangan teknisnya ada di [`ARCHITECTURE.md`](./ARCHITECTURE.md).

---

## Ringkasan proyek

| | |
|---|---|
| **Apa** | Aplikasi pencatat transaksi saham IDX untuk portofolio pribadi |
| **Broker** | BIONS (BNI) — posisi utama · Stockbit — transaksi kecil |
| **Untuk siapa** | Dipakai sendiri setiap minggu, sekaligus proyek portofolio magang fullstack |
| **Stack** | React · TypeScript · Vite · Tailwind · Zod · Recharts · Vitest → Node · Express · Postgres · Prisma |
| **Penyimpanan** | localStorage (fase 1–5) → Postgres via REST API (fase 6–7) |

---

## Aturan main sepanjang proyek

Lima hal ini berlaku di semua fase. Melanggarnya bukan sekadar gaya kode yang berbeda — ada konsekuensi yang baru terasa berbulan-bulan kemudian.

1. **Transaksi adalah satu-satunya sumber kebenaran.** Posisi, harga rata-rata, dan P/L tidak pernah disimpan — selalu dihitung ulang dari daftar transaksi.
2. **Simpan lembar, tampilkan lot.** 1 lot = 100 lembar. Database berpikir dalam lembar; hanya lapisan tampilan yang tahu soal lot.
3. **Uang selalu bilangan bulat rupiah.** Tidak ada `float` untuk nilai uang. Rupiah tidak punya sen — manfaatkan itu.
4. **Fee dihitung otomatis, tetapi disimpan.** Tarif ada di config sebagai pengisi nilai default; yang tersimpan di transaksi adalah angka yang benar-benar didebit.
5. **Posisi dipisah per broker.** Kunci posisi adalah `(ticker, broker)`. Tidak ada perata-rataan lintas broker.

---

## Peta fase

```
Fase 0  Validasi manual ─────────────────┐
                                          │ tanpa ini, semua fase berikutnya
Fase 1  Fondasi & lapisan data           │ dibangun di atas asumsi yang belum teruji
Fase 2  Mesin hitung + test ─────────────┘

Fase 3  Antarmuka
Fase 4  Harga pasar & ringkasan

Fase 5  ★ CHECKPOINT — deploy, demo mode, README
        ── aplikasi utuh & layak dilamarkan ──

Fase 6  Backend & database
Fase 7  ★ CHECKPOINT — autentikasi & deploy fullstack
        ── portofolio fullstack lengkap ──

Fase 8  Pengembangan lanjutan (terbuka)
```

**Dua checkpoint itu bukan hiasan.** Di fase 5 dan 7, proyekmu berada dalam kondisi utuh dan bisa ditunjukkan ke orang lain. Kalau kamu terpaksa berhenti (sibuk kuliah, kehilangan momentum), berhentilah di salah satu titik itu — bukan di tengah fase 6.

---

## Fase 0 — Validasi manual

**Durasi** 2–3 hari · **Belum menulis kode**

Membuktikan bahwa kamu paham cara broker menghitung, sebelum menuangkannya ke kode.

### Yang dikerjakan

- [ ] Salin 20–30 transaksi terakhir dari BIONS dan Stockbit ke satu spreadsheet
- [ ] Catat tarif fee beli dan fee jual aktual masing-masing broker
- [ ] Buka satu konfirmasi transaksi **kecil** di Stockbit — cek apakah fee yang ditagih sama dengan `tarif × nilai`, atau ada fee minimum
- [ ] Pastikan apakah tarif jual yang disebut broker sudah termasuk PPh final 0,1% atau belum
- [ ] Hitung manual (lembar, modal, harga rata-rata) untuk 3–5 saham
- [ ] Bandingkan dengan harga rata-rata yang tampil di aplikasi BIONS
- [ ] Catat apakah ada saham yang pernah kena stock split, rights issue, atau dividen saham

### Definition of done

Harga rata-rata hitunganmu **cocok** dengan yang tampil di aplikasi BIONS untuk minimal 3 saham — atau setiap selisih yang tersisa sudah kamu ketahui persis penyebabnya.

### Kenapa ini tidak boleh dilewat

Kemungkinan besar hitungan pertamamu tidak cocok. Penyebabnya hampir selalu satu dari tiga hal: fee beli belum dimasukkan ke modal, tarif yang kamu kira salah, atau ada corporate action yang terlupa. Menemukannya sekarang butuh setengah jam. Menemukannya setelah 800 baris kode berarti membongkar ulang model datamu.

---

## Fase 1 — Fondasi & lapisan data

**Durasi** ± 1 minggu · **Belum ada UI sungguhan**

Menyiapkan proyek dan lapisan penyimpanan yang bisa diganti tanpa menyentuh sisa aplikasi.

### Yang dikerjakan

- [ ] `npm create vite@latest` — template React + TypeScript
- [ ] Pasang Tailwind, Vitest, Zod, ESLint + Prettier
- [ ] Aktifkan `strict: true` di `tsconfig.json`
- [ ] Buat struktur folder sesuai `ARCHITECTURE.md`
- [ ] Definisikan tipe di `src/domain/types.ts`
- [ ] Tulis config broker di `src/config/brokers.ts` (isi dari hasil fase 0)
- [ ] Tulis `TransactionRepository` (interface) dan `LocalStorageRepository`
- [ ] `.gitignore` — file ekspor transaksi, screenshot portofolio, dan `src/domain/__tests__/data-asli.test.ts`
- [ ] `git init` + commit pertama

### Definition of done

Kamu bisa memanggil `repo.add(...)` lalu `repo.getAll()` dari console browser dan datanya bertahan setelah halaman di-refresh.

### Jebakan

> **Semua method repository harus `async`**, walaupun localStorage itu sinkron dan tidak memerlukannya. Kalau ditulis sinkron sekarang, di fase 6 setiap komponen yang menyentuh data ikut harus diubah — persis pekerjaan yang seharusnya dihindari oleh desain ini. Biayanya nol sekarang, mahal nanti.

---

## Fase 2 — Mesin hitung + test

**Durasi** ± 1 minggu · **Dikerjakan sebelum UI**

Inti aplikasi. Fungsi murni, tanpa React, tanpa I/O — karena itu bisa dites habis-habisan.

### Yang dikerjakan

- [ ] `src/domain/money.ts` — helper pembulatan rupiah
- [ ] `src/domain/fees.ts` — `hitungBiaya(nilai, broker, jenis)`, termasuk fee minimum
- [ ] `src/domain/positions.ts` — `hitungPosisi(transaksi[])`
- [ ] `src/domain/portfolio.ts` — agregat lintas posisi
- [ ] Test untuk seluruh kasus di daftar `ARCHITECTURE.md § Kasus uji wajib`
- [ ] Masukkan data asli dari fase 0 sebagai satu test — hasilnya harus cocok dengan BIONS

### Definition of done

`npm test` hijau, dan test terakhir di atas membuktikan mesin hitungmu menghasilkan angka yang sama dengan aplikasi broker.

### Kenapa sebelum UI

Logika lebih mudah dibenarkan tanpa form dan tombol yang mengganggu. Kalau UI dibuat lebih dulu, setiap perbaikan rumus memaksa kamu mengklik-klik ulang untuk memverifikasi. Dengan test, verifikasinya satu detik.

---

## Fase 3 — Antarmuka

**Durasi** ± 2 minggu

Di sinilah kamu benar-benar belajar React: state, form, komposisi komponen, dan daftar yang berperilaku baik.

### Yang dikerjakan

- [ ] Hook `useTransactions` — membungkus repository
- [ ] Hook `usePositions` — menjalankan `hitungPosisi()` atas hasil `useTransactions`
- [ ] `TransactionForm` — input transaksi, validasi Zod, fee terisi otomatis tapi bisa diubah
- [ ] `TransactionList` — riwayat, bisa diurutkan dan difilter per broker
- [ ] Edit dan hapus transaksi
- [ ] `PositionTable` — posisi dengan kunci `(ticker, broker)`, bisa dilihat per broker atau semua
- [ ] Layout responsif — kamu akan sering membukanya dari HP

### Definition of done

Kamu bisa memasukkan seluruh transaksi asli fase 0 lewat UI, dan tabel posisi menampilkan angka yang cocok dengan aplikasi BIONS.

### Jebakan

> Godaan terbesar di fase ini adalah menaruh logika hitungan di dalam komponen ("cuma satu perkalian kecil"). Jangan. Semua yang menghitung uang tinggal di `src/domain/` supaya tetap bisa dites.

---

## Fase 4 — Harga pasar & ringkasan

**Durasi** ± 1 minggu

### Yang dikerjakan

- [ ] `pages/Prices.tsx` — input harga pasar manual per ticker
- [ ] `src/data/prices.ts` — `ambilHarga(ticker)`, fase ini membacanya dari input manual
- [ ] `pages/Settings.tsx` — tarif broker dan pengelolaan data
- [ ] `PortfolioSummary` — total nilai, unrealized, realized, total dividen
- [ ] Toggle "setelah biaya" pada unrealized P/L
- [ ] Grafik komposisi portofolio (Recharts)
- [ ] Perbandingan performa BIONS vs Stockbit

### Definition of done

Dashboard menampilkan nilai portofolio total dan P/L, dan kamu benar-benar memakainya untuk mengecek posisimu.

### Jebakan

> Bungkus pengambilan harga di **satu fungsi** sejak sekarang, walaupun isinya cuma membaca objek. Di fase 8 fungsi itu diganti isinya dengan panggilan API, dan tidak ada tempat lain yang perlu diubah.

---

## Fase 5 ★ — Deploy, demo mode, README

**Durasi** ± 4 hari · **CHECKPOINT: layak dipamerkan**

### Yang dikerjakan

- [ ] `src/data/seed.ts` — 30–40 transaksi fiktif yang realistis, termasuk satu stock split dan beberapa posisi rugi
- [ ] Tombol "Muat data contoh" dan "Kosongkan data"
- [ ] Pastikan aplikasi terbuka dalam keadaan berisi, bukan layar kosong
- [ ] Deploy ke Vercel
- [ ] README dengan: screenshot, cara menjalankan, **dan alasan di balik keputusan arsitekturmu**
- [ ] Rapikan riwayat commit dan tulis deskripsi repo

### Definition of done

Ada satu tautan yang bisa kamu kirim ke siapa pun. Mereka membukanya, klik satu tombol, dan langsung melihat aplikasi berisi data — tanpa perlu bertanya apa pun kepadamu.

### Kenapa berhenti di sini sebelum lanjut

Aplikasi kecil yang selesai, terdeploy, dan benar-benar dipakai mengalahkan aplikasi ambisius yang berhenti di 60%. Kalau setelah fase ini kamu tidak menyentuh proyeknya selama tiga bulan, kamu tetap punya sesuatu yang utuh untuk dilamarkan.

### Isi README yang penting

Bagian yang paling dibaca bukan daftar fitur, tapi **alasan**. Tulis 3–4 paragraf:

- Kenapa transaksi jadi sumber kebenaran, bukan posisi
- Kenapa fee disimpan, bukan dihitung ulang saat ditampilkan
- Kenapa posisi dipisah per broker
- Kenapa lapisan penyimpanan dibuat sebagai interface

Itu yang membedakan portofolio yang menunjukkan "bisa memakai React" dari yang menunjukkan "bisa mengambil keputusan teknis".

---

## Fase 6 — Backend & database

**Durasi** ± 2–3 minggu

### Yang dikerjakan

- [ ] Setup npm workspaces, lalu Node + Express + TypeScript di folder `server/`
- [ ] Postgres lokal (Docker) + Prisma, skema **fase 6** sesuai `ARCHITECTURE.md § 9` — belum ada `User`
- [ ] Endpoint CRUD transaksi
- [ ] Validasi input di sisi server — jangan percaya klien
- [ ] `src/data/ApiRepository.ts` yang mengimplementasikan interface yang sama
- [ ] Normalkan `tanggal` ke `'YYYY-MM-DD'` di `ApiRepository` (lihat `ARCHITECTURE.md § 8`)
- [ ] Ganti repository lewat satu baris di `main.tsx`
- [ ] Skrip migrasi: pindahkan data localStorage ke database

### Definition of done

Aplikasi berjalan penuh lewat API, dan **tidak ada satu pun file di `src/components/` yang berubah** dibanding fase 5. Buktikan lewat `git diff`.

### Cerita untuk interview

`git diff` di fase ini adalah bukti konkret bahwa desain lapisanmu benar. Kalau ditanya "pernah membuat keputusan arsitektur yang terbukti berguna?", inilah jawabanmu — lengkap dengan commit yang bisa ditunjukkan.

---

## Fase 7 ★ — Autentikasi & deploy fullstack

**Durasi** ± 1 minggu · **CHECKPOINT: portofolio fullstack lengkap**

### Yang dikerjakan

- [ ] Migrasi skema: tambah `model User`, lalu `userId` sebagai opsional → isi baris lama → jadikan wajib
- [ ] Registrasi & login (password di-hash — bcrypt/argon2)
- [ ] Session atau JWT, transaksi terikat ke `userId`
- [ ] Deploy backend + database (Railway / Render / Fly.io)
- [ ] Frontend menunjuk ke API produksi
- [ ] Akun demo untuk recruiter, berisi data seed
- [ ] Update README: diagram arsitektur, kredensial demo

### Definition of done

Kamu bisa membuka aplikasi dari HP, memasukkan transaksi, dan melihatnya muncul di laptop. Dan ada akun demo yang bisa dicoba siapa saja tanpa mendaftar.

---

## Fase 8 — Pengembangan lanjutan

**Terbuka · kerjakan yang kamu butuhkan, bukan yang terdengar keren**

| Fitur | Nilai untuk kamu | Nilai untuk portofolio |
|---|---|---|
| Import CSV riwayat broker | Tinggi — mengisi manual itu menyakitkan | Tinggi — parsing data berantakan itu skill nyata |
| Harga pasar otomatis via API | Tinggi | Sedang |
| Corporate action lengkap | Sedang — sampai kamu mengalaminya | Tinggi — menunjukkan pemahaman domain |
| Dividen & yield | Sedang | Sedang |
| Analisis BIONS vs Stockbit | Tinggi — menjawab pertanyaan aslimu | Tinggi — fitur yang lahir dari kebutuhan |
| Jurnal tesis per transaksi | Tinggi | Sedang |
| Export laporan pajak tahunan | Sedang | Sedang |

---

## Konvensi git

Riwayat commit-mu akan dibaca. Pakai [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: hitung realized P/L saat jual sebagian
fix: fee minimum tidak diterapkan pada transaksi kecil
test: kasus stock split 1:5
refactor: pindahkan hitungBiaya ke domain layer
docs: jelaskan alasan pemisahan posisi per broker
chore: pasang vitest
```

Satu commit = satu perubahan yang bisa dijelaskan dalam satu kalimat. `update` tiga puluh kali adalah sinyal negatif yang mudah dihindari.

**Branch:** kerjakan tiap fase di branch sendiri (`fase-2-mesin-hitung`), merge ke `main` lewat pull request — walaupun kamu sendirian. Ini melatih alur kerja yang akan kamu temui di tempat magang, dan menghasilkan riwayat yang rapi.

---

## Kalau macet

| Gejala | Kemungkinan penyebab |
|---|---|
| Angka tidak cocok dengan BIONS | Fee beli belum masuk modal, atau fee minimum terlewat |
| Harga rata-rata berubah setelah update config | Fee dihitung ulang saat ditampilkan, bukan disimpan |
| Realized P/L aneh setelah jual sebagian | HPP tidak dihitung proporsional terhadap sisa modal |
| Error "jual melebihi kepemilikan" padahal data benar | Transaksi belum diurutkan (`tanggal`, lalu `dibuatPada`) sebelum diproses |
| Transaksi setanggal berperilaku acak setelah pindah ke API | `tanggal` dari server belum dinormalkan ke `'YYYY-MM-DD'` |
| Fase 6 terasa seperti menulis ulang | Repository di fase 1 ditulis sinkron |
