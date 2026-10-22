import Link from "next/link";
import { connection } from "next/server";
import { isSupabaseConfigured, publicClient } from "@/lib/supabase";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import SurveyForm from "./SurveyForm";
import s from "./survei.module.css";

export const metadata = {
  title: "Isi Kuesioner",
  description: "Kuesioner Survei Pemanfaatan AI Pemerintah Kabupaten Hulu Sungai Tengah 2026 — anonim, 5–7 menit.",
};

export const instant = false;

import { getLocalPerangkatDaerah } from "@/lib/master-data";

async function getPerangkatDaerah() {
  const fallbackList = getLocalPerangkatDaerah().filter((p) => p.aktif);
  if (!isSupabaseConfigured()) return { list: fallbackList, error: null };
  try {
    const { data, error } = await publicClient()
      .from("perangkat_daerah")
      .select("id, nama, kelompok")
      .eq("aktif", true)
      .order("urutan")
      .order("nama");
    if (error || !data || data.length === 0) return { list: fallbackList, error: null };
    return { list: data, error: null };
  } catch {
    return { list: fallbackList, error: null };
  }
}

export default async function SurveiPage() {
  await connection();
  const { list, error } = await getPerangkatDaerah();

  return (
    <div className={s.shell}>
      <header className={s.top}>
        <Link href="/" className={s.brand}>
          <Logo size={30} />
          <span>
            <strong>Survei Pemanfaatan AI</strong>
            <small>Pemkab Hulu Sungai Tengah 2026</small>
          </span>
        </Link>
        <div className="row gap-2">
          <ThemeToggle />
          <span className="badge">
            <span className="dot" /> Anonim
          </span>
        </div>
      </header>
      <main className={s.main}>
        <h1 className="sr-only">Kuesioner Survei Pemanfaatan AI Pemkab HST 2026</h1>
        <SurveyForm perangkatDaerah={list} loadError={error} />
      </main>
    </div>
  );
}
