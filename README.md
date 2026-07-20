# 🏃‍♂️ IPWIJARUN 2026 - Sistem Tiket & Manajemen Pendaftaran Lari

[![Docker](https://img.shields.io/badge/Docker-Enabled-blue.svg?logo=docker&logoColor=white)](https://www.docker.com/)
[![Node.js](https://img.shields.io/badge/Node.js-v18.x-green.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express-v4.19.2-lightgrey.svg?logo=express&logoColor=white)](https://expressjs.com/)
[![License: ISC](https://img.shields.io/badge/License-ISC-yellow.svg)](https://opensource.org/licenses/ISC)

Sistem Informasi Tiket & Manajemen Pendaftaran untuk Event Lari **IPWIJARUN 2026**. Aplikasi ini dirancang agar dapat bekerja dalam dua mode secara dinamis (**Online** berbasis Server & Docker, serta **Offline** berbasis Browser LocalStorage).

---

## ✨ Fitur Utama

### 1. Portal Peserta (`index.html`)
* **Registrasi Multi-Step**: Formulir pendaftaran interaktif (5K, 10K, 21K), pemilihan ukuran jersey, serta fitur tambahan (ukir nama pada medali).
* **Simulasi Pembayaran & Penerbitan E-Ticket**: Proses checkout interaktif yang menghasilkan nomor BIB, ID Tiket unik, dan QR Code otomatis.
* **Dashboard "Tiket Saya"**: Fitur pencarian tiket berdasarkan BIB/ID Tiket untuk melihat kembali e-ticket, serta integrasi **Web Share API** untuk membagikan tautan e-ticket secara instan.

### 2. Portal Admin (`admin.html`)
* **Dashboard Statistik Real-Time**: Analisis total pendaftar, total pendapatan, statistik ukuran jersey, dan kuota tersisa.
* **Kelola Database**: Cari/filter data peserta secara instan.
* **Batal Registrasi**: Hapus pendaftar langsung dari database dengan sinkronisasi otomatis.
* **Ekspor Data**: Fitur unduh database peserta langsung ke berkas `.csv`.

### 3. Dual-Mode Dinamis (Online & Offline)
* **Online Mode (Server)**: Jika diakses melalui server lokal atau Docker (`http://localhost:3005`), aplikasi secara otomatis akan menyimpan data di server (`database.json`) melalui REST API.
* **Offline Mode (Standalone)**: Jika file `index.html` diklik langsung via browser (`file://`), aplikasi akan berjalan sepenuhnya tanpa server dengan menggunakan **LocalStorage** & **SessionStorage**.

---

## 🛠️ Persyaratan Sistem

* **Docker Desktop** (Sangat direkomendasikan untuk instalasi cepat)
* **Node.js v18.x atau lebih tinggi** (Jika ingin dijalankan secara manual di lokal)

---

## 🚀 Cara Menjalankan Aplikasi

### Cara 1: Menggunakan Docker Desktop & Installer (Paling Instan)
Kami telah menyediakan berkas `installer.bat` untuk mempermudah instalasi otomatis.
1. Pastikan **Docker Desktop** sudah terpasang.
2. Klik ganda (Double-Click) pada berkas **`installer.bat`** di direktori utama.
3. Skrip akan secara otomatis:
   * Memeriksa dan membuka Docker Desktop jika belum aktif.
   * Menjalankan container dengan `docker compose up -d --build`.
   * Membuka web browser ke alamat **`http://localhost:3005`** secara otomatis.

### Cara 2: Menjalankan Manual dengan Node.js
Jika Anda ingin menjalankan server Express secara lokal tanpa Docker:
1. Buka terminal di folder ini dan instal dependensi:
   ```bash
   npm install
   ```
2. Jalankan server backend:
   ```bash
   npm start
   ```
3. Buka peramban (browser) dan akses **`http://localhost:3000`** (untuk portal peserta) atau **`http://localhost:3000/admin.html`** (untuk portal admin).

### Cara 3: Menjalankan Secara Offline (Tanpa Server)
Cukup klik ganda pada berkas **`index.html`** untuk langsung masuk ke Portal Peserta atau **`admin.html`** untuk Portal Admin. Data akan disimpan di browser Anda masing-masing.

---

## 📁 Struktur Berkas Utama

```text
├── index.html          # Halaman utama Portal Peserta
├── admin.html          # Halaman Portal Admin
├── app.js              # Logika frontend Portal Peserta (Registrasi & Tiket)
├── admin.js            # Logika frontend Portal Admin (Statistik & Kelola)
├── style.css           # Desain antarmuka (Vanilla CSS)
├── server.js           # REST API Server berbasis Express.js
├── database.json       # Penyimpanan database lokal di sisi server
├── Dockerfile          # Konfigurasi containerization Node.js
├── docker-compose.yml  # Konfigurasi port forwarding (Port 3005:3000) & Volume database
├── installer.bat       # Skrip batch otomatis untuk memeriksa Docker & menjalankan container
├── .gitignore          # Daftar file yang diabaikan oleh Git
└── README.md           # Dokumentasi sistem ini
```

---

## 📊 Alur & Logika Program
Penjelasan detail mengenai pseudocode, logika flowchart (Mermaid diagram) untuk alur registrasi peserta, autentikasi BIB, serta dashboard admin dapat Anda temukan pada dokumen pendukung **[diagram_dan_pseudocode.md](diagram_dan_pseudocode.md)**.
