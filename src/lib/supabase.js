// Hanya untuk server (Server Components, Route Handlers). Client browser: supabase-browser.js
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

export const isSupabaseConfigured = () => Boolean(URL && ANON);

/** Client server yang membaca/menulis cookie sesi (Server Components, Route Handlers). */
export async function serverClient() {
  const cookieStore = await cookies();
  return createServerClient(URL, ANON, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Dipanggil dari Server Component: penyegaran cookie ditangani oleh proxy.js
        }
      },
    },
  });
}

/** Client service role — HANYA di server, untuk menyimpan jawaban setelah validasi. */
export function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || ANON;
  if (!URL || !key) throw new Error("Supabase URL atau Key belum dikonfigurasi");
  return createClient(URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Client anon tanpa sesi untuk data publik (daftar Perangkat Daerah, statistik agregat). */
export function publicClient() {
  return createClient(URL, ANON, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Mengembalikan { supabase, user, isAdmin } untuk halaman/route yang dilindungi. */
export async function getAdminSession() {
  if (!isSupabaseConfigured()) return { supabase: null, user: null, isAdmin: false };
  const supabase = await serverClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { supabase, user: null, isAdmin: false };
  const { data } = await supabase.rpc("is_admin");
  return { supabase, user, isAdmin: data === true };
}
