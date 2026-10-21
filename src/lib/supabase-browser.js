"use client";
import { createBrowserClient } from "@supabase/ssr";

/** Client Supabase untuk komponen browser (halaman login). */
export function browserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}
