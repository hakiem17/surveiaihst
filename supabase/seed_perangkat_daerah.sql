-- =====================================================================
-- Seed Data Master Perangkat Daerah & Kecamatan — Pemkab Hulu Sungai Tengah
-- Total 39 Unit Kerja / Instansi Resmi Tahun 2026
-- Jalankan di: Supabase Dashboard → SQL Editor → Run
-- Aman dijalankan berulang kali (Idempotent via ON CONFLICT)
-- =====================================================================

insert into public.perangkat_daerah (kode, nama, kelompok, jumlah_pegawai, urutan, aktif)
values
  ('SETDA', 'Sekretariat Daerah', 'Sekretariat', null, 1, true),
  ('SETWAN', 'Sekretariat Dewan Perwakilan Rakyat Daerah', 'Sekretariat', null, 2, true),
  ('INSP', 'Inspektorat', 'Inspektorat', null, 3, true),
  ('BAPPERIDA', 'Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah', 'Badan', null, 4, true),
  ('BKPSDMD', 'Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Daerah', 'Badan', null, 5, true),
  ('BPKPD', 'Badan Pengelola Keuangan dan Pendapatan Daerah', 'Badan', null, 6, true),
  ('BAKESBANGPOL', 'Badan Kesatuan Bangsa dan Politik', 'Badan', null, 7, true),
  ('BPBD_DAMKAR', 'Badan Penanggulangan Bencana Daerah dan Pemadam Kebakaran', 'Badan', null, 8, true),
  ('DISDIK', 'Dinas Pendidikan', 'Dinas', null, 9, true),
  ('DISPORABUDPAREKRAF', 'Dinas Pemuda Olahraga, Kebudayaan, Pariwisata dan Ekonomi Kreatif', 'Dinas', null, 10, true),
  ('DINKES', 'Dinas Kesehatan', 'Dinas', null, 11, true),
  ('DINSOS_PPKB_PPPA', 'Dinas Sosial, Pengendalian Penduduk, Keluarga Berencana, Pemberdayaan Perempuan dan Perlindungan Anak', 'Dinas', null, 12, true),
  ('DISDUKCAPIL', 'Dinas Kependudukan, dan Pencatatan Sipil', 'Dinas', null, 13, true),
  ('DPMD', 'Dinas Pemberdayaan Masyarakat dan Desa', 'Dinas', null, 14, true),
  ('SATPOLPP', 'Satuan Polisi Pamong Praja', 'Dinas', null, 15, true),
  ('DPMPTSP', 'Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu', 'Dinas', null, 16, true),
  ('DISDAG', 'Dinas Perdagangan', 'Dinas', null, 17, true),
  ('DISPERINKOP_UKM', 'Dinas Perindustrian, Tenaga Kerja, Koperasi dan Usaha Mikro Kecil dan Menengah', 'Dinas', null, 18, true),
  ('DISKOMINFO_SP', 'Dinas Komunikasi, Informatika, Statistik dan Persandian', 'Dinas', null, 19, true),
  ('DPUPR', 'Dinas Pekerjaan Umum dan Penataan Ruang', 'Dinas', null, 20, true),
  ('DISPERKIMTAN', 'Dinas Perumahan Rakyat, Kawasan Pemukiman dan Pertanahan', 'Dinas', null, 21, true),
  ('DISTAN', 'Dinas Pertanian', 'Dinas', null, 22, true),
  ('DKPP', 'Dinas Ketahanan Pangan dan Perikanan', 'Dinas', null, 23, true),
  ('DLH', 'Dinas Lingkungan Hidup', 'Dinas', null, 24, true),
  ('DISHUB', 'Dinas Perhubungan', 'Dinas', null, 25, true),
  ('DISPERSIP', 'Dinas Perpustakaan dan Kearsipan', 'Dinas', null, 26, true),
  ('KEC_BRB', 'Kecamatan Barabai', 'Kecamatan', null, 27, true),
  ('KEC_BB', 'Kecamatan Batu Benawa', 'Kecamatan', null, 28, true),
  ('KEC_HTK', 'Kecamatan Hantakan', 'Kecamatan', null, 29, true),
  ('KEC_BAS', 'Kecamatan Batang Alai Selatan', 'Kecamatan', null, 30, true),
  ('KEC_LMS', 'Kecamatan Limpasu', 'Kecamatan', null, 31, true),
  ('KEC_BAT', 'Kecamatan Batang Alai Timur', 'Kecamatan', null, 32, true),
  ('KEC_BAU', 'Kecamatan Batang Alai Utara', 'Kecamatan', null, 33, true),
  ('KEC_PDW', 'Kecamatan Pandawan', 'Kecamatan', null, 34, true),
  ('KEC_LAU', 'Kecamatan Labuan Amas Utara', 'Kecamatan', null, 35, true),
  ('KEC_LAS', 'Kecamatan Labuan Amas Selatan', 'Kecamatan', null, 36, true),
  ('KEC_HRY', 'Kecamatan Haruyan', 'Kecamatan', null, 37, true),
  ('RSUD_DAMANHURI', 'RSUD Damanhuri', 'UPT', null, 38, true),
  ('BPS_HST', 'Badan Pusat Statistik', 'Lainnya', null, 39, true)
on conflict (nama) do update
set
  kode = excluded.kode,
  kelompok = excluded.kelompok,
  jumlah_pegawai = excluded.jumlah_pegawai,
  urutan = excluded.urutan,
  aktif = excluded.aktif,
  updated_at = now();

-- Cek hasil seeding per kelompok
select kelompok, count(*) as jumlah_instansi
from public.perangkat_daerah
where aktif = true
group by kelompok
order by count(*) desc;
