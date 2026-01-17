# Panduan Deployment - Ads Tracker

Dokumen ini menjelaskan langkah-langkah untuk menjalankan project Ads Tracker, baik di lingkungan pengembangan lokal maupun di server produksi (VPS).

## Prasyarat
- **Docker & Docker Compose** (Wajib untuk database atau menjalankan full container)
- **Node.js 20.19+** (Hanya jika ingin menjalankan aplikasi langsung di mesin host; required oleh Prisma v7)
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
   DATABASE_URL="postgresql://postgres:postgres@localhost:5433/ads_tracker?schema=public"
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
   Generate client dan jalankan migrasi:
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

   Catatan: container `web` menjalankan `npx prisma migrate deploy` saat startup (lihat `docker-entrypoint.sh`), jadi migrasi DB akan diaplikasikan otomatis sebelum app mulai.

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

### Bootstrap Admin User
Saat startup container `web`, sistem akan memastikan admin user ada (idempotent) via `migrate.js`.

Untuk mengatur kredensial admin:
- Set `ADMIN_EMAIL` dan `ADMIN_PASSWORD` di `.env`
- Restart container `web`:
   ```bash
   docker compose up -d --no-deps web
   ```

---

## 4. Troubleshooting

- **Gagal Konek Database**: 
  - Pastikan container database sudah berjalan (`docker compose ps`).
   - Cek apakah port 5433 sudah digunakan oleh aplikasi lain di host.
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

---

## 6. Update / Upgrade Server (Runbook)

Langkah ini untuk server yang **sudah berjalan** dan ingin di-update ke versi terbaru dengan aman.

1. **Cek status**:
   ```bash
   docker compose ps
   ```

2. **(Disarankan) Backup database**:
   ```bash
   docker exec ads-tracker-db pg_dump -U postgres -d ads_tracker | gzip > ~/ads_tracker_backup_$(date +%Y%m%d_%H%M%S).sql.gz
   ```

3. **Update source code**:
   ```bash
   git fetch --all
   git checkout main
   git pull
   ```

4. **Build image terbaru** (tanpa restart dulu untuk minim downtime):
   ```bash
   docker compose build web
   ```

5. **Jalankan migrasi Prisma** (fail-fast sebelum restart web):
   ```bash
   docker compose run --rm web npx prisma migrate deploy
   ```

6. **Restart web**:
   ```bash
   docker compose up -d --no-deps web
   docker compose logs -f web
   ```

7. **Verifikasi**:
   ```bash
   curl -I http://localhost:3000/
   docker compose exec web npx prisma migrate status
   ```

### Rollback cepat

- **Rollback code**:
  ```bash
  git reset --hard <commit-sebelumnya>
  docker compose up -d --build --no-deps web
  ```

- **Rollback DB (restore backup)**:
  ```bash
  docker compose stop web
  gunzip -c ~/ads_tracker_backup_*.sql.gz | docker exec -i ads-tracker-db psql -U postgres -d ads_tracker
  docker compose up -d
  ```

---

## 7. Restore Database dari SQL Dump (Baseline Prisma)

Jika Anda melakukan restore dari file `.sql` hasil `pg_dump` (full schema + data), database akan menjadi **tidak kosong**.
Pada kondisi ini, `npx prisma migrate deploy` bisa gagal dengan error `P3005` karena Prisma belum punya baseline `_prisma_migrations`.

Solusinya: restore dulu, lalu **baseline** migrations Prisma (mark as applied).

### A) Restore (fresh volume)

Jika DB masih disposable dan Anda ingin overwrite total:

```bash
docker compose stop web
docker compose down -v --remove-orphans
docker compose up -d postgres

# restore (fail-fast)
cat backups/your_dump.sql | docker exec -i ads-tracker-db psql -v ON_ERROR_STOP=1 -U postgres -d ads_tracker
```

### B) Restore (tanpa hapus volume)

```bash
docker compose stop web
cat backups/your_dump.sql | docker exec -i ads-tracker-db psql -v ON_ERROR_STOP=1 -U postgres -d ads_tracker
```

### C) Baseline Prisma migrations

Jika Anda memakai versi repo yang sudah di-squash, cukup mark migration init berikut sebagai applied:

```bash
docker compose run --rm web npx prisma migrate resolve --applied 20260117000000_init
```

Lalu start web lagi dan verifikasi:

```bash
docker compose up -d web
docker compose exec web npx prisma migrate status
```

### Catatan penting: dump tercampur log `pg_dump:`

Jika file dump Anda berisi baris seperti `pg_dump: reading ...` di dalam `.sql`, restore bisa error/corrupt.

- Saat membuat dump, hindari menggabungkan stderr ke stdout (jangan pakai `2>&1`), atau jangan pakai `--verbose`.
- Jika dump terlanjur tercampur, Anda bisa “bersihkan” dengan menghapus baris yang diawali `pg_dump:`:

```bash
sed -E '/^[[:space:]]*pg_dump:/d' backups/your_dump.sql > backups/your_dump.clean.sql
```

Lalu restore menggunakan file `*.clean.sql`.

