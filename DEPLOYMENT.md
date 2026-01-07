# Panduan Deployment - Ads Tracker

Dokumen ini menjelaskan langkah-langkah untuk menjalankan project Ads Tracker, baik di lingkungan pengembangan lokal maupun di server produksi (VPS).

## Prasyarat
- **Docker & Docker Compose** (Wajib untuk database atau menjalankan full container)
- **Node.js 20+** (Hanya jika ingin menjalankan aplikasi langsung di mesin host)
- **Git**

---

## 1. Setup Pengembangan Lokal (Dev Mode)

Ini adalah metode yang Anda gunakan sekarang: menjalankan database via Docker dan aplikasi via host.

### Langkah-langkah:

1. **Clone Repositori**:
   ```bash
   git clone <repository-url>
   cd ads-tracker
   ```

2. **Konfigurasi Environment**:
   Salin file `.env.example` menjadi `.env`:
   ```bash
   cp .env.example .env
   ```
   Buka file `.env` dan pastikan `DATABASE_URL` mengarah ke localhost:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@localhost:5432/ads_tracker?schema=public"
   ```

3. **Jalankan Database**:
   Gunakan Docker Compose untuk menjalankan PostgreSQL saja:
   ```bash
   docker compose up -d postgres
   ```

4. **Instal Dependensi**:
   ```bash
   npm install
   ```

5. **Setup Database (Prisma)**:
   Generate client, jalankan migrasi, dan masukkan data awal (seeding):
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

6. **Jalankan Aplikasi**:
   ```bash
   npm run dev
   ```
   Aplikasi akan tersedia di `http://localhost:3000`.

---

## 2. Deployment Produksi (VPS)

Untuk produksi, sangat direkomendasikan menggunakan Docker Compose sepenuhnya demi kemudahan manajemen dan isolasi.

### Langkah-langkah:

1. **Persiapkan Server**:
   Pastikan Docker dan Docker Compose sudah terinstal di VPS Anda.

2. **Konfigurasi Environment**:
   Buat atau salin file `.env` di server. Untuk Docker-ke-Docker, gunakan nama service database (`postgres`) sebagai host:
   ```env
   DATABASE_URL="postgresql://postgres:postgres@postgres:5432/ads_tracker?schema=public"
   NODE_ENV="production"
   ```

3. **Deploy Menggunakan Docker Compose**:
   Jalankan perintah berikut untuk membuild image dan menjalankan container di background:
   ```bash
   docker compose up -d --build
   ```

4. **Verifikasi**:
   Cek status container:
   ```bash
   docker compose ps
   ```
   Pastikan container `ads-tracker-web` dan `ads-tracker-db` dalam status *Up* atau *Healthy*.

---

## 3. Konfigurasi Penting

### Environment Variables (.env)

| Variabel | Deskripsi | Contoh |
|----------|-----------|---------|
| `DATABASE_URL` | URL koneksi ke PostgreSQL | `postgresql://user:pass@host:port/db` |
| `NODE_ENV` | Mode aplikasi (`development` atau `production`) | `production` |

### Database Seeding
Jika Anda perlu memasukkan data awal secara manual:
```bash
# Lokal
npx prisma db seed

# Docker (Produksi)
docker exec -it ads-tracker-web npx prisma db seed
```

---

## 4. Troubleshooting

- **Gagal Konek Database**: 
  - Pastikan container database sudah berjalan (`docker compose ps`).
  - Cek apakah port 5432 sudah digunakan oleh aplikasi lain di host.
- **Prisma Error**: 
  - Jalankan `npx prisma generate` setiap kali ada perubahan pada file `schema.prisma`.
  - Pastikan `DATABASE_URL` sudah benar di file `.env`.
- **Sync Meta Gagal**:
  - Pastikan `Access Token` yang dimasukkan di UI valid dan memiliki izin `ads_read` atau `ads_management`.

---

## 5. Setup Auto-Sync (Cron Job)

Agar data selalu update dan mencakup 30 hari terakhir (Smart Sync), pasang cron job di server VPS (host) untuk memanggil API sync secara berkala.

1. **Buka crontab**:
   ```bash
   crontab -e
   ```

2. **Tambahkan baris berikut** (Contoh: jalan setiap 6 jam):
   ```cron
   # Sync Smart (30 hari terakhir) setiap 6 jam
   0 */6 * * * curl -X POST "http://localhost:3000/api/sync?mode=smart"
   ```
   *Pastikan URL `http://localhost:3000` sesuai dengan port aplikasi Anda di VPS.*

3. **Simpan dan keluar**.

