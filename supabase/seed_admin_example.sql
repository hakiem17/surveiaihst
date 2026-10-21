-- =====================================================================
-- Pendaftaran Akun Admin / Tim Survei Diskominfo SP
-- Jalankan SETELAH akun dibuat di menu:
-- Supabase Dashboard → Authentication → Users → Add User
-- =====================================================================

-- Opsi A: Menggunakan stored function pembantu (disarankan)
-- Ganti 'admin@hulusungaitengahkab.go.id' dengan email yang Anda buat di Authentication
select public.register_admin_by_email(
  'admin@hulusungaitengahkab.go.id',
  'Administrator Diskominfo SP',
  'superadmin'
);

-- Opsi B: Pendaftaran manual via query SQL langsung
-- insert into public.admins (user_id, email, nama, role)
-- select
--   id,
--   email,
--   'Administrator Utama',
--   'superadmin'
-- from auth.users
-- where email = 'admin@hulusungaitengahkab.go.id'
-- on conflict (user_id) do update
--   set role = 'superadmin', nama = 'Administrator Utama';

-- Cek daftar admin yang aktif:
select a.user_id, a.email, a.nama, a.role, a.created_at
from public.admins a;
