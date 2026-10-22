"use client";
import { createBrowserClient } from "@supabase/ssr";

function sanitizeUrl(raw) {
  if (!raw || typeof raw !== "string") return "";
  let clean = raw.trim().replace(/^["']|["']$/g, "").trim();
  if (clean && !clean.startsWith("http://") && !clean.startsWith("https://")) {
    clean = `https://${clean}`;
  }
  return clean.replace(/\/+$/, "");
}

function sanitizeKey(raw) {
  if (!raw || typeof raw !== "string") return "";
  return raw.trim().replace(/^["']|["']$/g, "").trim();
}

/** Client Supabase untuk komponen browser (halaman login). */
export function browserClient() {
  const url = sanitizeUrl(process.env.NEXT_PUBLIC_SUPABASE_URL);
  const anon = sanitizeKey(
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
  return createBrowserClient(url, anon);
}
