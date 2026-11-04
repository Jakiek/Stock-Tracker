# DESIGN — Sistem Desain Frontend

> Panduan visual dan komponen untuk tracker saham. Dibaca sebelum menulis komponen apa pun.
> Rancangan teknis: [`ARCHITECTURE.md`](./ARCHITECTURE.md) · Urutan pengerjaan: [`ROADMAP.md`](./ROADMAP.md)

---

## 1. Membaca referensi

Dua referensi yang dipakai: dashboard **Expensify** (indigo, terang) dan **dtrack** (oranye, dengan dark mode). Keduanya bagus — tapi keduanya adalah *shot Dribbble*, dibuat untuk dilihat sekilas, bukan dipakai tiap minggu dengan 300 baris transaksi.

### Yang diambil

| Pola | Kenapa berhasil |
|---|---|
| Sidebar tetap + area konten yang menggulir sendiri | Navigasi tidak pernah hilang; standar untuk aplikasi yang dipakai berulang |
| Nav dikelompokkan berlabel (*General · Tools · Other*) | Enam item tanpa kelompok terasa acak; berkelompok terasa punya struktur |
| Baris kartu KPI di paling atas | Menjawab "bagaimana keadaan saya?" sebelum mata turun ke detail |
| Ikon dalam kotak berwarna lembut, bukan ikon telanjang | Memberi jangkar visual pada tiap kartu tanpa menambah garis |
| *Pill* tren (`↗ 6% more than last month`) | Angka mentah tidak punya makna tanpa pembanding |
| Batang bar dengan "rel" abu di belakangnya | Menunjukkan skala maksimum tanpa perlu garis grid |
| Donat + legenda bernilai di sebelahnya | Donat sendirian tidak terbaca; legenda yang membawa angkalah yang berguna |
| Panel kanan untuk daftar sekunder | Tagihan/langganan tidak perlu selebar tabel utama |

### Yang tidak diambil

**Format angka India.** Ini yang paling penting. Referensi memakai `₹8,98,450` — pengelompokan lakh 2-2-3 khas India. Indonesia memakai 3-3-3 dengan titik: `Rp8.980.450`. Menyalin format ini akan langsung terlihat salah oleh siapa pun yang membaca angkanya. Selalu `Intl.NumberFormat('id-ID')`.

**Kerapatan tabel yang dirancang untuk 5 baris.** Kedua referensi menampilkan lima transaksi dengan tinggi baris longgar, karena begitulah screenshot terlihat lapang. Kamu akan punya ratusan transaksi. Rancang untuk 30 baris terlihat sekaligus, bukan 5.

**Empat kartu KPI yang sama menonjolnya.** Kalau semuanya besar, tidak ada yang jadi jawaban. Tentukan satu angka utama — untuk aplikasi ini: **nilai portofolio** — dan buat sisanya lebih kecil.

**Gradien dekoratif di setiap kartu.** Di referensi pertama tiap kartu punya rona berbeda tanpa alasan sistematis. Warna sebaiknya berarti sesuatu; kalau tidak berarti apa-apa, ia hanya kebisingan yang menyulitkan saat kamu betul-betul perlu memberi arti pada sebuah warna.

**Grafik tanpa label sumbu.** Grafik area di referensi kedua tidak menyebut satuan maupun periodenya. Untuk data uang, itu bukan minimalis — itu presisi palsu.

**"Upgrade to PRO".** Tidak ada monetisasi di sini. Ruang itu lebih berguna untuk ringkasan atau tombol tambah transaksi.

**Emoji di judul (`Hi, Ananya 👋`).** Boleh sekali di sapaan. Jangan jadikan sistem — emoji sebagai penanda bagian membuat antarmuka terlihat dibuat cepat.

---

## 2. Prinsip

**Angka adalah antarmukanya.** Semua keputusan tipografi, perataan, dan spasi tunduk pada satu hal: apakah angkanya cepat dibaca dan dibandingkan. Segala yang menghalangi itu — gradien di belakang teks, kontras rendah, angka rata kiri — adalah bug.

**Warna semantik terpisah dari warna merek.** Hijau berarti untung. Merah berarti rugi. Keduanya **tidak boleh** dipakai sebagai warna merek, tombol, atau aksen dekoratif. Ini juga alasan warna merek aplikasi ini ada di keluarga biru–ungu: cukup jauh dari hijau maupun merah sehingga tidak pernah ambigu. Hijau kebiruan (*teal*) sengaja dihindari — bersebelahan dengan angka hijau, ia membingungkan.

**Warna tidak pernah jadi satu-satunya penanda.** Untung dan rugi selalu membawa tanda (`+` / `−`) dan panah, bukan cuma warna. Sekitar 1 dari 12 laki-laki mengalami buta warna merah-hijau, dan ini aplikasi keuangan.

**Rapat, bukan longgar.** Ini alat kerja yang dibuka berulang, bukan halaman pemasaran. Kerapatan yang nyaman untuk memindai 30 baris mengalahkan kelapangan yang bagus di screenshot.

**Satu hierarki per layar.** Setiap halaman punya satu pertanyaan utama yang dijawab paling menonjol.

---

## 3. Token

### 3.1 Warna

```css
:root {
  /* Merek — biru-indigo. Jauh dari hijau & merah. */
  --brand-50:  #EEF0FF;
  --brand-100: #DDE0FE;
  --brand-200: #C0C5FC;
  --brand-300: #9AA0F9;
  --brand-400: #7A7CF3;
  --brand-500: #5F5AEA;
  --brand-600: #4C42DC;   /* primer */
  --brand-700: #3F35BE;
  --brand-800: #342D99;
  --brand-900: #2C2A79;

  /* Netral — condong dingin, senada dengan merek */
  --n-0:   #FFFFFF;
  --n-25:  #FAFAFC;
  --n-50:  #F4F5F9;
  --n-100: #EAECF3;
  --n-200: #DDE0EA;
  --n-300: #C3C8D6;
  --n-400: #98A0B3;
  --n-500: #6E7788;
  --n-600: #4E5666;
  --n-700: #39404D;
  --n-800: #252B35;
  --n-900: #161A21;
  --n-950: #0E1116;

  /* Semantik — HANYA untuk makna, tidak pernah dekorasi */
  --gain:      #0F8A4D;
  --gain-bg:   #E3F6EC;
  --loss:      #C2352A;
  --loss-bg:   #FCE9E7;
  --warn:      #B45309;
  --warn-bg:   #FEF3E2;

  /* Peran */
  --bg:            var(--n-50);
  --surface:       var(--n-0);
  --surface-sunk:  var(--n-100);
  --border:        var(--n-200);
  --border-strong: var(--n-300);
  --text:          var(--n-900);
  --text-muted:    var(--n-500);
  --text-subtle:   var(--n-400);
  --accent:        var(--brand-600);
  --accent-bg:     var(--brand-50);
  --focus:         var(--brand-500);
}

[data-theme="dark"] {
  --bg:            var(--n-950);
  --surface:       var(--n-900);
  --surface-sunk:  var(--n-800);
  --border:        #2A313D;
  --border-strong: #3A4250;
  --text:          #E7EAF0;
  --text-muted:    #98A0B3;
  --text-subtle:   #6E7788;
  --accent:        var(--brand-400);
  --accent-bg:     #221F52;
  --focus:         var(--brand-300);

  --gain:    #34D18A;
  --gain-bg: #10331F;
  --loss:    #F08579;
  --loss-bg: #3A1512;
  --warn:    #FBBF24;
  --warn-bg: #362508;
}
```

**Kategori grafik** — deret terpisah, dipakai hanya untuk donat dan legenda kategori. Jangan pakai warna ini untuk apa pun selain itu, dan jangan pakai warna merek/semantik sebagai warna kategori.

```css
--cat-1: #4C42DC;  --cat-2: #E8A33D;  --cat-3: #2E9E6B;
--cat-4: #9B51E0;  --cat-5: #E1683C;  --cat-6: #3AB7C9;
--cat-7: #D4568C;  --cat-8: #6B7280;  /* cat-8 = "Lainnya" */
```

Urutan ini dipilih agar dua warna bersebelahan di donat selalu berbeda terang-gelapnya, bukan cuma berbeda rona — supaya tetap terbaca kalau dicetak hitam-putih atau dilihat mata buta warna.

### 3.2 Tipografi

```css
--font-ui:   'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
--font-mono: 'JetBrains Mono', ui-monospace, monospace;
```

**Plus Jakarta Sans** dipilih bukan karena tren. Ia typeface Indonesia (awalnya untuk identitas kota Jakarta), gratis di Google Fonts, punya angka tabular yang rapi, dan memberi aplikasi keuangan Indonesia identitas yang pas tanpa perlu dijelaskan. Itu juga jawaban yang bagus kalau ditanya "kenapa font ini?" saat interview.

**Mono dipakai hanya untuk kode ticker** (`BBCA`, `TLKM`) dan label teknis — bukan untuk angka. Angka memakai font UI dengan `tabular-nums`.

| Peran | Ukuran / tinggi baris | Bobot |
|---|---|---|
| Angka display (KPI utama) | 32 / 1.1 | 700 |
| Angka KPI sekunder | 24 / 1.15 | 700 |
| Judul halaman | 22 / 1.25 | 700 |
| Judul kartu | 15 / 1.3 | 600 |
| Teks isi | 14 / 1.55 | 400 |
| Angka tabel | 14 / 1.4 | 500 |
| Label & sekunder | 12.5 / 1.4 | 500 |
| Label huruf besar | 11 / 1.2, `letter-spacing: .08em` | 600 |

**Aturan wajib untuk angka:**

```css
.num {
  font-variant-numeric: tabular-nums;
  text-align: right;
  font-feature-settings: 'tnum' 1;
}
```

Setiap kolom angka rata kanan dan memakai `tabular-nums`. Tanpa ini, digit bergeser antar baris dan mata tidak bisa membandingkan besaran secara vertikal — masalah nyata di tabel dengan 300 baris.

### 3.3 Spasi, radius, bayangan

```css
/* Spasi: kelipatan 4 */
--s-1: 4px;   --s-2: 8px;   --s-3: 12px;  --s-4: 16px;
--s-5: 20px;  --s-6: 24px;  --s-8: 32px;  --s-10: 40px;  --s-12: 48px;

/* Radius */
--r-chip: 6px;    --r-control: 10px;   --r-card: 16px;   --r-pill: 999px;

/* Bayangan — halus, dua lapis */
--shadow-sm: 0 1px 2px rgba(22,26,33,.05);
--shadow:    0 1px 3px rgba(22,26,33,.06), 0 8px 24px -16px rgba(22,26,33,.20);
--shadow-lg: 0 2px 6px rgba(22,26,33,.07), 0 16px 40px -20px rgba(22,26,33,.28);
```

Di mode gelap, bayangan hampir tidak terlihat. Pemisahan antar permukaan di sana dikerjakan oleh perbedaan `--surface` dan `--border`, bukan bayangan.

### 3.4 Gerak

```css
--ease: cubic-bezier(.2, .8, .2, 1);
--dur-fast: 120ms;   /* hover, fokus */
--dur:      200ms;   /* buka/tutup, transisi tab */
--dur-slow: 320ms;   /* modal, panel geser */

@media (prefers-reduced-motion: reduce) {
  * { animation-duration: .01ms !important; transition-duration: .01ms !important; }
}
```

Grafik boleh beranimasi saat pertama muncul, sekali saja. Angka **tidak** dianimasikan naik dari nol — pada data keuangan itu terbaca seperti angka yang masih berubah.

---

## 4. Aturan tampilan domain

Bagian ini yang membedakan aplikasi ini dari dashboard generik. Kalau hanya satu bagian dari dokumen ini yang dibaca, bacalah yang ini.

### 4.1 Rupiah

```ts
export const rp = (n: number, opts?: { ringkas?: boolean }) => {
  if (opts?.ringkas) {
    if (Math.abs(n) >= 1e9) return `Rp${(n / 1e9).toFixed(1)} M`   // miliar
    if (Math.abs(n) >= 1e6) return `Rp${(n / 1e6).toFixed(1)} jt`
    if (Math.abs(n) >= 1e3) return `Rp${(n / 1e3).toFixed(0)} rb`
  }
  return new Intl.NumberFormat('id-ID', {
    style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
  }).format(n)
}
```

- **Tanpa desimal**, di mana pun. Rupiah tidak punya sen, dan `,00` di setiap baris hanya kebisingan.
- **Bentuk ringkas** (`Rp1,4 jt`) hanya untuk label sumbu grafik dan kartu KPI di layar sempit. Tabel selalu memakai angka penuh — di sanalah orang membandingkan.
- **Pengecualian satu-satunya:** `hargaRataRata` boleh menampilkan dua desimal, karena ia hasil pembagian. Tandai dengan gaya yang sedikit berbeda agar jelas ia nilai turunan.

> Jangan pernah memakai pengelompokan India (`8,98,450`) yang terlihat di kedua referensi. Format Indonesia adalah `8.980.450`.

### 4.2 Lot dan lembar

Database menyimpan lembar; layar menampilkan lot. Selalu tampilkan keduanya, dengan lot sebagai yang utama:

```
12 lot
1.200 lembar          ← 12.5px, --text-subtle
```

Di tabel yang rapat, cukup `12 lot` dan tampilkan lembar di tooltip. Jangan pernah menampilkan lot pecahan — kalau muncul, itu bug di lapisan domain, bukan masalah pemformatan.

### 4.3 Untung dan rugi

```
+Rp1.240.000  ↗ +8,2%          hijau
−Rp340.000    ↘ −2,1%          merah
Rp0            —                netral, --text-muted
```

- **Selalu ada tanda eksplisit.** `+` dan `−` (minus tipografis U+2212, bukan tanda hubung — sejajar dengan digit).
- **Selalu ada panah**, supaya arahnya terbaca tanpa warna.
- **Nol itu netral**, bukan hijau. `Rp0` berwarna abu.
- Persentase selalu bersanding dengan nilai absolutnya. Persentase sendirian menyembunyikan skala; nominal sendirian menyembunyikan konteks.

### 4.4 Broker selalu terlihat

Setiap baris posisi dan setiap baris transaksi membawa penanda broker. Ini bukan hiasan — ini keputusan arsitektur (`kunci posisi = ticker + broker`) yang dibuat terlihat.

```
BBCA  [BIONS]     ← chip kecil, --r-chip, latar netral, bukan warna merek
BBCA  [Stockbit]
```

Chip broker memakai warna **netral**, bukan warna merek atau kategori. Ia penanda identitas, bukan status — dan warna berwarna di sana akan berebut perhatian dengan angka untung/rugi yang justru penting.

Tabel posisi punya tiga mode: **Semua** (dikelompokkan per ticker, tiap broker satu baris), **BIONS saja**, **Stockbit saja**. Baris total di bawah menjumlahkan nilai — dan **tidak pernah** merata-ratakan harga.

### 4.5 Layar rekonsiliasi

Tidak ada di kedua referensi, tapi ini justru layar paling berguna di aplikasi ini: menyandingkan hitunganmu dengan angka yang tampil di aplikasi broker.

```
Ticker  Broker    Avg (aplikasi ini)   Avg (di broker)   Selisih
BBCA    BIONS     9.233,50             [ 9.233    ]      ✓ 0,50
TLKM    BIONS     3.104,00             [ 3.180    ]      ⚠ 76,00
```

Kolom "di broker" adalah input manual. Selisih di bawah Rp1 ditandai cocok; di atas itu ditandai perlu diperiksa. Hijau/merah **tidak dipakai** di sini — selisih bukan untung atau rugi, jadi penandanya memakai warna netral dan `--warn`.

### 4.6 Keadaan kosong

Aplikasi ini akan sering dibuka pertama kali oleh orang lain (recruiter, temanmu). Layar kosong yang cuma bertuliskan "No data" adalah kesempatan yang terbuang.

Setiap keadaan kosong punya tiga bagian: **kalimat yang menjelaskan apa yang akan muncul di sini**, **tombol aksi utama**, dan — khusus di dashboard — **tombol "Muat data contoh"**. Halaman pertama tidak boleh berupa kotak-kotak kosong.

### 4.7 Kerapatan tabel

| Mode | Tinggi baris | Kapan |
|---|---|---|
| Nyaman | 52px | Default di layar lebar |
| Rapat | 40px | Bisa dipilih pengguna; disimpan di `localStorage` |

Kepala tabel menempel (`position: sticky`) saat menggulir. Kolom angka rata kanan; kolom teks rata kiri; kolom tanggal rata kiri dengan lebar tetap supaya tidak bergoyang.

---

## 5. Komponen

Ditulis di `src/components/ui/` — tanpa logika bisnis, tanpa pemanggilan repository.

### Card
Wadah dasar. `--surface`, `--r-card`, `border: 1px solid var(--border)`, `--shadow-sm`, padding `--s-5`. Punya slot judul, aksi kanan, dan isi. **Tanpa gradien.**

### StatCard
Kartu KPI. Ikon dalam kotak `32×32` `--r-control` berlatar lembut, label, angka display, dan satu `TrendPill`. Satu varian `size="lg"` untuk angka utama halaman; sisanya normal.

### TrendPill
`↗ +6,2% dari bulan lalu`. Latar `--gain-bg` / `--loss-bg`, teks `--gain` / `--loss`, `--r-pill`, 12.5px. Kalau tidak ada data pembanding, komponen ini **tidak dirender** — jangan menampilkan `0%` yang menyesatkan.

### Badge
Chip status/identitas. Varian: `neutral` (broker, kategori), `gain`, `loss`, `warn`. Ukuran tunggal, 11px, `--r-chip`.

### DataTable
Kepala menempel, baris bisa dipilih, kolom bisa diurutkan, kerapatan bisa diganti. Kolom angka otomatis mendapat `.num`. Menyediakan slot baris total di kaki tabel. Untuk >100 baris, gunakan penggulungan virtual — tapi jangan optimalkan sebelum kamu benar-benar punya sebanyak itu.

### DonutChart
Ketebalan cincin 22% dari jari-jari. Tengahnya berisi total, bukan ikon. Legenda **selalu** ada dan **selalu** membawa nilai — donat tanpa legenda bernilai tidak berguna. Segmen di bawah 3% digabung jadi "Lainnya" (`--cat-8`).

### BarChart
Batang membulat di atas dengan rel `--surface-sunk` di belakangnya, seperti referensi pertama. Sumbu Y berlabel dalam bentuk ringkas (`5 jt`, `10 jt`). Sumbu X memakai nama bulan pendek. Tooltip menampilkan nilai penuh.

### AreaChart
Untuk tren nilai portofolio. Maksimal dua deret; lebih dari itu tidak terbaca. Gradien isian dari 18% ke 0% opasitas. Titik terakhir selalu ditandai dan diberi label — itu angka yang paling dicari orang.

### Button
`primary` (isi `--accent`), `secondary` (bergaris), `ghost`, `danger`. Tinggi 40px (36px untuk `sm`), `--r-control`. Keadaan fokus: `outline: 2px solid var(--focus); outline-offset: 2px`. Jangan pernah menghapus cincin fokus tanpa menggantinya.

### Input / Select / DatePicker
Tinggi 40px, `--r-control`, garis `--border`, fokus `--accent`. Galat ditampilkan di bawah kolom dengan warna `--loss` **dan** ikon — jangan warna saja. Input mata uang menampilkan awalan `Rp` di dalam kolom dan memformat saat kehilangan fokus, bukan saat mengetik.

### Modal / Drawer
Form transaksi memakai **drawer** dari kanan di layar lebar, dan lembar penuh di layar sempit. Alasannya: kamu sering memasukkan beberapa transaksi berturut-turut sambil melihat daftar — drawer membiarkan daftar tetap terlihat, modal menutupinya.

### EmptyState
Ikon, judul, satu kalimat penjelas, satu tombol utama, satu tautan sekunder opsional.

---

## 6. Layout

```
┌──────────┬──────────────────────────────────────────────┐
│          │  Topbar: judul · pencarian · tema · profil   │  64px
│ Sidebar  ├──────────────────────────────────────────────┤
│  240px   │                                              │
│          │  Konten — maks 1440px, padding 24px          │
│  (60px   │                                              │
│  saat    │                                              │
│  ciut)   │                                              │
└──────────┴──────────────────────────────────────────────┘
```

**Grid konten:** 12 kolom, jarak 20px.

**Breakpoint:**

| | Lebar | Perilaku |
|---|---|---|
| `sm` | < 640px | Sidebar jadi laci; KPI menumpuk; tabel jadi daftar kartu |
| `md` | 640–1024px | Sidebar ciut jadi ikon; KPI dua kolom |
| `lg` | 1024–1440px | Tata letak penuh |
| `xl` | > 1440px | Konten berhenti melebar, tetap di tengah |

Di `sm`, tabel transaksi **tidak** digulir menyamping — ia berubah jadi daftar kartu (ticker + broker di atas, nominal menonjol, sisanya sekunder). Tabel keuangan yang digulir menyamping di HP praktis tidak terpakai.

### Halaman

**Dashboard** — pertanyaan: *bagaimana keadaan portofolio saya?*
Baris KPI (Nilai portofolio `lg` · Modal · Unrealized · Realized YTD) → tren nilai portofolio (8 kolom) + donat komposisi (4 kolom) → posisi teratas (8) + transaksi terbaru (4).

**Transaksi** — pertanyaan: *apa saja yang sudah saya lakukan?*
Filter (broker, ticker, jenis, rentang tanggal) → tabel penuh → drawer form. Tombol tambah transaksi selalu terlihat.

**Posisi** — pertanyaan: *saya punya apa sekarang?*
Tab mode broker → tabel posisi (Ticker · Broker · Lot · Avg · Harga pasar · Nilai · Unrealized · %) → baris total.

**Rekonsiliasi** — pertanyaan: *apakah hitungan saya benar?*
Tabel banding seperti §4.5.

**Harga** — input harga pasar manual per ticker, dengan penanda kapan terakhir diperbarui. Penanda "kapan" itu penting: angka portofolio hanya sebaik harga terakhir yang kamu masukkan.

**Pengaturan** — tarif broker, tema, kerapatan tabel, muat/kosongkan data contoh, ekspor data.

---

## 7. Mode gelap

Bukan tempelan. Dua alasan ia layak dikerjakan sejak awal: kamu akan sering membuka aplikasi ini malam hari, dan ia jelas terlihat di portofolio.

Tiga keadaan yang harus ditangani — `data-theme="light"`, `data-theme="dark"`, dan **tidak ada penanda sama sekali** (mengikuti sistem). Definisikan seluruh token di `:root` polos, lalu timpa di `@media (prefers-color-scheme: dark)` **dan** di `[data-theme="dark"]`. Warna yang hanya ada di dalam salah satu blok itu adalah sumber bug "teks terang di atas latar terang".

Yang berubah di mode gelap, selain nilai token:

- **Hijau dan merah dinaikkan terangnya.** `#0F8A4D` tidak terbaca di atas `#161A21`. Gunakan `#34D18A` dan `#F08579`.
- **Bayangan diganti garis.** Pemisahan permukaan dikerjakan `--border`, bukan `--shadow`.
- **Isian grafik diturunkan opasitasnya** dari 18% ke sekitar 12% — gradien terang di atas latar gelap terlihat lebih "berat" daripada di mode terang.
- **Jangan pakai hitam murni.** `--n-950` (#0E1116) lebih nyaman dan membuat permukaan berlapis tetap terbaca.

---

## 8. Aksesibilitas

Ini bukan daftar formalitas — tiga hal pertama akan ditanyakan saat interview frontend.

- **Kontras** minimal 4.5:1 untuk teks, 3:1 untuk elemen antarmuka. Periksa `--text-muted` di kedua tema; ini yang paling sering gagal.
- **Fokus terlihat** di setiap elemen interaktif. Jangan `outline: none` tanpa pengganti.
- **Warna bukan satu-satunya penanda** — untung/rugi membawa tanda dan panah; galat form membawa ikon dan teks.
- Tabel memakai `<th scope="col">` yang benar. Ini yang membuat pembaca layar bisa menyebutkan nama kolom saat berpindah sel.
- Form: setiap input punya `<label>` sungguhan. Placeholder bukan label.
- Grafik punya `aria-label` yang meringkas isinya, dan datanya juga tersedia dalam bentuk tabel.
- Target sentuh minimal 44×44px di layar sempit.

---

## 9. Urutan pengerjaan

Selaras dengan `ROADMAP.md`:

| Fase | Yang dibangun |
|---|---|
| **1** | Token CSS, `Button`, `Input`, `Card`, kerangka layout |
| **3** | `DataTable`, `Badge`, `Drawer`, form transaksi, halaman Transaksi & Posisi |
| **4** | `StatCard`, `TrendPill`, `DonutChart`, `BarChart`, `AreaChart`, Dashboard |
| **5** | Keadaan kosong, data contoh, mode gelap, penghalusan responsif |

Bangun token lebih dulu, sebelum komponen pertama. Menyisipkan sistem token setelah dua puluh komponen memakai nilai warna langsung adalah pekerjaan sehari yang bisa dihindari sepenuhnya.

---

## 10. Referensi

Untuk terus mencari inspirasi, telusuri tag berikut di Dribbble — tapi ingat: yang kamu bangun adalah alat, sementara sebagian besar shot di sana adalah poster.

- [Financial Dashboard](https://dribbble.com/tags/financial_dashboard)
- [Portfolio Tracker](https://dribbble.com/tags/portfolio-tracker)
- [Investment Tracker](https://dribbble.com/tags/investment-tracker)
- [Stock Portfolio](https://dribbble.com/tags/stock-portfolio)
- [Finance Dark Mode](https://dribbble.com/tags/finance_dark_mode)

Referensi yang lebih berguna justru produk sungguhan yang dipakai orang tiap hari: Stockbit, Bibit, Ajaib, dan — untuk urusan tabel dan kerapatan — antarmuka Google Finance serta Yahoo Finance. Perhatikan bagaimana mereka menangani 200 baris, bukan 5.
