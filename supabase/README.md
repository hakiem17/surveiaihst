# Panduan Konfigurasi Database Supabase
## Survei Pemanfaatan AI Pemkab Hulu Sungai Tengah 2026

Dokumen ini berisi panduan teknis langkah demi langkah untuk menyiapkan database PostgreSQL di Supabase bagi Tim IT / Diskominfo SP Kabupaten Hulu Sungai Tengah.

---

### Struktur Berkas SQL

1. [`schema.sql`](file:///Users/ahmadhakim/kimqy/surveiai/supabase/schema.sql)
   - Tabel DDL (`perangkat_daerah`, `admins`, `responses`, `responses_audit`, `survey_settings`)
   - Indeks performa (B-tree & GIN untuk pencarian array `c2`, `c4`, `d1`, `f1`)
   - Triggers audit otomatis untuk kepatuhan UU PDP & KAK N.3
   - View analitik otomatis:
     - `v_responses_flat`: Data responden lengkap dengan skor indeks komposit ILA, IKID, IP, IS, dan deteksi data sensitif.
     - `v_opd_participation`: Monitoring progres keterisian responden per Perangkat Daerah vs target pegawai.
     - `v_indicator_summary`: Matriks nilai otomatis 16 Indikator KAK (I-01 s/d I-16).
   - Stored Procedure / RPC (`public_stats`, `register_admin_by_email`, `is_admin`)
   - Row Level Security (RLS) & Kebijakan Hak Akses.

2. [`seed_perangkat_daerah.sql`](file:///Users/ahmadhakim/kimqy/surveiai/supabase/seed_perangkat_daerah.sql)
   - Master data 36 Perangkat Daerah & Kecamatan se-Kabupaten Hulu Sungai Tengah lengkap dengan kelompok unit kerja dan perkiraan jumlah pegawai.

3. [`seed_admin_example.sql`](file:///Users/ahmadhakim/kimqy/surveiai/supabase/seed_admin_example.sql)
   - Script SQL untuk mendaftarkan akun administrator dashboard yang telah dibuat di menu Authentication Supabase.

---

### Langkah Setup Supabase (5 Menit)

#### Langkah 1: Buat Proyek Baru di Supabase
1. Masuk ke [supabase.com](https://supabase.com) dan buat proyek baru (pilih region terdekat, misal: *Singapore*).
2. Simpan kata sandi database.

#### Langkah 2: Eksekusi `schema.sql`
1. Buka menu **SQL Editor** pada bilah kiri dasbor Supabase.
2. Klik **New Query**.
3. Salin seluruh isi berkas [`supabase/schema.sql`](file:///Users/ahmadhakim/kimqy/surveiai/supabase/schema.sql), tempel ke editor, lalu klik **Run**.
4. Pastikan muncul pesan `Success. No rows returned`.

#### Langkah 3: Eksekusi `seed_perangkat_daerah.sql`
1. Masih di **SQL Editor**, buka query baru.
2. Salin seluruh isi berkas [`supabase/seed_perangkat_daerah.sql`](file:///Users/ahmadhakim/kimqy/surveiai/supabase/seed_perangkat_daerah.sql), tempel, lalu klik **Run**.
3. Hasil query akan menampilkan rekap 36 Perangkat Daerah yang berhasil tersimpan.

#### Langkah 4: Buat Akun Admin Dashboard
1. Buka menu **Authentication → Users → Add user → Create user**.
2. Masukkan email dinas admin (contoh: `admin@hulusungaitengahkab.go.id`) dan kata sandi yang aman.
3. Centang opsi *Auto Confirm User*.
4. Buka **SQL Editor**, jalankan script pendaftaran admin:
   ```sql
   select public.register_admin_by_email(
     'admin@hulusungaitengahkab.go.id',
     'Tim Analis Diskominfo SP',
     'superadmin'
   );
   ```

#### Langkah 5: Sambungkan Kredensial ke Aplikasi
Buka menu **Project Settings → API** di Supabase, lalu salin kunci ke berkas `.env.local` di folder aplikasi:

```env
# URL Project Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxxxxxxxxx.supabase.co

# Anon Public Key (Aman untuk frontend)
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Service Role Secret Key (Hanya untuk server backend)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

Setelah `.env.local` terisi, aplikasi Next.js akan langsung otomatis beralih dari mode *Simulasi/Demo* ke mode *Supabase Live DB* tanpa perlu mengubah baris kode apa pun!
