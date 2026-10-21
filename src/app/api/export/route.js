import { NextResponse } from "next/server";
import { isSupabaseConfigured, serviceClient } from "@/lib/supabase";
import { PERIODE } from "@/lib/survey";
import { DEFAULT_PERANGKAT_DAERAH, getLocalPerangkatDaerah } from "@/lib/master-data";
import { generateSampleResponses } from "@/lib/demo-data";
import fs from "fs";
import path from "path";

const LOCAL_STORE_PATH = path.join(process.cwd(), ".local_responses.json");

function getResponses() {
  if (isSupabaseConfigured()) {
    // Akan diambil via supabase jika ada
  }
  if (fs.existsSync(LOCAL_STORE_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(LOCAL_STORE_PATH, "utf8"));
    } catch {
      return [];
    }
  }
  return [];
}

export async function GET() {
  let list = [];
  if (isSupabaseConfigured()) {
    try {
      const supabase = serviceClient();
      const { data } = await supabase
        .from("responses")
        .select("*")
        .eq("periode", PERIODE)
        .order("created_at", { ascending: false });
      list = data || [];
    } catch {
      list = getResponses();
    }
  } else {
    list = getResponses();
  }

  // Jika data masih kosong di mode demo, ekspor sampel
  if (list.length === 0) {
    list = generateSampleResponses(120);
  }

  const pdList = getLocalPerangkatDaerah();
  const pdMap = Object.fromEntries(pdList.map((pd) => [pd.id, pd.nama]));

  const headers = [
    "ID",
    "Timestamp",
    "Durasi_Detik",
    "Flag_Waktu_Cepat",
    "Flag_Straightlining",
    "Perangkat_Daerah",
    "Klaster_Jabatan",
    "Status_Kepegawaian",
    "Kelompok_Umur",
    "Jenis_Kelamin",
    "B1_Pemahaman_Diri",
    "B2_1", "B2_2", "B2_3", "B2_4",
    "B3_1", "B3_2", "B3_3", "B3_4",
    "C1_Frekuensi",
    "C2_Aplikasi",
    "C2a_Paling_Sering",
    "C3_Jenis_Akun",
    "C4_Tugas_Dinas",
    "C5_Hemat_Waktu",
    "C6_Ketepatan_Hasil",
    "C7_Alasan_Belum",
    "D1_Jenis_Informasi",
    "D2_Periksa_Ulang",
    "E1_Internet",
    "E2_Perangkat",
    "E3_Pengelolaan_Data",
    "E4_Pedoman_Pemda",
    "E5_Pelatihan",
    "F1_Hambatan",
    "F2_1", "F2_2", "F2_3", "F2_4",
    "F3_Kesediaan_Bimtek",
    "F4_Saran"
  ];

  const escapeCsv = (val) => {
    if (val === null || val === undefined) return "";
    if (Array.isArray(val)) return `"${val.join("; ").replace(/"/g, '""')}"`;
    const str = String(val);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = list.map((r) => [
    r.id,
    r.created_at,
    r.duration_sec,
    r.flag_fast ? "YA" : "TIDAK",
    r.flag_straightline ? "YA" : "TIDAK",
    pdMap[r.a1_pd_id] || r.a1_pd_id,
    r.a2,
    r.a3,
    r.a4,
    r.a5,
    r.b1,
    r.b2_1, r.b2_2, r.b2_3, r.b2_4,
    r.b3_1, r.b3_2, r.b3_3, r.b3_4,
    r.c1,
    r.c2,
    r.c2a,
    r.c3,
    r.c4,
    r.c5,
    r.c6,
    r.c7,
    r.d1,
    r.d2,
    r.e1,
    r.e2,
    r.e3,
    r.e4,
    r.e5,
    r.f1,
    r.f2_1, r.f2_2, r.f2_3, r.f2_4,
    r.f3,
    r.f4,
  ].map(escapeCsv).join(","));

  const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\r\n");

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="dataset_survei_ai_hst_${PERIODE}.csv"`,
    },
  });
}
