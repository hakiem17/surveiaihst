import { NextResponse } from "next/server";
import { isSupabaseConfigured, serviceClient } from "@/lib/supabase";
import { buildResponseRow, FAST_THRESHOLD_SEC, PERIODE } from "@/lib/survey";
import { DEFAULT_PERANGKAT_DAERAH, getLocalPerangkatDaerah } from "@/lib/master-data";
import fs from "fs";
import path from "path";

const LOCAL_STORE_PATH =
  process.env.VERCEL || process.env.NODE_ENV === "production"
    ? path.join("/tmp", ".local_responses.json")
    : path.join(process.cwd(), ".local_responses.json");

function saveLocalDemoResponse(row) {
  try {
    let list = [];
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      list = JSON.parse(fs.readFileSync(LOCAL_STORE_PATH, "utf8"));
    }
    const idx = list.findIndex((item) => item.device_id === row.device_id && item.periode === row.periode);
    if (idx >= 0) {
      return { conflict: true };
    }
    list.unshift({ ...row, id: `local-${Date.now()}`, created_at: new Date().toISOString() });
    fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(list, null, 2), "utf8");
    return { ok: true };
  } catch (err) {
    console.error("Local store error:", err);
    return { ok: true };
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { consent, device_id, started_at, answers = {} } = body;

    if (!device_id || typeof device_id !== "string" || device_id.length < 10) {
      return NextResponse.json({ message: "Identitas sesi tidak valid." }, { status: 400 });
    }

    // Kasus 1: Responden menolak berpartisipasi (PS = Tidak bersedia)
    if (consent === false) {
      if (isSupabaseConfigured()) {
        try {
          const supabase = serviceClient();
          await supabase.from("responses").insert({
            periode: PERIODE,
            device_id,
            consent: false,
          });
        } catch (e) {
          console.warn("Gagal menyimpan catatan penolakan ke Supabase:", e);
        }
      } else {
        saveLocalDemoResponse({ periode: PERIODE, device_id, consent: false });
      }
      return NextResponse.json({ ok: true, message: "Penolakan telah dicatat." });
    }

    // Kasus 2: Responden bersedia & mengisi kuesioner
    // Kumpulkan ID PD yang valid (dari database jika ada, atau fallback)
    const validPdIds = new Set(getLocalPerangkatDaerah().map((pd) => pd.id));

    const { row, errors } = buildResponseRow(answers, { pdIds: validPdIds });
    if (errors) {
      return NextResponse.json({ message: "Terdapat isian yang belum lengkap atau tidak valid.", errors }, { status: 422 });
    }

    // Hitung durasi pengisian dan deteksi abnormalitas waktu (KAK N.1 < 2 menit)
    let durationSec = null;
    let flagFast = false;
    let startedAtIso = null;

    if (started_at) {
      const startDate = new Date(started_at);
      if (!Number.isNaN(startDate.getTime())) {
        startedAtIso = startDate.toISOString();
        const diffMs = Date.now() - startDate.getTime();
        if (diffMs > 0) {
          durationSec = Math.round(diffMs / 1000);
          flagFast = durationSec < FAST_THRESHOLD_SEC;
        }
      }
    }

    row.periode = PERIODE;
    row.device_id = device_id;
    row.consent = true;
    row.started_at = startedAtIso;
    row.duration_sec = durationSec;
    row.flag_fast = flagFast;

    if (isSupabaseConfigured()) {
      try {
        const supabase = serviceClient();
        const { error } = await supabase.from("responses").insert(row);
        if (error) {
          if (error.code === "23505") {
            return NextResponse.json({ message: "Anda sudah pernah mengisi survei ini pada perangkat ini." }, { status: 409 });
          }
          console.warn("Supabase insert error:", error.message);
          if (error.code === "42501") {
            console.warn(
              "[PERINGATAN SUPABASE] Permission denied untuk tabel responses! " +
              "Pastikan SUPABASE_SERVICE_ROLE_KEY diisi di Environment Variables Vercel/Hosting, " +
              "atau jalankan supabase/fix_permissions.sql di Supabase SQL Editor."
            );
          }
          // Fallback simpan ke cache lokal agar data responden tidak hilang
          saveLocalDemoResponse(row);
          return NextResponse.json({ ok: true, fallback: true, warning: error.message });
        }
        return NextResponse.json({ ok: true });
      } catch (dbErr) {
        console.warn("Supabase client connection error:", dbErr.message);
        saveLocalDemoResponse(row);
        return NextResponse.json({ ok: true, fallback: true, warning: dbErr.message });
      }
    }

    // Fallback mode demo lokal
    const localResult = saveLocalDemoResponse(row);
    if (localResult.conflict) {
      return NextResponse.json({ message: "Anda sudah pernah mengisi survei ini pada perangkat ini." }, { status: 409 });
    }
    return NextResponse.json({ ok: true, demo: true });
  } catch (err) {
    console.error("API submit error:", err);
    return NextResponse.json(
      {
        message: "Terjadi kesalahan pada server.",
        error: err.message,
      },
      { status: 500 }
    );
  }
}
