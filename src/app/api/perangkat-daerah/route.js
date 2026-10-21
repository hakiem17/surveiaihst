import { NextResponse } from "next/server";
import { isSupabaseConfigured, serviceClient } from "@/lib/supabase";
import { DEFAULT_PERANGKAT_DAERAH, getLocalPerangkatDaerah, saveLocalPerangkatDaerah } from "@/lib/master-data";
import fs from "fs";
import path from "path";

const LOCAL_STORE_PATH = path.join(process.cwd(), ".local_responses.json");

// Helper get response count per OPD
function getResponseCounts() {
  const counts = {};
  try {
    if (fs.existsSync(LOCAL_STORE_PATH)) {
      const responses = JSON.parse(fs.readFileSync(LOCAL_STORE_PATH, "utf8"));
      responses.forEach((r) => {
        if (r.a1_pd_id) {
          counts[r.a1_pd_id] = (counts[r.a1_pd_id] || 0) + 1;
        }
      });
    }
  } catch {}
  return counts;
}

export async function GET() {
  try {
    const counts = getResponseCounts();

    if (isSupabaseConfigured()) {
      try {
        const supabase = serviceClient();
        const { data, error } = await supabase
          .from("perangkat_daerah")
          .select("*")
          .order("urutan", { ascending: true });

        if (!error && data) {
          // get real response counts from supabase
          const { data: respData } = await supabase
            .from("responses")
            .select("a1_pd_id");
          if (respData) {
            respData.forEach((r) => {
              if (r.a1_pd_id) {
                counts[r.a1_pd_id] = (counts[r.a1_pd_id] || 0) + 1;
              }
            });
          }

          const withCounts = data.map((pd) => ({
            ...pd,
            response_count: counts[pd.id] || 0,
          }));
          return NextResponse.json({ ok: true, data: withCounts });
        }
      } catch (e) {
        console.warn("Supabase fetch PD error, fallback to local:", e);
      }
    }

    const localList = getLocalPerangkatDaerah().map((pd) => ({
      ...pd,
      response_count: counts[pd.id] || 0,
    }));
    return NextResponse.json({ ok: true, data: localList });
  } catch (err) {
    return NextResponse.json({ message: "Gagal memuat data master.", error: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { kode, nama, kelompok, jumlah_pegawai, urutan, aktif = true } = body;

    if (!nama || !nama.trim()) {
      return NextResponse.json({ message: "Nama Perangkat Daerah wajib diisi." }, { status: 422 });
    }
    if (!kelompok) {
      return NextResponse.json({ message: "Kelompok Perangkat Daerah wajib dipilih." }, { status: 422 });
    }

    const cleanNama = nama.trim();
    const cleanKode = kode?.trim() || cleanNama.toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 16);
    const parsedPegawai = jumlah_pegawai ? parseInt(jumlah_pegawai, 10) : 0;
    const parsedUrutan = urutan ? parseInt(urutan, 10) : 99;

    if (isSupabaseConfigured()) {
      try {
        const supabase = serviceClient();
        const { data, error } = await supabase
          .from("perangkat_daerah")
          .insert({
            kode: cleanKode,
            nama: cleanNama,
            kelompok,
            jumlah_pegawai: parsedPegawai,
            urutan: parsedUrutan,
            aktif: Boolean(aktif),
          })
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            return NextResponse.json({ message: "Nama atau kode Perangkat Daerah sudah terdaftar." }, { status: 409 });
          }
          throw error;
        }
        return NextResponse.json({ ok: true, data });
      } catch (e) {
        console.warn("Supabase insert PD error:", e);
      }
    }

    // Local storage fallback
    const list = getLocalPerangkatDaerah();
    if (list.some((pd) => pd.nama.toLowerCase() === cleanNama.toLowerCase())) {
      return NextResponse.json({ message: "Nama Perangkat Daerah sudah terdaftar." }, { status: 409 });
    }

    const nextId = list.reduce((max, pd) => Math.max(max, pd.id || 0), 0) + 1;
    const newPd = {
      id: nextId,
      kode: cleanKode,
      nama: cleanNama,
      kelompok,
      jumlah_pegawai: parsedPegawai,
      urutan: parsedUrutan,
      aktif: Boolean(aktif),
      created_at: new Date().toISOString(),
    };

    list.push(newPd);
    list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
    saveLocalPerangkatDaerah(list);

    return NextResponse.json({ ok: true, data: newPd });
  } catch (err) {
    return NextResponse.json({ message: "Gagal menambahkan Perangkat Daerah.", error: err.message }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { id, kode, nama, kelompok, jumlah_pegawai, urutan, aktif } = body;

    if (!id) {
      return NextResponse.json({ message: "ID Perangkat Daerah tidak valid." }, { status: 422 });
    }
    if (!nama || !nama.trim()) {
      return NextResponse.json({ message: "Nama Perangkat Daerah wajib diisi." }, { status: 422 });
    }

    const cleanNama = nama.trim();
    const cleanKode = kode?.trim() || cleanNama.toUpperCase().replace(/[^A-Z0-9]/g, "_").slice(0, 16);
    const parsedPegawai = jumlah_pegawai != null ? parseInt(jumlah_pegawai, 10) : null;
    const parsedUrutan = urutan != null ? parseInt(urutan, 10) : 99;

    if (isSupabaseConfigured()) {
      try {
        const supabase = serviceClient();
        const { data, error } = await supabase
          .from("perangkat_daerah")
          .update({
            kode: cleanKode,
            nama: cleanNama,
            kelompok,
            jumlah_pegawai: parsedPegawai,
            urutan: parsedUrutan,
            aktif: Boolean(aktif),
            updated_at: new Date().toISOString(),
          })
          .eq("id", id)
          .select()
          .single();

        if (error) {
          if (error.code === "23505") {
            return NextResponse.json({ message: "Nama atau kode sudah digunakan oleh instansi lain." }, { status: 409 });
          }
          throw error;
        }
        return NextResponse.json({ ok: true, data });
      } catch (e) {
        console.warn("Supabase update PD error:", e);
      }
    }

    // Local storage fallback
    const list = getLocalPerangkatDaerah();
    const idx = list.findIndex((pd) => pd.id === id);
    if (idx === -1) {
      return NextResponse.json({ message: "Perangkat Daerah tidak ditemukan." }, { status: 404 });
    }

    list[idx] = {
      ...list[idx],
      kode: cleanKode,
      nama: cleanNama,
      kelompok: kelompok || list[idx].kelompok,
      jumlah_pegawai: parsedPegawai,
      urutan: parsedUrutan,
      aktif: aktif !== undefined ? Boolean(aktif) : list[idx].aktif,
      updated_at: new Date().toISOString(),
    };

    list.sort((a, b) => (a.urutan || 0) - (b.urutan || 0));
    saveLocalPerangkatDaerah(list);

    return NextResponse.json({ ok: true, data: list[idx] });
  } catch (err) {
    return NextResponse.json({ message: "Gagal memperbarui Perangkat Daerah.", error: err.message }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const idParam = searchParams.get("id");
    const id = parseInt(idParam, 10);

    if (!id) {
      return NextResponse.json({ message: "ID tidak valid." }, { status: 422 });
    }

    if (isSupabaseConfigured()) {
      try {
        const supabase = serviceClient();
        // Cek apakah ada respon terkait
        const { count } = await supabase
          .from("responses")
          .select("id", { count: "exact", head: true })
          .eq("a1_pd_id", id);

        if (count && count > 0) {
          return NextResponse.json({
            message: `Tidak dapat menghapus: terdapat ${count} respons survei terkait instansi ini. Anda dapat menonaktifkan statusnya.`,
          }, { status: 409 });
        }

        const { error } = await supabase
          .from("perangkat_daerah")
          .delete()
          .eq("id", id);

        if (error) throw error;
        return NextResponse.json({ ok: true });
      } catch (e) {
        console.warn("Supabase delete PD error:", e);
      }
    }

    // Local check
    const counts = getResponseCounts();
    if (counts[id] && counts[id] > 0) {
      return NextResponse.json({
        message: `Tidak dapat menghapus: terdapat ${counts[id]} respons survei terkait instansi ini. Anda dapat menonaktifkan statusnya.`,
      }, { status: 409 });
    }

    const list = getLocalPerangkatDaerah();
    const filtered = list.filter((pd) => pd.id !== id);
    saveLocalPerangkatDaerah(filtered);

    return NextResponse.json({ ok: true });
  } catch (err) {
    return NextResponse.json({ message: "Gagal menghapus Perangkat Daerah.", error: err.message }, { status: 500 });
  }
}
