# CLAUDE.md

Instruksi untuk coding agent yang bekerja di repo ini.

---

- Menambahkan baris `Co-Authored-By`, `Claude-Session`, atau trailer lain yang menyebut Claude/Anthropic di pesan commit.

## Konteks proyek

Aplikasi pencatat transaksi saham IDX untuk portofolio pribadi di dua broker (BIONS/BNI untuk posisi utama, Stockbit untuk transaksi kecil).

**Ini proyek belajar.** Pemiliknya sedang mempelajari React, TypeScript, dan pengembangan fullstack sebagai persiapan magang. Kode yang benar tapi tidak dipahami adalah kegagalan, bukan keberhasilan — lihat § Cara bekerja di sini.

Rancangan lengkap: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · Urutan pengerjaan: [`docs/ROADMAP.md`](docs/ROADMAP.md)

---

## Cara bekerja di sini

- **Jelaskan sebelum menulis.** Sampaikan pendekatannya dalam beberapa kalimat, lalu tulis kodenya. Untuk perubahan yang tidak sepele, tunggu konfirmasi dulu.
- **Kerjakan satu langkah, bukan satu fase.** Jangan menghasilkan seluruh fase sekaligus walaupun diminta secara umum — pecah jadi potongan yang bisa dibaca dan dipahami.
- **Tunjukkan alasan, bukan cuma hasil.** Ketika ada dua cara yang wajar, sebutkan trade-off-nya. Kalau menolak pendekatan tertentu, jelaskan kenapa.
- **Jangan diam-diam menambah dependensi.** Tanyakan dulu, dan sebutkan apa yang ia gantikan.
- **Test bukan opsional untuk `src/domain/`.** Setiap perubahan rumus datang bersama test-nya.

---

## Aturan domain — tidak boleh dilanggar

Lima dari delapan keputusan yang dikunci di [`docs/ARCHITECTURE.md § 11`](docs/ARCHITECTURE.md) — yang paling mudah dilanggar tanpa sengaja. Melanggarnya menghasilkan bug yang baru ketahuan berbulan-bulan kemudian.

1. **Transaksi adalah satu-satunya sumber kebenaran.**
   Posisi, harga rata-rata, dan P/L tidak pernah disimpan — selalu dihitung ulang dari daftar transaksi. Jangan pernah membuat tabel atau state yang menyimpan "posisi saat ini".

2. **Simpan lembar, bukan lot.**
   1 lot = 100 lembar. Konversi ke lot hanya boleh terjadi di lapisan tampilan.

3. **Uang selalu bilangan bulat rupiah.**
   Tidak ada `float` untuk nilai uang, di mana pun — termasuk kolom database. Pakai `Math.round()` di setiap titik perhitungan. Rupiah tidak punya sen.
   *Satu-satunya pengecualian:* `Position.hargaRataRata`, yang merupakan nilai turunan khusus tampilan dan tidak pernah menjadi input rumus apa pun.

4. **Fee dihitung otomatis, tetapi disimpan.**
   `hitungBiaya()` hanya mengisi nilai default di form. Angka yang tersimpan di `Transaction` adalah hasilnya, bukan rumusnya. **Jangan pernah menghitung ulang fee dari config saat menampilkan data** — perubahan tarif akan mengubah histori secara diam-diam.

5. **Kunci posisi adalah `(ticker, broker)`.**
   BBCA di BIONS dan BBCA di Stockbit adalah dua posisi terpisah. Tidak ada perata-rataan lintas broker. Yang boleh digabung hanya total portofolio (penjumlahan, bukan perata-rataan).

---

## Aturan lapisan

```
components/ pages/ hooks/  →  boleh impor domain/, data/, config/
data/                      →  boleh impor domain/, config/
domain/                    →  hanya boleh impor config/
config/                    →  tidak impor apa pun
```

- **`src/domain/` tidak boleh mengimpor React, `localStorage`, `fetch`, atau apa pun dari `src/data/`, `src/hooks/`, `src/pages/`, dan `src/components/`.** Satu-satunya impor yang diperbolehkan adalah `src/config/`. Kalau sebuah fungsi di `domain/` butuh selain itu, berarti fungsi itu salah tempat.
- **Jangan menaruh logika hitungan di dalam komponen** — sekecil apa pun, termasuk "cuma satu perkalian". Semua yang menghitung uang tinggal di `src/domain/`.
- **Repository hanya dipilih di `src/main.tsx`.** Komponen mengakses data lewat hook, tidak pernah mengimpor `LocalStorageRepository` atau `ApiRepository` secara langsung.
- **Semua method repository `async`**, walaupun implementasi saat ini sinkron. Ini disengaja agar pindah ke API nanti tidak menyentuh komponen.

---

## Konvensi kode

- TypeScript `strict`. Tidak ada `any` — kalau tipenya belum jelas, pakai `unknown` lalu persempit.
- Nama domain dalam bahasa Indonesia (`lembar`, `modal`, `hargaRataRata`, `hitungPosisi`), istilah teknis dalam bahasa Inggris (`repository`, `hook`, `provider`). Ikuti yang sudah ada di `src/domain/types.ts`.
- Validasi input dengan Zod. Skema tinggal di satu tempat dan dipakai bersama klien–server.
- State: `useState` dan Context. **Jangan menambahkan Redux.** Kalau state mulai berat, tanyakan dulu sebelum menambah Zustand.
- Styling dengan Tailwind. Tanpa file CSS terpisah kecuali ada alasan khusus.

---

## Yang tidak boleh dilakukan

- Menambahkan file yang berisi data finansial asli ke git. Cek `.gitignore` sebelum commit.
- Menghapus atau mengubah test yang gagal agar hijau. Kalau test gagal, ada yang salah — laporkan.
- Membuat transaksi `JUAL` menghasilkan `lembar` negatif. Kondisi itu berarti data tidak konsisten dan harus melempar error.
- Memproses transaksi tanpa mengurutkannya lebih dulu (`tanggal`, lalu `dibuatPada` sebagai pemecah seri).
- Membiarkan `lembar` bernilai pecahan. `REVERSE_SPLIT` membulatkan ke bawah; sisanya dicatat sebagai transaksi terpisah.
- Mengembalikan `tanggal` dari API dalam format selain `'YYYY-MM-DD'`. Normalkan di `ApiRepository`, bukan di komponen.
- Mengubah keputusan di `ARCHITECTURE.md § 11` tanpa membahasnya lebih dulu.

---

## Perintah

```bash
npm run dev            # server pengembangan
npm test               # Vitest, mode watch
npm run test:run       # sekali jalan
npm run lint
npm run build

# fase 6+ (npm workspaces disiapkan di awal fase 6)
npm run dev --workspace=server
npx prisma migrate dev
npx prisma studio
```

---

## Kesalahan yang sering terjadi di domain ini

Kalau angka tidak cocok dengan aplikasi broker, periksa berurutan:

| Gejala | Kemungkinan penyebab |
|---|---|
| Harga rata-rata lebih rendah dari seharusnya | Fee beli belum dimasukkan ke `modal` |
| Fee transaksi kecil terlalu murah | `feeMinimum` tidak diterapkan (`Math.max`) |
| Harga rata-rata berubah setelah config diperbarui | Fee dihitung ulang saat ditampilkan, bukan disimpan |
| Realized P/L salah setelah jual sebagian | HPP tidak proporsional terhadap sisa modal |
| Hasil berbeda antar-refresh | Transaksi tidak diurutkan sebelum diproses |
| Satu ticker punya angka campur aduk | Kunci posisi hanya memakai ticker, tidak menyertakan broker |
| Transaksi setanggal berperilaku acak setelah pindah ke API | `tanggal` dari server belum dinormalkan ke `'YYYY-MM-DD'`, jadi pemecah seri `dibuatPada` tidak pernah jalan |
