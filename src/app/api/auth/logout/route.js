import { NextResponse } from "next/server";
import { serverClient, isSupabaseConfigured } from "@/lib/supabase";

export async function POST(request) {
  if (isSupabaseConfigured()) {
    try {
      const supabase = await serverClient();
      await supabase.auth.signOut();
    } catch (e) {
      console.warn("Sign out error:", e);
    }
  }

  const response = NextResponse.json({ ok: true });
  // Hapus cookie demo jika ada
  response.cookies.delete("surveiai_admin_demo");
  return response;
}
