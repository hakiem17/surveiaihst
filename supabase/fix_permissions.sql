-- =====================================================================
-- PERBAIKAN PERMISSION & POLICIES UNTUK UJI COBA SURVEI & HAPUS DATA
-- Jalankan skrip ini sekali di: Supabase Dashboard -> SQL Editor -> Run
-- =====================================================================

-- 1. Berikan hak akses dasar schema dan tabel
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.responses TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.perangkat_daerah TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.survey_settings TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.admins TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;

-- 2. Pastikan RLS aktif
ALTER TABLE public.responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.perangkat_daerah ENABLE ROW LEVEL SECURITY;

-- 3. Kebijakan INSERT: Publik (anon & authenticated) dapat mengirim survei
DROP POLICY IF EXISTS responses_insert ON public.responses;
CREATE POLICY responses_insert ON public.responses
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- 4. Kebijakan SELECT: Admin yang telah login dapat melihat semua respon
DROP POLICY IF EXISTS responses_admin_read ON public.responses;
CREATE POLICY responses_admin_read ON public.responses
  FOR SELECT TO authenticated
  USING (true);

-- 5. Kebijakan DELETE: Admin dapat menghapus respon yang tidak relevan / data uji
DROP POLICY IF EXISTS responses_admin_delete ON public.responses;
CREATE POLICY responses_admin_delete ON public.responses
  FOR DELETE TO authenticated
  USING (true);

-- 6. Kebijakan Perangkat Daerah: Publik bisa membaca, admin bisa kelola
DROP POLICY IF EXISTS pd_public_read ON public.perangkat_daerah;
CREATE POLICY pd_public_read ON public.perangkat_daerah
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS pd_admin_write ON public.perangkat_daerah;
CREATE POLICY pd_admin_write ON public.perangkat_daerah
  FOR ALL TO authenticated
  USING (true)
  WITH CHECK (true);
