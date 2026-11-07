# Panduan Deployment MechMatrix Engineering ke Vercel (vercel.app)

Aplikasi **MechMatrix Engineering** telah dikonfigurasi penuh untuk berjalan di **Vercel** (`https://[nama-proyek-anda].vercel.app`) baik sebagai antarmuka Single Page Application (SPA Vite) maupun dengan Serverless Functions untuk API backend.

---

## 🚀 Cara 1: Deploy Otomatis via GitHub (Paling Direkomendasikan)

1. **Push kode aplikasi ke GitHub**:
   - Buat repositori baru di GitHub (misal: `mechmatrix-engineering`).
   - Push seluruh file proyek ke repositori tersebut.

2. **Buka Vercel Dashboard**:
   - Kunjungi [https://vercel.com/new](https://vercel.com/new) dan login dengan akun GitHub Anda.
   - Klik **"Import"** pada repositori `mechmatrix-engineering`.

3. **Verifikasi Konfigurasi Project**:
   - **Framework Preset**: `Vite` (Vercel akan otomatis mendeteksinya via `vercel.json`).
   - **Root Directory**: `./` (default).
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Tambahkan Environment Variables (Opsional / Dianjurkan)**:
   Di menu **Environment Variables**, tambahkan:
   - `GEMINI_API_KEY`: *(Kunci API Gemini jika ingin mengaktifkan pembuatan laporan IDP berbasis AI)*
   - Firebase sudah terkonfigurasi otomatis melalui file `src/firebase.ts` dan `firebase-applet-config.json` bawaan project.

5. **Klik "Deploy"**:
   - Vercel akan meng-compile aplikasi dalam hitungan detik.
   - Setelah selesai, aplikasi Anda langsung aktif di domain: `https://[nama-proyek].vercel.app`.

---

## ⚡ Cara 2: Deploy Langsung via Vercel CLI (Terminal)

Jika Anda memiliki terminal di komputer lokal:

```bash
# 1. Pasang Vercel CLI secara global
npm install -g vercel

# 2. Login ke akun Vercel
vercel login

# 3. Jalankan perintah deploy di folder project
vercel

# Ikuti petunjuk di terminal:
# - Set up and deploy? [Y]
# - Which scope? [Pilih akun Anda]
# - Link to existing project? [N]
# - Project name? [mechmatrix-engineering]
# - In which directory is your code located? [./]
#
# Untuk deploy versi production:
vercel --prod
```

---

## ⚙️ Berkas Konfigurasi Vercel yang Telah Disiapkan

1. **`vercel.json`**:
   - Mengatur routing SPA (`/(.*) -> /index.html`) agar tidak terjadi error 404 saat navigasi atau reload halaman.
   - Mengarahkan endpoint `/api/*` ke Vercel Serverless Function (`api/index.js`).
   - Caching otomatis aset statis untuk performa tinggi.
2. **`api/index.js`**:
   - Adapter Serverless murni JavaScript ES Module (ringan, tanpa error kompilasi TypeScript atau dependensi dev-server Vite) untuk menjalankan endpoint `/api/health`, `/api/sql/*`, dan `/api/generate-ai-report` di infrastruktur Vercel Serverless.
3. **`.npmrc`**:
   - Menambahkan `legacy-peer-deps=true` untuk mencegah `npm error code ERESOLVE` saat resolusi dependensi peer di Vercel.
4. **`package-lock.json`**:
   - Telah dibuat dan dikunci sehingga Vercel menggunakan versi paket yang stabil dan konsisten.
5. **`.vercelignore`**:
   - Mengabaikan `node_modules`, log, dan file temporer agar proses build ringan dan cepat.

---

## 🌐 Fitur yang Berjalan Setelah Online di Vercel

- ✅ **Google Firebase Firestore**: Real-time sync dan database cloud berjalan 100% langsung di browser pengguna.
- ✅ **Ekspor Google Apps Script & Sheets**: Tetap dapat disalin dan diintegrasikan ke Google Sheets.
- ✅ **Database SQL Relasional**: Tetap dapat diakses melalui SQL Console dan generator skrip DDL master `mechmatrix_engineering.sql`.
- ✅ **Mode Akses Otorisasi**: Proteksi sandi Viewer, Supervisor, dan Manager tetap aktif.
