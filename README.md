# Budget Visualizer — Expense Tracker

Aplikasi pemantau keuangan (*expense tracker* & *budget visualizer*) modern berbasis *mobile-first* yang dibangun menggunakan HTML, CSS, dan Vanilla JavaScript murni — tanpa framework, tanpa backend, dan tanpa build tools.

**Demo Live:** [https://raafiprawiras.github.io/CodingCamp-6July26-raafiprawiras/](https://raafiprawiras.github.io/CodingCamp-6July26-raafiprawiras/)

---

## 🌟 Fitur Utama

- **Catat Transaksi Dinamis** — Catat transaksi Pemasukan (*Income*) dan Pengeluaran (*Expense*) dengan nama item, nominal uang, dan kategori.
- **Input Rupiah Real-time** — Kolom nominal secara otomatis memformat input angka menjadi format ribuan Rupiah dengan pemisah titik (misal: `1.500.000`) saat pengguna mengetik untuk menghindari kesalahan penulisan.
- **Kartu Ringkasan Finansial Premium** — Kartu sisa saldo (*Total Balance*), total pemasukan (*Total Income*), dan total pengeluaran (*Total Expenses*) yang dirancang dengan efek gradasi dan bayangan (*shadow glow*) premium.
- **Doughnut Chart Interaktif** — Visualisasi proporsi pengeluaran per kategori menggunakan Chart.js dengan potongan cincin modern (`cutout: '65%'`), segmentasi membulat, dan efek gradient dinamis.
- **Legenda Kustom yang Dapat Diekspansi** — Legenda chart menampilkan persentase serta jumlah nominal Rupiah. Jika kategori melebihi 4, sistem akan menampilkan tombol *Show More/Show Less* agar tampilan tetap rapi.
- **Sistem Kategori Terpisah & Dinamis** — Dropdown pilihan kategori berubah secara otomatis tergantung tipe transaksi yang dipilih (Income vs Expense). Custom category juga disimpan secara terpisah untuk masing-masing tipe.
- **Ikon Font Awesome Elegan** — Menggantikan emoji standar dengan pustaka ikon profesional **Font Awesome 6** yang digunakan pada aplikasi kelas expert.
- **Tema Gelap Ultra Deep** — Mendukung Dark Mode dengan warna latar belakang gelap pekat yang nyaman di mata, lengkap dengan mikro-animasi halus.
- **Penyimpanan Lokal (LocalStorage)** — Semua data transaksi, kategori kustom, pengurutan, dan preferensi tema tetap tersimpan aman walaupun halaman direfresh atau tab ditutup.

---

## 📂 Struktur Proyek

```
CodingCamp-6July26-raafiprawiras/
├── index.html        # App shell — Struktur HTML semantik, aksesibilitas ARIA, & template transaksi
├── css/
│   └── style.css     # Desain UI — Variabel CSS, tema gelap ultra deep, transisi & mikro-animasi
├── js/
│   └── script.js     # Logika aplikasi — State management, integrasi Chart.js, format rupiah, & LocalStorage
└── assets/           # Cadangan berkas statis di masa mendatang
```

Aplikasi ini menggunakan satu file HTML murni, satu file CSS, dan satu file JS. Tidak memerlukan bundler atau preprocessor tambahan.

---

## 🛠️ Spesifikasi Teknologi

| Bagian | Teknologi / Library |
|---|---|
| **Markup** | HTML5 Semantik |
| **Gaya / UI** | CSS Custom Properties, Flexbox, CSS Grid, Efek Glassmorphism |
| **Logika Utama** | Vanilla JavaScript (ES6+), IIFE Module Pattern |
| **Visualisasi Data** | [Chart.js 4.4.0](https://www.chartjs.org/) via CDN jsDelivr |
| **Ikonografi** | [Font Awesome 6.5.1](https://fontawesome.com/) via CDN cdnjs |
| **Penyimpanan** | `localStorage` API Web Native |
| **Hosting / Deploy** | GitHub Pages (Static Hosting) |

---

## 🚀 Cara Menjalankan secara Lokal

Proyek ini tidak memerlukan proses instalasi atau build. Cukup buka file `index.html` menggunakan browser modern pilihan Anda:

```bash
# Opsi 1 — Membuka langsung via sistem file
open index.html

# Opsi 2 — Menggunakan local server (Sangat direkomendasikan agar LocalStorage berjalan lancar)
npx serve .
# atau
python -m http.server 8080
```

Setelah server lokal berjalan, buka alamat `http://localhost:8080` pada browser Anda.

---

## 🌐 Proses Deployment (GitHub Pages)

Proyek ini di-deploy langsung melalui **GitHub Pages** menggunakan *root* dari branch `main`.

Untuk melakukan deployment pada fork Anda sendiri:
1. Hubungkan kode lokal Anda ke repositori GitHub.
2. Masuk ke halaman repositori di GitHub, lalu klik **Settings → Pages**.
3. Atur bagian **Source** menjadi `Deploy from a branch`.
4. Pilih **Branch:** `main` dan **Folder:** `/ (root)`.
5. Klik **Save** — GitHub akan otomatis membangun halaman di `https://<username>.github.io/<repo-name>/`.

---

## 👤 Pembuat

Dibuat sebagai tugas pengumpulan proyek untuk **Coding Camp** oleh **Raafi Prawiras** (Presented by Raafi PS).
