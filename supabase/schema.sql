-- =====================================================================
-- Survei Pemanfaatan AI Pemkab Hulu Sungai Tengah 2026 — Skema Supabase
-- Versi Lengkap (DDL, Indexing, Triggers, Views Analitik, RLS, & Helper RPC)
-- Jalankan seluruh script ini di: Supabase Dashboard → SQL Editor → Run.
-- Aman dijalankan berulang kali (Idempotent).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 0. EXTENSIONS
-- ---------------------------------------------------------------------
create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------
-- 1. TABEL PENGATURAN SURVEI (Survey Settings)
-- ---------------------------------------------------------------------
create table if not exists public.survey_settings (
  id          serial primary key,
  key         text not null unique,
  value       text not null,
  description text,
  updated_at  timestamptz not null default now()
);

-- Nilai awal konfigurasi survei
insert into public.survey_settings (key, value, description) values
  ('periode', '2026', 'Tahun periode survei'),
  ('status', 'open', 'Status pembukaan survei: open | closed | preview'),
  ('target_responden', '300', 'Target minimal responden ASN Pemkab HST'),
  ('judul', 'Survei Pemanfaatan Artificial Intelligence (AI) Pemkab HST 2026', 'Judul resmi survei')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 2. TABEL MASTER PERANGKAT DAERAH (A1)
-- ---------------------------------------------------------------------
create table if not exists public.perangkat_daerah (
  id              serial primary key,
  kode            text unique,
  nama            text not null unique,
  -- Kelompok untuk tabulasi KAK Lampiran 4: Sekretariat, Dinas, Badan, Inspektorat, Kecamatan, UPT, Lainnya
  kelompok        text not null check (kelompok in ('Sekretariat','Dinas','Badan','Inspektorat','Kecamatan','UPT','Lainnya')),
  -- Jumlah pegawai menurut data kepegawaian (BKPSDMD/SIASN) untuk target partisipasi
  jumlah_pegawai  integer check (jumlah_pegawai is null or jumlah_pegawai >= 0),
  urutan          integer not null default 0,
  aktif           boolean not null default true,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists pd_urutan_idx on public.perangkat_daerah (urutan);
create index if not exists pd_kelompok_idx on public.perangkat_daerah (kelompok);

-- ---------------------------------------------------------------------
-- 3. TABEL ADMIN DASHBOARD (Auth Mapping)
-- ---------------------------------------------------------------------
create table if not exists public.admins (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  email      text,
  nama       text,
  role       text not null default 'analyst' check (role in ('superadmin','analyst','viewer')),
  created_at timestamptz not null default now()
);

-- Fungsi verifikasi status admin untuk RLS
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;

-- ---------------------------------------------------------------------
-- 4. TABEL JAWABAN RESPONDEN (Responses)
-- Anonim: Bebas identitas pribadi (tanpa Nama, NIP, NIK, No. HP, atau IP Address)
-- ---------------------------------------------------------------------
create table if not exists public.responses (
  id                 uuid primary key default gen_random_uuid(),
  created_at         timestamptz not null default now(),
  periode            smallint not null default 2026,
  -- ID acak perangkat (fingerprint pseudo-anonymous) untuk mencegah pengisian berulang
  device_id          text not null check (char_length(device_id) between 10 and 64),
  consent            boolean not null,
  started_at         timestamptz,
  duration_sec       integer check (duration_sec is null or duration_sec >= 0),
  flag_fast          boolean not null default false, -- durasi < 120 detik (indikasi tidak cermat)
  flag_straightline  boolean not null default false, -- pola jawaban Likert seragam

  -- SEKSI A: Data Demografi & Profil ASN
  a1_pd_id  integer references public.perangkat_daerah(id) on delete restrict,
  a2        text check (a2 is null or a2 in ('kebijakan','teknis','pelaksana')),
  a3        text check (a3 is null or a3 in ('pns','pppk','pppk_pw','non_asn','lainnya')),
  a3_lain   text check (a3_lain is null or char_length(a3_lain) <= 100),
  a4        text check (a4 is null or a4 in ('20_30','31_40','41_50','50_plus')),
  a5        text check (a5 is null or a5 in ('L','P')),

  -- SEKSI B: Tingkat Pengetahuan & Persepsi Pegawai
  b1    smallint check (b1 is null or b1 between 1 and 5),
  b2_1  text check (b2_1 is null or b2_1 in ('benar','salah','tidak_tahu')),
  b2_2  text check (b2_2 is null or b2_2 in ('benar','salah','tidak_tahu')),
  b2_3  text check (b2_3 is null or b2_3 in ('benar','salah','tidak_tahu')),
  b2_4  text check (b2_4 is null or b2_4 in ('benar','salah','tidak_tahu')),
  b3_1  smallint check (b3_1 is null or b3_1 between 1 and 5),
  b3_2  smallint check (b3_2 is null or b3_2 between 1 and 5),
  b3_3  smallint check (b3_3 is null or b3_3 between 1 and 5),
  b3_4  smallint check (b3_4 is null or b3_4 between 1 and 5),

  -- SEKSI C: Pola Penggunaan AI di Lingkungan Kerja
  c1       text check (c1 is null or c1 in ('harian','mingguan','bulanan','jarang','belum')),
  c2       text[],
  c2_lain  text check (c2_lain is null or char_length(c2_lain) <= 100),
  c2a      text,
  c3       text check (c3 is null or c3 in ('gratis','berbayar','instansi','campuran')),
  c4       text[],
  c4_lain  text check (c4_lain is null or char_length(c4_lain) <= 100),
  c5       smallint check (c5 is null or c5 between 1 and 5),
  c6       smallint check (c6 is null or c6 between 1 and 5),
  c7       text[] check (c7 is null or cardinality(c7) <= 3),
  c7_lain  text check (c7_lain is null or char_length(c7_lain) <= 100),

  -- SEKSI D: Keamanan Informasi, PDP, & Etika
  d1  text[],
  d2  text check (d2 is null or d2 in ('selalu','sering','kadang','tidak_pernah')),

  -- SEKSI E: Kesiapan Infrastruktur & Regulasi
  e1  smallint check (e1 is null or e1 between 1 and 5),
  e2  smallint check (e2 is null or e2 between 1 and 5),
  e3  text check (e3 is null or e3 in ('terpusat','tersebar','fisik','tidak_tahu')),
  e4  text check (e4 is null or e4 in ('ada_sosialisasi','ada_belum','belum_ada','tidak_tahu')),
  e5  text check (e5 is null or e5 in ('instansi','mandiri','tidak_pernah')),

  -- SEKSI F: Hambatan & Kebutuhan Pengembangan Kapasitas
  f1       text[] check (f1 is null or cardinality(f1) <= 3),
  f1_lain  text check (f1_lain is null or char_length(f1_lain) <= 100),
  f2_1     smallint check (f2_1 is null or f2_1 between 1 and 5),
  f2_2     smallint check (f2_2 is null or f2_2 between 1 and 5),
  f2_3     smallint check (f2_3 is null or f2_3 between 1 and 5),
  f2_4     smallint check (f2_4 is null or f2_4 between 1 and 5),
  f3       text check (f3 is null or f3 in ('bersedia','ragu','tidak')),
  f4       text check (f4 is null or char_length(f4) <= 500),

  constraint responses_one_per_device unique (periode, device_id)
);

-- ---------------------------------------------------------------------
-- 5. INDEXING UNTUK EFISIENSI QUERY & ANALITIK
-- ---------------------------------------------------------------------
create index if not exists responses_periode_idx on public.responses (periode);
create index if not exists responses_pd_idx on public.responses (a1_pd_id);
create index if not exists responses_created_at_idx on public.responses (created_at desc);
create index if not exists responses_c1_idx on public.responses (c1);
create index if not exists responses_a2_idx on public.responses (a2);
create index if not exists responses_consent_idx on public.responses (consent);

-- GIN Indexes untuk query array cepat (PostgreSQL array containment & overlap)
create index if not exists responses_c2_gin on public.responses using gin (c2);
create index if not exists responses_c4_gin on public.responses using gin (c4);
create index if not exists responses_d1_gin on public.responses using gin (d1);
create index if not exists responses_f1_gin on public.responses using gin (f1);

-- ---------------------------------------------------------------------
-- 6. AUDIT TRAIL LOGGING (Kepatuhan PDP & KAK N.3)
-- ---------------------------------------------------------------------
create table if not exists public.responses_audit (
  id          bigserial primary key,
  response_id uuid not null,
  action      text not null, -- INSERT, UPDATE, DELETE
  changed_by  uuid,
  changed_at  timestamptz not null default now(),
  old_data    jsonb,
  new_data    jsonb
);

create or replace function public.audit_responses()
returns trigger
language plpgsql security definer
set search_path = public
as $$
begin
  insert into public.responses_audit (response_id, action, changed_by, old_data, new_data)
  values (
    coalesce(old.id, new.id),
    tg_op,
    auth.uid(),
    case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) end,
    case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) end
  );
  return coalesce(new, old);
end;
$$;

drop trigger if exists responses_audit_trg on public.responses;
create trigger responses_audit_trg
  after update or delete on public.responses
  for each row execute function public.audit_responses();

-- ---------------------------------------------------------------------
-- 7. VIEW ANALITIK & TABULASI OTOMATIS
-- ---------------------------------------------------------------------

-- View 1: Data Responden Flat dengan Skor Indeks Komposit Terhitung (Lampiran 2)
create or replace view public.v_responses_flat as
select
  r.id,
  r.created_at,
  r.periode,
  r.consent,
  r.duration_sec,
  r.flag_fast,
  r.flag_straightline,
  pd.nama as perangkat_daerah,
  pd.kelompok as kelompok_pd,
  case r.a2
    when 'kebijakan' then '1. Jabatan Pimpinan Tinggi / Administrator / Pengawas'
    when 'teknis' then '2. Jabatan Fungsional Tertentu (JFT)'
    when 'pelaksana' then '3. Jabatan Pelaksana / Staf Administrasi / Teknis'
    else r.a2
  end as klaster_jabatan,
  r.a3 as status_kepegawaian,
  r.a4 as rentang_usia,
  r.a5 as jenis_kelamin,
  r.c1 as frekuensi_penggunaan_ai,
  case when r.c1 is not null and r.c1 != 'belum' then true else false end as is_ai_user,
  case when r.c1 in ('harian','mingguan') then true else false end as is_routine_user,
  r.c2a as platform_ai_utama,

  -- Indeks Pengetahuan AI (IP) - Skor 0-100
  round(
    ((case when r.b2_1 = 'salah' then 1 else 0 end +
      case when r.b2_2 = 'benar' then 1 else 0 end +
      case when r.b2_3 = 'salah' then 1 else 0 end +
      case when r.b2_4 = 'benar' then 1 else 0 end)::numeric / 4.0) * 100, 1
  ) as skor_ip,

  -- Pemahaman Diri (PD) - Skor 0-100
  case when r.b1 between 1 and 5 then round(((r.b1 - 1)::numeric / 4.0) * 100, 1) else null end as skor_pd,

  -- Indeks Sikap Positif (IS) - Rata-rata B3.1, B3.3, B3.4
  round((
    coalesce(((r.b3_1 - 1)::numeric / 4.0) * 100, 0) +
    coalesce(((r.b3_3 - 1)::numeric / 4.0) * 100, 0) +
    coalesce(((r.b3_4 - 1)::numeric / 4.0) * 100, 0)
  ) / 3.0, 1) as skor_is,

  -- Indeks Literasi AI (ILA) Komposit
  round((
    (((case when r.b2_1 = 'salah' then 1 else 0 end +
       case when r.b2_2 = 'benar' then 1 else 0 end +
       case when r.b2_3 = 'salah' then 1 else 0 end +
       case when r.b2_4 = 'benar' then 1 else 0 end)::numeric / 4.0) * 100) +
    coalesce(((r.b1 - 1)::numeric / 4.0) * 100, 50) +
    ((coalesce(((r.b3_1 - 1)::numeric / 4.0) * 100, 0) +
      coalesce(((r.b3_3 - 1)::numeric / 4.0) * 100, 0) +
      coalesce(((r.b3_4 - 1)::numeric / 4.0) * 100, 0)) / 3.0)
  ) / 3.0, 1) as skor_ila,

  -- Indeks Kesiapan Infrastruktur & Data (IKID)
  round((
    coalesce(((r.e1 - 1)::numeric / 4.0) * 100, 0) +
    coalesce(((r.e2 - 1)::numeric / 4.0) * 100, 0) +
    case r.e3 when 'terpusat' then 100 when 'tersebar' then 50 when 'fisik' then 0 else 50 end
  ) / 3.0, 1) as skor_ikid,

  -- Deteksi Data Sensitif (I-09)
  case when r.d1 && array['pribadi','keuangan_rahasia','kode_sandi'] then true else false end as pernah_input_data_sensitif,

  -- Kepatuhan Verifikasi Hasil AI (I-10)
  case when r.d2 in ('selalu','sering') then true else false end as rutin_verifikasi,

  r.f3 as kesediaan_bimtek,
  r.f4 as saran_masukan
from public.responses r
left join public.perangkat_daerah pd on r.a1_pd_id = pd.id;

-- View 2: Partisipasi Per Perangkat Daerah (Progress Monitoring)
create or replace view public.v_opd_participation as
select
  pd.id as pd_id,
  pd.kode,
  pd.nama as perangkat_daerah,
  pd.kelompok,
  coalesce(pd.jumlah_pegawai, 0) as target_pegawai,
  count(r.id) filter (where r.consent is true) as jumlah_responden,
  count(r.id) filter (where r.c1 is not null and r.c1 != 'belum') as pengguna_ai,
  count(r.id) filter (where r.c1 in ('harian','mingguan')) as pengguna_rutin,
  case
    when coalesce(pd.jumlah_pegawai, 0) > 0 then
      round((count(r.id) filter (where r.consent is true)::numeric / pd.jumlah_pegawai) * 100, 1)
    else 0
  end as persentase_cakupan,
  round(avg(v.skor_ila), 1) as rata_rata_ila,
  round(avg(v.skor_ikid), 1) as rata_rata_ikid
from public.perangkat_daerah pd
left join public.responses r on pd.id = r.a1_pd_id and r.periode = 2026
left join public.v_responses_flat v on r.id = v.id
group by pd.id, pd.kode, pd.nama, pd.kelompok, pd.jumlah_pegawai, pd.urutan
order by pd.urutan asc;

-- View 3: Resume 16 Indikator Resmi KAK (Scorecard Otomatis)
create or replace view public.v_indicator_summary as
with base as (
  select * from public.v_responses_flat where consent is true
),
stats as (
  select
    count(*) as total_n,
    count(*) filter (where is_ai_user) as user_n,
    count(*) filter (where is_routine_user) as routine_n,
    avg(skor_ip) as avg_ip,
    avg(skor_is) as avg_is,
    avg(skor_ila) as avg_ila,
    avg(skor_ikid) as avg_ikid,
    count(*) filter (where pernah_input_data_sensitif) as sensitive_n,
    count(*) filter (where rutin_verifikasi) as verify_n,
    count(*) filter (where kesediaan_bimtek = 'bersedia') as willing_n
  from base
)
select
  'I-01' as kode_indikator, 'Tingkat Adopsi AI (Pernah Menggunakan)' as nama_indikator,
  concat(round((user_n::numeric / nullif(total_n, 0)) * 100, 1), '%') as nilai,
  'Persentase pegawai pernah mencoba AI' as keterangan
from stats
union all
select
  'I-02', 'Tingkat Penggunaan AI Rutin',
  concat(round((routine_n::numeric / nullif(total_n, 0)) * 100, 1), '%'),
  'Frekuensi pemakaian harian atau mingguan'
from stats
union all
select
  'I-06', 'Indeks Pengetahuan AI (IP)',
  concat(round(avg_ip, 1), ' / 100'),
  'Skor benar tes 4 fakta/mitos AI'
from stats
union all
select
  'I-07', 'Indeks Sikap Terhadap AI (IS)',
  concat(round(avg_is, 1), ' / 100'),
  'Optimisme pemanfaatan AI untuk kinerja'
from stats
union all
select
  'I-08', 'Indeks Literasi AI (ILA)',
  concat(round(avg_ila, 1), ' / 100'),
  'Indeks komposit terbobot IP, PD, dan IS'
from stats
union all
select
  'I-09', 'Tingkat Risiko Input Data Sensitif',
  concat(round((sensitive_n::numeric / nullif(user_n, 0)) * 100, 1), '%'),
  'Pernah memasukkan data rahasia/pribadi warga'
from stats
union all
select
  'I-10', 'Tingkat Kepatuhan Verifikasi Hasil AI',
  concat(round((verify_n::numeric / nullif(user_n, 0)) * 100, 1), '%'),
  'Rutin memverifikasi kebenaran sebelum dipakai dinas'
from stats
union all
select
  'I-13', 'Indeks Kesiapan Infrastruktur & Data (IKID)',
  concat(round(avg_ikid, 1), ' / 100'),
  'Kesiapan konektivitas internet, PC dinas, & data'
from stats
union all
select
  'I-16', 'Tingkat Kesediaan Mengikuti Bimtek AI',
  concat(round((willing_n::numeric / nullif(total_n, 0)) * 100, 1), '%'),
  'ASN berminat mengikuti pelatihan peningkatan kapasitas'
from stats;

-- ---------------------------------------------------------------------
-- 8. STORED PROCEDURES & RPC FUNCTIONS
-- ---------------------------------------------------------------------

-- Fungsi statistik agregat publik untuk landing page
create or replace function public.public_stats(p_periode smallint default 2026)
returns json
language sql stable security definer
set search_path = public
as $$
  select json_build_object(
    'responden', (select count(*) from public.responses where periode = p_periode and consent is true),
    'perangkat_daerah', (select count(distinct a1_pd_id) from public.responses where periode = p_periode and consent is true),
    'target', (select coalesce(value::integer, 300) from public.survey_settings where key = 'target_responden')
  );
$$;

-- Prosedur praktis mendaftarkan admin baru dari auth.users
create or replace function public.register_admin_by_email(p_email text, p_nama text default null, p_role text default 'analyst')
returns text
language plpgsql security definer
set search_path = public
as $$
declare
  v_user_id uuid;
begin
  select id into v_user_id from auth.users where email = p_email limit 1;
  if v_user_id is null then
    return 'Gagal: Email belum terdaftar di Authentication → Users Supabase.';
  end if;

  insert into public.admins (user_id, email, nama, role)
  values (v_user_id, p_email, coalesce(p_nama, split_part(p_email, '@', 1)), p_role)
  on conflict (user_id) do update
    set nama = excluded.nama,
        email = excluded.email,
        role = excluded.role;

  return concat('Sukses: ', p_email, ' berhasil didaftarkan sebagai admin (role: ', p_role, ').');
end;
$$;

-- ---------------------------------------------------------------------
-- 9. ROW LEVEL SECURITY (RLS) & ACCESS CONTROL
-- ---------------------------------------------------------------------
alter table public.survey_settings  enable row level security;
alter table public.perangkat_daerah enable row level security;
alter table public.admins          enable row level security;
alter table public.responses       enable row level security;
alter table public.responses_audit enable row level security;

-- Policies: Survey Settings
drop policy if exists settings_public_read on public.survey_settings;
create policy settings_public_read on public.survey_settings
  for select to anon, authenticated using (true);

drop policy if exists settings_admin_all on public.survey_settings;
create policy settings_admin_all on public.survey_settings
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Policies: Perangkat Daerah
drop policy if exists pd_public_read on public.perangkat_daerah;
create policy pd_public_read on public.perangkat_daerah
  for select to anon, authenticated using (aktif or public.is_admin());

drop policy if exists pd_admin_write on public.perangkat_daerah;
create policy pd_admin_write on public.perangkat_daerah
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Policies: Admins
drop policy if exists admins_self_read on public.admins;
create policy admins_self_read on public.admins
  for select to authenticated using (user_id = auth.uid() or public.is_admin());

-- Policies: Responses
-- Respon disimpan aman: siapapun (anon / authenticated) dapat mengirim (INSERT) jawaban survei,
-- tetapi HANYA admin terdaftar yang dapat membaca (SELECT), mengubah, atau menghapus data respon.
grant insert on public.responses to anon, authenticated;
drop policy if exists responses_insert on public.responses;
create policy responses_insert on public.responses
  for insert to anon, authenticated with check (true);

drop policy if exists responses_admin_read on public.responses;
create policy responses_admin_read on public.responses
  for select to authenticated using (public.is_admin());

-- Policies: Audit
drop policy if exists audit_admin_read on public.responses_audit;
create policy audit_admin_read on public.responses_audit
  for select to authenticated using (public.is_admin());

-- Hak akses eksekusi RPC
revoke select, update, delete on public.responses from anon;
revoke all on public.responses_audit from anon;
grant execute on function public.public_stats(smallint) to anon, authenticated;
grant execute on function public.is_admin() to authenticated;

-- Selesai
