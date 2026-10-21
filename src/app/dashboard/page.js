import { connection } from "next/server";
import { redirect } from "next/navigation";
import { isSupabaseConfigured, serverClient, serviceClient } from "@/lib/supabase";
import { DEFAULT_PERANGKAT_DAERAH, getLocalPerangkatDaerah } from "@/lib/master-data";
import { PERIODE } from "@/lib/survey";
import fs from "fs";
import path from "path";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Dashboard Analitik & Pemantauan Survei AI 2026",
  description: "Dasbor pemantauan real-time dan analisis indikator statistik sektoral pemanfaatan AI Pemkab HST.",
};

export const instant = false;

const LOCAL_STORE_PATH = path.join(process.cwd(), ".local_responses.json");

async function getData() {
  if (!isSupabaseConfigured()) {
    redirect("/login?e=config");
  }

  const supabase = await serverClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  let userEmail = user.email || "admin@hulusungaitengahkab.go.id";
  let responses = [];
  let perangkatDaerah = getLocalPerangkatDaerah();
  let isLiveDb = false;

  try {
    const adminClient = serviceClient();
    const { data: pdData } = await adminClient
      .from("perangkat_daerah")
      .select("*")
      .order("urutan");
    if (pdData && pdData.length > 0) {
      perangkatDaerah = pdData;
    }

    const { data: respData } = await adminClient
      .from("responses")
      .select("*")
      .eq("periode", PERIODE)
      .order("created_at", { ascending: false });
    if (respData) {
      responses = respData;
      isLiveDb = true;
    }
  } catch (e) {
    console.warn("Supabase load error in dashboard:", e);
  }

  // Jika DB kosong atau offline, ambil dari local file jika ada
  if (responses.length === 0) {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      try {
        const local = JSON.parse(fs.readFileSync(LOCAL_STORE_PATH, "utf8"));
        if (local && local.length > 0) {
          responses = local;
        }
      } catch {}
    }
  }

  return { responses, perangkatDaerah, userEmail, isLiveDb, isSampleData: false };
}

export default async function DashboardPage() {
  await connection();
  const data = await getData();

  return <DashboardClient initialData={data} />;
}
