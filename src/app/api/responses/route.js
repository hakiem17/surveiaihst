import { NextResponse } from "next/server";
import { isSupabaseConfigured, serviceClient, serverClient } from "@/lib/supabase";
import fs from "fs";
import path from "path";

const LOCAL_STORE_PATH = path.join(process.cwd(), ".local_responses.json");

export async function DELETE(request) {
  try {
    // 1. Verifikasi autentikasi sesi admin
    if (isSupabaseConfigured()) {
      try {
        const supabaseAuth = await serverClient();
        const { data: { user } } = await supabaseAuth.auth.getUser();
        if (!user) {
          return NextResponse.json({ message: "Akses ditolak. Silakan login sebagai admin." }, { status: 401 });
        }
      } catch (err) {
        console.warn("Session check error in DELETE /api/responses:", err);
      }
    }

    const { searchParams } = new URL(request.url);
    let id = searchParams.get("id");
    let ids = [];

    // Baca dari body jika tidak di searchParams
    try {
      const body = await request.json();
      if (body.ids && Array.isArray(body.ids)) {
        ids = body.ids;
      } else if (body.id) {
        id = body.id;
      }
    } catch {}

    if (id && !ids.includes(id)) {
      ids.push(id);
    }

    if (ids.length === 0) {
      return NextResponse.json({ message: "ID data respons tidak valid." }, { status: 400 });
    }

    let deletedFromDb = false;

    // 2. Hapus dari Supabase jika dikonfigurasi (hanya UUID valid)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const dbUuids = ids.filter((id) => uuidRegex.test(id));

    if (isSupabaseConfigured() && dbUuids.length > 0) {
      try {
        const supabase = serviceClient();
        const { error } = await supabase
          .from("responses")
          .delete()
          .in("id", dbUuids);

        if (error) {
          console.warn("Supabase delete response warning:", error.message);
        } else {
          deletedFromDb = true;
        }
      } catch (e) {
        console.warn("Supabase response delete error:", e);
      }
    }

    // 3. Hapus juga dari local store jika ada
    try {
      if (fs.existsSync(LOCAL_STORE_PATH)) {
        const list = JSON.parse(fs.readFileSync(LOCAL_STORE_PATH, "utf8"));
        const filtered = list.filter((r) => !ids.includes(r.id));
        fs.writeFileSync(LOCAL_STORE_PATH, JSON.stringify(filtered, null, 2), "utf8");
      }
    } catch (e) {
      console.warn("Local store delete error:", e);
    }

    return NextResponse.json({
      ok: true,
      message: `Berhasil menghapus ${ids.length} data responden tidak relevan.`,
      ids,
      fromDb: deletedFromDb,
    });
  } catch (err) {
    console.error("Delete responses error:", err);
    return NextResponse.json(
      { message: "Terjadi kesalahan saat menghapus data responden.", error: err.message },
      { status: 500 }
    );
  }
}
