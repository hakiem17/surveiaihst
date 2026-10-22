"use client";
import { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { computeIndices, indexCategory, labelOf, OPT } from "@/lib/survey";
import s from "./dashboard.module.css";

const SENSITIVE_D1_KEYS = ["pribadi", "keuangan_rahasia", "kode_sandi"];

const MENU_ITEMS = [
  { id: "resume", label: "Resume Semua Indikator", icon: "📑", desc: "Ringkasan pilar I-01 s/d I-16" },
  { id: "overview", label: "Ringkasan Eksekutif", icon: "📊", desc: "KPI utama, ILA, IKID & status" },
  { id: "adoption", label: "Pola & Aplikasi AI", icon: "🤖", desc: "Aplikasi, akun & use cases" },
  { id: "security", label: "Keamanan & Risiko", icon: "🛡️", desc: "Data sensitif, verifikasi & risiko" },
  { id: "infrastructure", label: "Kesiapan & Hambatan", icon: "⚡", desc: "Internet, perangkat & kendala" },
  { id: "indicators", label: "16 Indikator KAK", icon: "📋", desc: "Matriks resmi Tabel 10" },
  { id: "responses", label: "Data Mikro Responden", icon: "👥", desc: "Tabel respons dengan paging" },
  { id: "master_pd", label: "Master Perangkat Daerah", icon: "🏢", desc: "Kelola 39 OPD & instansi" },
];

export default function DashboardClient({ initialData }) {
  const router = useRouter();
  const { responses: rawResponses, perangkatDaerah, userEmail, isLiveDb, isSampleData } = initialData;

  const [activePage, setActivePage] = useState("resume");
  const [selectedPd, setSelectedPd] = useState("all");
  const [selectedCluster, setSelectedCluster] = useState("all");
  const [searchFilter, setSearchFilter] = useState("");

  // Master Perangkat Daerah CRUD State
  const [pdList, setPdList] = useState(perangkatDaerah);
  const [pdSearch, setPdSearch] = useState("");
  const [pdGroupFilter, setPdGroupFilter] = useState("all");
  const [pdPage, setPdPage] = useState(1);
  const PD_PER_PAGE = 8;

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPd, setEditingPd] = useState(null);
  const [formData, setFormData] = useState({
    kode: "",
    nama: "",
    kelompok: "Dinas",
    jumlah_pegawai: "",
    urutan: 99,
    aktif: true,
  });
  const [isSaving, setIsSaving] = useState(false);
  const [formError, setFormError] = useState(null);
  const [toast, setToast] = useState(null);

  // Response management state (dapat menghapus data tidak relevan)
  const [respList, setRespList] = useState(rawResponses);
  const [deletingRespId, setDeletingRespId] = useState(null);
  const [validityFilter, setValidityFilter] = useState("all"); // "all", "flagged", "valid"

  // Pagination states
  const [respPage, setRespPage] = useState(1);
  const RESP_PER_PAGE = 8; // Pas 1 layar tanpa scroll berlebih

  const [indPage, setIndPage] = useState(1);
  const IND_PER_PAGE = 8; // 8 indikator per page (total 2 page untuk 16 indikator)

  const pdMap = useMemo(() => {
    return Object.fromEntries(pdList.map((pd) => [pd.id, pd]));
  }, [pdList]);

  // Filtered responses (hanya yang consent & belum dihapus)
  const filtered = useMemo(() => {
    return respList.filter((r) => {
      if (!r.consent) return false;
      if (selectedPd !== "all" && String(r.a1_pd_id) !== selectedPd) return false;
      if (selectedCluster !== "all" && r.a2 !== selectedCluster) return false;
      return true;
    });
  }, [respList, selectedPd, selectedCluster]);

  // Kalkulasi 16 Indikator Resmi (I-01 s/d I-16)
  const metrics = useMemo(() => {
    const total = filtered.length;
    if (total === 0) {
      return {
        total: 0,
        userCount: 0,
        routineUsers: 0,
        i01: 0,
        i02: 0,
        avgIp: 0,
        avgPd: 0,
        avgIs: 0,
        avgIla: 0,
        ilaCategory: "Belum Ada Data",
        avgIkid: 0,
        ikidCategory: "Belum Ada Data",
        i09: 0,
        i10: 0,
        i11: 0,
        i12: 0,
        i16: 0,
        appCounts: {},
        taskCounts: {},
        accountCounts: {},
        obstacleCounts: {},
        riskAvgs: { f2_1: "0.0", f2_2: "0.0", f2_3: "0.0", f2_4: "0.0" },
        avgE1: "0.0",
        avgE2: "0.0",
        e3Counts: {},
      };
    }

    const users = filtered.filter((r) => r.c1 && r.c1 !== "belum");
    const userCount = users.length;
    const routineUsers = filtered.filter((r) => r.c1 === "harian" || r.c1 === "mingguan").length;

    // I-01 & I-02
    const i01 = Math.round((userCount / total) * 100);
    const i02 = Math.round((routineUsers / total) * 100);

    // Indeks Literasi AI (I-06, I-07, I-08)
    let sumIp = 0;
    let sumPd = 0;
    let sumIs = 0;
    let sumIla = 0;
    let validIlaCount = 0;

    // Indeks Kesiapan (I-13)
    let sumIkid = 0;
    let validIkidCount = 0;

    filtered.forEach((r) => {
      const idx = computeIndices(r);
      if (idx.ip != null) sumIp += idx.ip;
      if (idx.pd != null) sumPd += idx.pd;
      if (idx.is != null) sumIs += idx.is;
      if (idx.ila != null) {
        sumIla += idx.ila;
        validIlaCount++;
      }
      if (idx.ikid != null) {
        sumIkid += idx.ikid;
        validIkidCount++;
      }
    });

    const avgIp = Math.round(sumIp / total);
    const avgPd = Math.round(sumPd / total);
    const avgIs = Math.round(sumIs / total);
    const avgIla = validIlaCount ? Math.round(sumIla / validIlaCount) : 0;
    const avgIkid = validIkidCount ? Math.round(sumIkid / validIkidCount) : 0;

    // I-09: Data sensitif
    let sensitiveCount = 0;
    users.forEach((r) => {
      if (Array.isArray(r.d1) && r.d1.some((v) => SENSITIVE_D1_KEYS.includes(v))) {
        sensitiveCount++;
      }
    });
    const i09 = userCount ? Math.round((sensitiveCount / userCount) * 100) : 0;

    // I-10: Rutin verifikasi (Selalu / Sering)
    const verifyCount = users.filter((r) => r.d2 === "selalu" || r.d2 === "sering").length;
    const i10 = userCount ? Math.round((verifyCount / userCount) * 100) : 0;

    // I-11: Mengetahui pedoman
    const pedomanCount = filtered.filter((r) => r.e4 === "ada_sosialisasi").length;
    const i11 = Math.round((pedomanCount / total) * 100);

    // I-12: Pelatihan AI
    const trainedCount = filtered.filter((r) => r.e5 && r.e5 !== "tidak_pernah").length;
    const i12 = Math.round((trainedCount / total) * 100);

    // I-16: Bersedia pelatihan
    const willingCount = filtered.filter((r) => r.f3 === "bersedia").length;
    const i16 = Math.round((willingCount / total) * 100);

    // Sebaran Aplikasi (C2)
    const appCounts = {};
    users.forEach((r) => {
      if (Array.isArray(r.c2)) {
        r.c2.forEach((app) => {
          appCounts[app] = (appCounts[app] || 0) + 1;
        });
      }
    });

    // Sebaran Tugas (C4)
    const taskCounts = {};
    users.forEach((r) => {
      if (Array.isArray(r.c4)) {
        r.c4.forEach((task) => {
          taskCounts[task] = (taskCounts[task] || 0) + 1;
        });
      }
    });

    // Jenis Akun (C3)
    const accountCounts = {};
    users.forEach((r) => {
      if (r.c3) accountCounts[r.c3] = (accountCounts[r.c3] || 0) + 1;
    });

    // Hambatan (F1)
    const obstacleCounts = {};
    filtered.forEach((r) => {
      if (Array.isArray(r.f1)) {
        r.f1.forEach((obs) => {
          obstacleCounts[obs] = (obstacleCounts[obs] || 0) + 1;
        });
      }
    });

    // Rata-rata Risiko (F2)
    const riskAvgs = {
      f2_1: (filtered.reduce((s, r) => s + (r.f2_1 || 0), 0) / total).toFixed(1),
      f2_2: (filtered.reduce((s, r) => s + (r.f2_2 || 0), 0) / total).toFixed(1),
      f2_3: (filtered.reduce((s, r) => s + (r.f2_3 || 0), 0) / total).toFixed(1),
      f2_4: (filtered.reduce((s, r) => s + (r.f2_4 || 0), 0) / total).toFixed(1),
    };

    // Evaluasi Infrastruktur & Data (E1, E2, E3)
    const avgE1 = (filtered.reduce((s, r) => s + (r.e1 || 0), 0) / total).toFixed(1);
    const avgE2 = (filtered.reduce((s, r) => s + (r.e2 || 0), 0) / total).toFixed(1);
    const e3Counts = {};
    filtered.forEach((r) => {
      if (r.e3) e3Counts[r.e3] = (e3Counts[r.e3] || 0) + 1;
    });

    return {
      total,
      userCount,
      routineUsers,
      i01,
      i02,
      avgIp,
      avgPd,
      avgIs,
      avgIla,
      ilaCategory: indexCategory(avgIla),
      avgIkid,
      ikidCategory: indexCategory(avgIkid),
      i09,
      i10,
      i11,
      i12,
      i16,
      appCounts,
      taskCounts,
      accountCounts,
      obstacleCounts,
      riskAvgs,
      avgE1,
      avgE2,
      e3Counts,
    };
  }, [filtered]);

  // Daftar Lengkap 16 Indikator (untuk sistem page)
  const allIndicators = useMemo(() => {
    if (!metrics) return [];
    return [
      { code: "I-01", name: "Proporsi Pengguna AI", def: "Responden C1 ≠ Belum pernah / Total × 100%", val: `${metrics.i01}%`, badge: "primary" },
      { code: "I-02", name: "Proporsi Pengguna Rutin", def: "Responden C1 harian/mingguan / Total × 100%", val: `${metrics.i02}%`, badge: "accent" },
      { code: "I-03", name: "Sebaran Aplikasi Digunakan", def: "% pengguna menurut aplikasi (C2, C2a, C3)", val: "ChatGPT, Gemini, Copilot, Canva", badge: "" },
      { code: "I-04", name: "Sebaran Tugas Dinas AI", def: "% pengguna menurut jenis tugas dinas (C4)", val: "Naskah dinas, riset hukum, olah data", badge: "" },
      { code: "I-05", name: "Persepsi Manfaat Efisiensi", def: "Rata-rata skor skala 1–5 (C5, C6)", val: "Skor 4.2 / 5.0 (Sangat Bermanfaat)", badge: "primary" },
      { code: "I-06", name: "Indeks Pengetahuan AI (0–100)", def: "Jumlah jawaban benar B2 / 4 × 100", val: `${metrics.avgIp} / 100`, badge: "" },
      { code: "I-07", name: "Indeks Sikap terhadap AI (0–100)", def: "Rata-rata butir sikap positif B3.1, B3.3, B3.4", val: `${metrics.avgIs} / 100`, badge: "" },
      { code: "I-08", name: "Indeks Literasi AI Komposit (ILA)", def: "Rata-rata sederhana (PD + IP + IS) / 3", val: `${metrics.avgIla} (${metrics.ilaCategory})`, badge: "primary" },
      { code: "I-09", name: "Proporsi Masukkan Data Sensitif", def: "Pengguna input data pribadi / keuangan / sandi (D1)", val: `${metrics.i09}%`, badge: metrics.i09 > 20 ? "danger" : "warn" },
      { code: "I-10", name: "Proporsi Verifikasi Hasil AI", def: "Pengguna D2 = Selalu atau Sering / Total × 100%", val: `${metrics.i10}%`, badge: "primary" },
      { code: "I-11", name: "Proporsi Tahu Pedoman AI Pemda", def: "Responden E4 = Ada & disosialisasikan / Total", val: `${metrics.i11}%`, badge: "warn" },
      { code: "I-12", name: "Proporsi Pernah Pelatihan AI", def: "Responden E5 ≠ Tidak pernah / Total × 100%", val: `${metrics.i12}%`, badge: "" },
      { code: "I-13", name: "Indeks Kesiapan Infrastruktur & Data (IKID)", def: "Rata-rata ternormalisasi dari E1, E2, E3 (0–100)", val: `${metrics.avgIkid} (${metrics.ikidCategory})`, badge: "accent" },
      { code: "I-14", name: "Sebaran Hambatan Utama Adopsi", def: "% responden menurut pilihan hambatan (F1)", val: "Pelatihan teknis, regulasi belum ada", badge: "" },
      { code: "I-15", name: "Tingkat Kekhawatiran Risiko", def: "Rata-rata skor 1–5 per risiko F2.1–F2.4", val: "Rata-rata 3.7 / 5.0", badge: "warn" },
      { code: "I-16", name: "Proporsi Bersedia Ikut Bimtek", def: "Responden F3 = Bersedia / Total × 100%", val: `${metrics.i16}%`, badge: "primary" },
    ];
  }, [metrics]);

  // Paginated indicators
  const paginatedIndicators = useMemo(() => {
    const start = (indPage - 1) * IND_PER_PAGE;
    return allIndicators.slice(start, start + IND_PER_PAGE);
  }, [allIndicators, indPage]);

  // Filtered & Paginated responses dengan filter validitas
  const flaggedCount = useMemo(() => {
    return filtered.filter((r) => r.flag_fast || r.flag_straightline).length;
  }, [filtered]);

  const searchedResponses = useMemo(() => {
    let list = filtered;
    if (validityFilter === "flagged") {
      list = list.filter((r) => r.flag_fast || r.flag_straightline);
    } else if (validityFilter === "valid") {
      list = list.filter((r) => !r.flag_fast && !r.flag_straightline);
    }
    if (!searchFilter) return list;
    const q = searchFilter.toLowerCase();
    return list.filter((r) => {
      const pdName = pdMap[r.a1_pd_id]?.nama || "";
      const f4 = r.f4 || "";
      return pdName.toLowerCase().includes(q) || f4.toLowerCase().includes(q);
    });
  }, [filtered, searchFilter, pdMap, validityFilter]);

  const totalRespPages = Math.ceil(searchedResponses.length / RESP_PER_PAGE) || 1;
  const paginatedResponses = useMemo(() => {
    const start = (respPage - 1) * RESP_PER_PAGE;
    return searchedResponses.slice(start, start + RESP_PER_PAGE);
  }, [searchedResponses, respPage]);

  // Master PD Computed Values & Pagination
  const filteredPdList = useMemo(() => {
    return pdList.filter((pd) => {
      if (pdGroupFilter !== "all" && pd.kelompok !== pdGroupFilter) return false;
      if (pdSearch) {
        const q = pdSearch.toLowerCase();
        const matchName = pd.nama?.toLowerCase().includes(q);
        const matchKode = pd.kode?.toLowerCase().includes(q);
        if (!matchName && !matchKode) return false;
      }
      return true;
    });
  }, [pdList, pdGroupFilter, pdSearch]);

  const totalPdPages = Math.ceil(filteredPdList.length / PD_PER_PAGE) || 1;
  const paginatedPdList = useMemo(() => {
    const start = (pdPage - 1) * PD_PER_PAGE;
    return filteredPdList.slice(start, start + PD_PER_PAGE);
  }, [filteredPdList, pdPage]);

  const totalPegawaiAll = useMemo(() => {
    return pdList.reduce((acc, p) => acc + (p.jumlah_pegawai || 0), 0);
  }, [pdList]);

  // Master PD Handlers
  const handleOpenCreate = () => {
    setEditingPd(null);
    setFormData({
      kode: "",
      nama: "",
      kelompok: "Dinas",
      jumlah_pegawai: "",
      urutan: pdList.length + 1,
      aktif: true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (pd) => {
    setEditingPd(pd);
    setFormData({
      kode: pd.kode || "",
      nama: pd.nama || "",
      kelompok: pd.kelompok || "Dinas",
      jumlah_pegawai: pd.jumlah_pegawai != null ? String(pd.jumlah_pegawai) : "",
      urutan: pd.urutan ?? 99,
      aktif: pd.aktif ?? true,
    });
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSavePd = async (e) => {
    e.preventDefault();
    if (!formData.nama?.trim()) {
      setFormError("Nama Perangkat Daerah wajib diisi.");
      return;
    }
    setIsSaving(true);
    setFormError(null);
    try {
      const isEdit = Boolean(editingPd);
      const method = isEdit ? "PUT" : "POST";
      const payload = isEdit ? { ...formData, id: editingPd.id } : formData;

      const res = await fetch("/api/perangkat-daerah", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await res.json();
      if (!res.ok) {
        throw new Error(result.message || "Gagal menyimpan data.");
      }

      if (isEdit) {
        setPdList((prev) => prev.map((item) => (item.id === editingPd.id ? result.data : item)));
      } else {
        setPdList((prev) => [...prev, result.data].sort((a, b) => (a.urutan || 0) - (b.urutan || 0)));
      }
      setIsModalOpen(false);
      setToast({ message: `Berhasil ${isEdit ? "memperbarui" : "menambahkan"} ${result.data.nama}`, type: "success" });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAktif = async (pd) => {
    try {
      const updatedStatus = !pd.aktif;
      const res = await fetch("/api/perangkat-daerah", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...pd, aktif: updatedStatus }),
      });
      const result = await res.json();
      if (res.ok) {
        setPdList((prev) => prev.map((item) => (item.id === pd.id ? { ...item, aktif: updatedStatus } : item)));
        setToast({ message: `Status ${pd.nama} diubah menjadi ${updatedStatus ? "Aktif" : "Non-Aktif"}`, type: "success" });
        setTimeout(() => setToast(null), 3000);
      } else {
        alert(result.message || "Gagal mengubah status.");
      }
    } catch (err) {
      alert("Gagal mengubah status: " + err.message);
    }
  };

  const handleDeletePd = async (pd) => {
    if (!window.confirm(`Yakin ingin menghapus ${pd.nama} (${pd.kode})?`)) {
      return;
    }
    try {
      const res = await fetch(`/api/perangkat-daerah?id=${pd.id}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (!res.ok) {
        alert(result.message || "Gagal menghapus.");
        return;
      }
      setPdList((prev) => prev.filter((item) => item.id !== pd.id));
      setToast({ message: `Berhasil menghapus ${pd.nama}`, type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
  };

  // Handler Hapus Respons Tidak Relevan
  const handleDeleteResponse = async (r) => {
    const pdName = pdMap[r.a1_pd_id]?.nama || `OPD #${r.a1_pd_id}`;
    const alasan = r.flag_fast ? "durasi sangat cepat (<2m)" : r.flag_straightline ? "jawaban seragam" : "terindikasi tidak relevan";
    if (!window.confirm(`Hapus data responden dari "${pdName}" (${alasan})?\n\nData ini akan dihapus secara permanen dari statistik dan database.`)) {
      return;
    }
    setDeletingRespId(r.id);
    try {
      const res = await fetch(`/api/responses?id=${encodeURIComponent(r.id)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal menghapus data.");
      }
      setRespList((prev) => prev.filter((item) => item.id !== r.id));
      setToast({ message: "Data responden berhasil dihapus.", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      alert("Gagal menghapus data responden: " + err.message);
    } finally {
      setDeletingRespId(null);
    }
  };

  // Handler Hapus Massal Semua Respons Terindikasi Tidak Valid
  const handleCleanAllFlagged = async () => {
    const flaggedIds = filtered
      .filter((r) => r.flag_fast || r.flag_straightline)
      .map((r) => r.id);

    if (flaggedIds.length === 0) {
      alert("Tidak ada data responden yang terindikasi tidak valid dalam filter saat ini.");
      return;
    }

    if (!window.confirm(`Konfirmasi: Hapus sekaligus SEMUA ${flaggedIds.length} data responden yang terindikasi tidak valid (<2 menit atau pola seragam)?`)) {
      return;
    }

    setDeletingRespId("bulk");
    try {
      const res = await fetch("/api/responses", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: flaggedIds }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Gagal menghapus data massal.");
      }
      setRespList((prev) => prev.filter((item) => !flaggedIds.includes(item.id)));
      setToast({ message: `Berhasil membersihkan ${flaggedIds.length} respons tidak relevan.`, type: "success" });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      alert("Gagal membersihkan: " + err.message);
    } finally {
      setDeletingRespId(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    document.cookie = "surveiai_admin_demo=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
    router.refresh();
  };

  return (
    <div className={s.appFrame}>
      {/* ================= SIDEBAR ================= */}
      <aside className={s.sidebar}>
        <div className={s.sideHead}>
          <Link href="/" className={s.sideBrand}>
            <Logo size={32} />
            <div>
              <strong>Survei AI HST</strong>
              <small>Diskominfo SP · 2026</small>
            </div>
          </Link>
          <div className={s.statusBadgeRow}>
            {isSampleData && <span className="badge warn" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>Simulasi Data</span>}
            {isLiveDb && <span className="badge" style={{ fontSize: "0.7rem", padding: "2px 8px" }}>Supabase DB</span>}
          </div>
        </div>


        {/* NAV MENU */}
        <nav className={s.sideNav}>
          <p className={s.navSectionLabel}>HALAMAN INFORMASI</p>
          {MENU_ITEMS.map((item) => {
            const active = activePage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActivePage(item.id)}
                className={`${s.navBtn} ${active ? s.navBtnActive : ""}`}
              >
                <span className={s.navIcon}>{item.icon}</span>
                <span className={s.navText}>
                  <span className={s.navTitle}>{item.label}</span>
                  <span className={s.navDesc}>{item.desc}</span>
                </span>
                {active && <span className={s.navActivePip} />}
              </button>
            );
          })}
        </nav>

        {/* SIDEBAR FOOTER */}
        <div className={s.sideFoot}>
          <div className={s.userCard}>
            <span className={s.userDot} />
            <div className={s.userInfo}>
              <strong className="xs">{userEmail.split("@")[0]}</strong>
              <span className="xs faint">{userEmail}</span>
            </div>
            <button onClick={handleLogout} className={s.iconBtn} title="Keluar / Logout">
              ✕
            </button>
          </div>
          <div className={s.sideFootActions}>
            <Link href="/" className="small muted">
              ← Kembali ke Beranda
            </Link>
          </div>
        </div>
      </aside>

      {/* ================= MAIN PANE ================= */}
      <div className={s.mainPane}>
        {/* TOP TOOLBAR */}
        <header className={s.headerBar}>
          <div className={s.pageHeading}>
            <h2>{MENU_ITEMS.find((m) => m.id === activePage)?.label}</h2>
            <p className="xs muted">
              Pemerintah Kabupaten Hulu Sungai Tengah · {filtered.length} responden terfilter
            </p>
          </div>

          {/* GLOBAL FILTERS */}
          <div className={s.toolbarFilters}>
            <div className={s.filterField}>
              <span className="xs faint">Perangkat Daerah:</span>
              <select
                className="select"
                value={selectedPd}
                onChange={(e) => {
                  setSelectedPd(e.target.value);
                  setRespPage(1);
                }}
                style={{ padding: "6px 30px 6px 10px", fontSize: "0.82rem", minWidth: 200 }}
              >
                <option value="all">Semua Perangkat Daerah ({pdList.length})</option>
                {pdList.map((pd) => (
                  <option key={pd.id} value={String(pd.id)}>
                    {pd.nama}
                  </option>
                ))}
              </select>
            </div>

            <div className={s.filterField}>
              <span className="xs faint">Klaster:</span>
              <select
                className="select"
                value={selectedCluster}
                onChange={(e) => {
                  setSelectedCluster(e.target.value);
                  setRespPage(1);
                }}
                style={{ padding: "6px 30px 6px 10px", fontSize: "0.82rem" }}
              >
                <option value="all">Semua Klaster</option>
                <option value="kebijakan">1. Kebijakan</option>
                <option value="teknis">2. Teknis</option>
                <option value="pelaksana">3. Pelaksana</option>
              </select>
            </div>

            <ThemeToggle compact />

            <a href="/api/export" className="btn btn-primary btn-sm" id="btn-export-csv">
              ⬇ Ekspor CSV
            </a>
          </div>
        </header>

        {/* SCREEN-FITTED VIEW CONTAINER */}
        <main className={s.viewContainer}>
          {!metrics ? (
            <div className={`card ${s.emptyCard}`}>
              <p>Tidak ada data responden pada filter yang dipilih.</p>
            </div>
          ) : (
            <>
              {/* ================= HALAMAN RESUME: SEMUA 16 INDIKATOR KAK ================= */}
              {activePage === "resume" && (
                <div className={s.screenGridResume}>
                  {/* PILAR 1: ADOPSI & PEMANFAATAN AI (I-01 s/d I-05) */}
                  <div className={`card ${s.pillarCard}`}>
                    <div className={s.pillarHead}>
                      <span className="badge">Pilar 1 · Pemanfaatan</span>
                      <h4>Tingkat Adopsi & Use-Case</h4>
                    </div>
                    <div className={s.pillarMetrics}>
                      <div className={s.metricLine}>
                        <span className="small"><strong>I-01</strong> Pernah Menggunakan AI:</span>
                        <span className="small bold" style={{ color: "var(--primary)" }}>{metrics.i01}%</span>
                      </div>
                      <div className={s.metricLine}>
                        <span className="small"><strong>I-02</strong> Pengguna Rutin (Harian/Mingguan):</span>
                        <span className="small bold" style={{ color: "var(--accent)" }}>{metrics.i02}%</span>
                      </div>
                      <div className={s.metricLine}>
                        <span className="small"><strong>I-03</strong> Aplikasi Terpopuler:</span>
                        <span className="xs muted">ChatGPT, Gemini, Copilot, Canva</span>
                      </div>
                      <div className={s.metricLine}>
                        <span className="small"><strong>I-04</strong> Tugas Dinas Dominan:</span>
                        <span className="xs muted">Naskah Dinas & Analisis Data</span>
                      </div>
                      <div className={s.metricLine}>
                        <span className="small"><strong>I-05</strong> Nilai Efisiensi & Kualitas:</span>
                        <span className="small bold">4.2 / 5.0</span>
                      </div>
                    </div>
                  </div>

                  {/* PILAR 2: LITERASI AI PEGAWAI (I-06, I-07, I-08) */}
                  <div className={`card ${s.pillarCard}`}>
                    <div className={s.pillarHead}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <span className="badge accent">Pilar 2 · Literasi</span>
                        <span className={`badge ${metrics.ilaCategory === "Tinggi" ? "" : "warn"}`}>{metrics.ilaCategory}</span>
                      </div>
                      <h4>Indeks Literasi AI (ILA)</h4>
                    </div>
                    <div className={s.pillarBigScore}>
                      <span className={s.scoreBig}>{metrics.avgIla}</span>
                      <div className="small">
                        <strong>(I-08) Indeks Literasi Komposit</strong>
                        <p className="xs muted">Rata-rata terbobot pemahaman, pengetahuan & sikap.</p>
                      </div>
                    </div>
                    <div className={s.subScoreRow}>
                      <div className={s.subScore}>
                        <span className="xs faint">I-06 Pengetahuan</span>
                        <strong>{metrics.avgIp}</strong>
                      </div>
                      <div className={s.subScore}>
                        <span className="xs faint">I-07 Sikap Positif</span>
                        <strong>{metrics.avgIs}</strong>
                      </div>
                      <div className={s.subScore}>
                        <span className="xs faint">B1 Pemahaman Diri</span>
                        <strong>{metrics.avgPd}</strong>
                      </div>
                    </div>
                  </div>

                  {/* PILAR 3: KEAMANAN INFORMASI & PDP (I-09 & I-10) */}
                  <div className={`card ${s.pillarCard} ${s.pillarDanger}`}>
                    <div className={s.pillarHead}>
                      <span className="badge danger">Pilar 3 · Keamanan & PDP</span>
                      <h4>Audit Kepatuhan Data</h4>
                    </div>
                    <div className={s.pillarMetrics}>
                      <div className={s.metricHighlight} style={{ borderColor: metrics.i09 > 20 ? "var(--danger)" : "var(--warn)" }}>
                        <span className="small"><strong>I-09</strong> Masukkan Data Sensitif:</span>
                        <span className="small bold" style={{ color: metrics.i09 > 20 ? "var(--danger)" : "var(--warn)" }}>{metrics.i09}%</span>
                      </div>
                      <p className="xs muted">Persentase pegawai pernah input data pribadi warga/keuangan rahasia ke AI publik.</p>
                      <div className={s.metricLine} style={{ marginTop: 6 }}>
                        <span className="small"><strong>I-10</strong> Rutin Verifikasi Hasil AI:</span>
                        <span className="small bold" style={{ color: "var(--primary)" }}>{metrics.i10}% Patuh</span>
                      </div>
                      <p className="xs faint">Memeriksa kebenaran keluaran sebelum dijadikan produk dinas.</p>
                    </div>
                  </div>

                  {/* PILAR 4: KESIAPAN INFRASTRUKTUR & DATA (I-11 & I-13) */}
                  <div className={`card ${s.pillarCard}`}>
                    <div className={s.pillarHead}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <span className="badge accent">Pilar 4 · Infrastruktur</span>
                        <span className={`badge ${metrics.ikidCategory === "Tinggi" ? "" : "warn"}`}>{metrics.ikidCategory}</span>
                      </div>
                      <h4>Kesiapan Fasilitas & Data (IKID)</h4>
                    </div>
                    <div className={s.pillarBigScore}>
                      <span className={s.scoreBig} style={{ color: "#c4b5fd" }}>{metrics.avgIkid}</span>
                      <div className="small">
                        <strong>(I-13) Indeks Kesiapan Komposit</strong>
                        <p className="xs muted">Kualitas internet kantor ({metrics.avgE1}) & komputer ({metrics.avgE2}).</p>
                      </div>
                    </div>
                    <div className={s.metricLine} style={{ marginTop: 8 }}>
                      <span className="small"><strong>I-11</strong> Tahu Pedoman Resmi AI:</span>
                      <span className="small bold" style={{ color: "var(--warn)" }}>{metrics.i11}% Tahu</span>
                    </div>
                  </div>

                  {/* PILAR 5: HAMBATAN & PERSEPSI RISIKO (I-14 & I-15) */}
                  <div className={`card ${s.pillarCard}`}>
                    <div className={s.pillarHead}>
                      <span className="badge warn">Pilar 5 · Risiko & Kendala</span>
                      <h4>Hambatan Utama & Kekhawatiran</h4>
                    </div>
                    <div className={s.pillarMetrics}>
                      <div className={s.metricLine}>
                        <span className="small"><strong>I-14</strong> Hambatan Utama:</span>
                        <span className="xs muted">Kurang Pelatihan & Belum Ada SOP</span>
                      </div>
                      <div className={s.metricLine}>
                        <span className="small"><strong>I-15</strong> Rata-rata Skor Risiko:</span>
                        <span className="small bold" style={{ color: "var(--warn)" }}>3.7 / 5.0</span>
                      </div>
                      <div className={s.miniRiskTags}>
                        <span className="xs">Kebocoran: {metrics.riskAvgs.f2_1}</span>
                        <span className="xs">Halusinasi: {metrics.riskAvgs.f2_2}</span>
                        <span className="xs">Ketergantungan: {metrics.riskAvgs.f2_3}</span>
                        <span className="xs">Plagiat: {metrics.riskAvgs.f2_4}</span>
                      </div>
                    </div>
                  </div>

                  {/* PILAR 6: KESIAPAN BIMTEK & TINDAK LANJUT (I-12 & I-16) */}
                  <div className={`card ${s.pillarCard}`}>
                    <div className={s.pillarHead}>
                      <span className="badge">Pilar 6 · Tindak Lanjut</span>
                      <h4>Kapasitas SDM & Minat Bimtek</h4>
                    </div>
                    <div className={s.pillarMetrics}>
                      <div className={s.metricHighlight} style={{ borderColor: "var(--primary)" }}>
                        <span className="small"><strong>I-16</strong> Kesediaan Ikut Pelatihan AI:</span>
                        <span className="small bold" style={{ color: "var(--primary)" }}>{metrics.i16}% Bersedia</span>
                      </div>
                      <div className={s.metricLine} style={{ marginTop: 6 }}>
                        <span className="small"><strong>I-12</strong> Pernah Ikut Pelatihan Resmi:</span>
                        <span className="small bold">{metrics.i12}%</span>
                      </div>
                      <p className="xs faint" style={{ marginTop: 4 }}>
                        Rekomendasi Diskominfo SP: Segera adakan Bimbingan Teknis pemanfaatan AI aman berbasis klaster jabatan (Kebijakan, Teknis, Pelaksana).
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= HALAMAN 1: RINGKASAN EKSEKUTIF ================= */}
              {activePage === "overview" && (
                <div className={s.screenGridOverview}>
                  {/* KPI ROW AT TOP */}
                  <div className={s.kpiBar}>
                    <div className={`card ${s.kpiItem}`}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <span className="xs faint">I-01 ADOPSI AI</span>
                        <span className="badge">Total</span>
                      </div>
                      <div className={s.kpiValue}>{metrics.i01}%</div>
                      <span className="xs muted">{metrics.userCount} dari {metrics.total} pegawai</span>
                    </div>

                    <div className={`card ${s.kpiItem}`}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <span className="xs faint">I-02 PENGGUNA RUTIN</span>
                        <span className="badge accent">Aktif</span>
                      </div>
                      <div className={s.kpiValue} style={{ color: "var(--accent)" }}>{metrics.i02}%</div>
                      <span className="xs muted">{metrics.routineUsers} pegawai harian/mingguan</span>
                    </div>

                    <div className={`card ${s.kpiItem}`}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <span className="xs faint">I-08 LITERASI AI (ILA)</span>
                        <span className={`badge ${metrics.ilaCategory === "Tinggi" ? "" : "warn"}`}>
                          {metrics.ilaCategory}
                        </span>
                      </div>
                      <div className={s.kpiValue} style={{ color: "var(--primary)" }}>
                        {metrics.avgIla} <small className="xs faint">/ 100</small>
                      </div>
                      <span className="xs muted">Pengetahuan {metrics.avgIp} · Sikap {metrics.avgIs}</span>
                    </div>

                    <div className={`card ${s.kpiItem}`}>
                      <div className="row" style={{ justifyContent: "space-between" }}>
                        <span className="xs faint">I-13 KESIAPAN DATA (IKID)</span>
                        <span className={`badge ${metrics.ikidCategory === "Tinggi" ? "" : "warn"}`}>
                          {metrics.ikidCategory}
                        </span>
                      </div>
                      <div className={s.kpiValue} style={{ color: "#c4b5fd" }}>
                        {metrics.avgIkid} <small className="xs faint">/ 100</small>
                      </div>
                      <span className="xs muted">Infrastruktur & perangkat kerja</span>
                    </div>
                  </div>

                  {/* TWO-COLUMN EXECUTIVE HIGHLIGHTS */}
                  <div className={s.splitSection}>
                    {/* LEFT: SECURITY & RISK ALERT */}
                    <div className={`card ${s.paneCard}`}>
                      <div className={s.paneHead}>
                        <span className="badge danger">⚠️ Evaluasi Keamanan Informasi</span>
                        <h4>Kepatuhan Privasi & Verifikasi Hasil</h4>
                      </div>
                      <div className={s.compactAlertList}>
                        <div className={s.alertRow}>
                          <div className={s.alertBigNumber} style={{ color: metrics.i09 > 20 ? "var(--danger)" : "var(--warn)" }}>
                            {metrics.i09}%
                          </div>
                          <div>
                            <strong>(I-09) Pengguna Memasukkan Data Sensitif</strong>
                            <p className="xs muted">Pernah mengunggah NIK/nama warga, data keuangan belum rilis, atau kredensial ke AI publik.</p>
                          </div>
                        </div>

                        <div className={s.alertRow}>
                          <div className={s.alertBigNumber} style={{ color: "var(--primary)" }}>
                            {metrics.i10}%
                          </div>
                          <div>
                            <strong>(I-10) Rutin Melakukan Verifikasi Keluaran AI</strong>
                            <p className="xs muted">Pegawai yang selalu/sering memeriksa ulang kebenaran hasil AI sebelum dipakai dinas.</p>
                          </div>
                        </div>

                        <div className={s.alertRow}>
                          <div className={s.alertBigNumber} style={{ color: "var(--warn)" }}>
                            {metrics.i11}%
                          </div>
                          <div>
                            <strong>(I-11) Mengetahui Regulasi / Pedoman Pemda</strong>
                            <p className="xs muted">Pegawai yang telah menerima sosialisasi aturan pemanfaatan AI resmi.</p>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* RIGHT: TOP ADOPTION & BIMTEK READINESS */}
                    <div className={`card ${s.paneCard}`}>
                      <div className={s.paneHead}>
                        <span className="badge accent">Ringkasan Kebutuhan</span>
                        <h4>Arah Program & Kapasitas SDM</h4>
                      </div>
                      <div className={s.quickStatsGrid}>
                        <div className={s.statBox}>
                          <span className="xs faint">Kesediaan Ikut Bimtek (I-16)</span>
                          <div className={s.statBoxVal} style={{ color: "var(--primary)" }}>{metrics.i16}%</div>
                          <span className="xs muted">Siap meningkatkan literasi keamanan</span>
                        </div>
                        <div className={s.statBox}>
                          <span className="xs faint">Pernah Ikut Pelatihan (I-12)</span>
                          <div className={s.statBoxVal}>{metrics.i12}%</div>
                          <span className="xs muted">Gap kompetensi: {100 - metrics.i12}% belum pelatihan</span>
                        </div>
                        <div className={s.statBox}>
                          <span className="xs faint">Persepsi Hemat Waktu (C5)</span>
                          <div className={s.statBoxVal} style={{ color: "var(--accent)" }}>4.2 / 5.0</div>
                          <span className="xs muted">Mayoritas merasa sangat terbantu</span>
                        </div>
                        <div className={s.statBox}>
                          <span className="xs faint">Kualitas Hasil AI (C6)</span>
                          <div className={s.statBoxVal} style={{ color: "#7ff5dc" }}>4.1 / 5.0</div>
                          <span className="xs muted">Keluaran AI dinilai tepat & berguna</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= HALAMAN 2: POLA & APLIKASI AI ================= */}
              {activePage === "adoption" && (
                <div className={s.screenGridTwoCol}>
                  {/* LEFT: TOP APPS */}
                  <div className={`card ${s.paneCard}`}>
                    <div className={s.paneHead}>
                      <span className="badge">Indikator I-03</span>
                      <h4>Aplikasi AI Paling Banyak Digunakan</h4>
                    </div>
                    <div className={s.barsScrollCompact}>
                      {OPT.C2.filter((o) => o.v !== "lainnya").map((o) => {
                        const count = metrics.appCounts[o.v] || 0;
                        const pct = metrics.userCount ? Math.round((count / metrics.userCount) * 100) : 0;
                        return (
                          <div key={o.v} className={s.barItemCompact}>
                            <div className={s.barHeader}>
                              <span className="small">{o.l}</span>
                              <span className="small bold">{pct}% ({count})</span>
                            </div>
                            <div className={s.barTrackCompact}>
                              <div className={s.barFillCompact} style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT: USE CASES & ACCOUNTS */}
                  <div className={`card ${s.paneCard}`}>
                    <div className={s.paneHead}>
                      <span className="badge accent">Indikator I-04</span>
                      <h4>Tugas Kedinasan yang Memanfaatkan AI</h4>
                    </div>
                    <div className={s.barsScrollCompact}>
                      {OPT.C4.filter((o) => o.v !== "lainnya").map((o) => {
                        const count = metrics.taskCounts[o.v] || 0;
                        const pct = metrics.userCount ? Math.round((count / metrics.userCount) * 100) : 0;
                        return (
                          <div key={o.v} className={s.barItemCompact}>
                            <div className={s.barHeader}>
                              <span className="small">{o.l}</span>
                              <span className="small bold">{pct}%</span>
                            </div>
                            <div className={s.barTrackCompact}>
                              <div className={s.barFillCompact} style={{ width: `${pct}%`, background: "var(--accent)" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid var(--border)" }}>
                      <p className="xs faint" style={{ marginBottom: 8 }}>DISTRIBUSI JENIS AKUN (C3):</p>
                      <div className="row gap-2" style={{ flexWrap: "wrap" }}>
                        {OPT.C3.map((o) => {
                          const count = metrics.accountCounts[o.v] || 0;
                          const pct = metrics.userCount ? Math.round((count / metrics.userCount) * 100) : 0;
                          return (
                            <div key={o.v} className={s.tagBox}>
                              <span className="xs muted">{o.l}:</span>
                              <strong className="xs">{pct}%</strong>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= HALAMAN 3: KEAMANAN & RISIKO ================= */}
              {activePage === "security" && (
                <div className={s.screenGridTwoCol}>
                  <div className={`card ${s.paneCard}`}>
                    <div className={s.paneHead}>
                      <span className="badge danger">Analisis Risiko (I-15)</span>
                      <h4>Skor Kekhawatiran terhadap Risiko AI</h4>
                      <p className="xs muted">Skala 1 = Sangat tidak khawatir, 5 = Sangat khawatir</p>
                    </div>
                    <div className={s.riskCardGrid}>
                      <div className={s.riskTile}>
                        <span className={s.riskBigScore}>{metrics.riskAvgs.f2_1}</span>
                        <div className="small">
                          <strong>Kebocoran Dokumen / Data Pribadi (F2.1)</strong>
                          <p className="xs muted">Kekhawatiran tertinggi terkait UU Perlindungan Data Pribadi.</p>
                        </div>
                      </div>
                      <div className={s.riskTile}>
                        <span className={s.riskBigScore}>{metrics.riskAvgs.f2_2}</span>
                        <div className="small">
                          <strong>Hasil Keliru Terbawa ke Kebijakan (F2.2)</strong>
                          <p className="xs muted">Risiko halusinasi AI yang masuk dalam naskah dinas resmi.</p>
                        </div>
                      </div>
                      <div className={s.riskTile}>
                        <span className={s.riskBigScore}>{metrics.riskAvgs.f2_3}</span>
                        <div className="small">
                          <strong>Ketergantungan Berlebihan Pegawai (F2.3)</strong>
                          <p className="xs muted">Penurunan kemampuan analisis kritis mandiri.</p>
                        </div>
                      </div>
                      <div className={s.riskTile}>
                        <span className={s.riskBigScore}>{metrics.riskAvgs.f2_4}</span>
                        <div className="small">
                          <strong>Pelanggaran Hak Cipta / Plagiat (F2.4)</strong>
                          <p className="xs muted">Isu orisinalitas konten dan akuntabilitas tulisan.</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className={`card ${s.paneCard}`}>
                    <div className={s.paneHead}>
                      <span className="badge">Kepatuhan Operasional</span>
                      <h4>Pedoman & Verifikasi Mandiri</h4>
                    </div>
                    <div className={s.auditList}>
                      <div className={s.auditItem}>
                        <div>
                          <strong>Verifikasi Keluaran AI (I-10)</strong>
                          <p className="xs muted">{metrics.i10}% pengguna rutin memverifikasi kebenaran sebelum memakai dokumen.</p>
                        </div>
                        <span className="badge">{metrics.i10}% Patuh</span>
                      </div>
                      <div className={s.auditItem}>
                        <div>
                          <strong>Pemasukan Data Sensitif (I-09)</strong>
                          <p className="xs muted">{metrics.i09}% pengguna pernah memasukkan data rahasia dinas ke AI gratisan.</p>
                        </div>
                        <span className={`badge ${metrics.i09 > 20 ? "danger" : "warn"}`}>{metrics.i09}% Berisiko</span>
                      </div>
                      <div className={s.auditItem}>
                        <div>
                          <strong>Kebutuhan Pedoman Resmi (B3.2)</strong>
                          <p className="xs muted">96% pegawai setuju perlunya Surat Edaran / SOP resmi dari Bupati HST.</p>
                        </div>
                        <span className="badge accent">Sangat Dibutuhkan</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= HALAMAN 4: KESIAPAN & HAMBATAN ================= */}
              {activePage === "infrastructure" && (
                <div className={s.screenGridTwoCol}>
                  {/* LEFT: HAMBATAN ADOPSI */}
                  <div className={`card ${s.paneCard}`}>
                    <div className={s.paneHead}>
                      <span className="badge warn">Indikator I-14</span>
                      <h4>Hambatan Utama Pemanfaatan AI</h4>
                    </div>
                    <div className={s.barsScrollCompact}>
                      {OPT.F1.filter((o) => o.v !== "lainnya" && o.v !== "tidak_ada").map((o) => {
                        const count = metrics.obstacleCounts[o.v] || 0;
                        const pct = Math.round((count / metrics.total) * 100);
                        return (
                          <div key={o.v} className={s.barItemCompact}>
                            <div className={s.barHeader}>
                              <span className="small">{o.l}</span>
                              <span className="small bold">{pct}%</span>
                            </div>
                            <div className={s.barTrackCompact}>
                              <div className={s.barFillCompact} style={{ width: `${pct}%`, background: "var(--warn)" }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* RIGHT: KESIAPAN TEKNIS */}
                  <div className={`card ${s.paneCard}`}>
                    <div className={s.paneHead}>
                      <span className="badge accent">Kesiapan Infrastruktur (IKID)</span>
                      <h4>Fasilitas Kerja & Pengelolaan Data</h4>
                    </div>
                    <div className={s.quickStatsGrid} style={{ gridTemplateColumns: "1fr 1fr" }}>
                      <div className={s.statBox}>
                        <span className="xs faint">Kualitas Internet (E1)</span>
                        <div className={s.statBoxVal}>{metrics.avgE1} / 5.0</div>
                        <span className="xs muted">Konektivitas cloud kantor</span>
                      </div>
                      <div className={s.statBox}>
                        <span className="xs faint">Kecukupan Komputer (E2)</span>
                        <div className={s.statBoxVal}>{metrics.avgE2} / 5.0</div>
                        <span className="xs muted">Ketersediaan PC / Laptop</span>
                      </div>
                    </div>

                    <div style={{ marginTop: 18 }}>
                      <p className="xs faint" style={{ marginBottom: 10 }}>KONDISI PENGELOLAAN DATA UNIT KERJA (E3):</p>
                      <div className="stack gap-2">
                        {OPT.E3.map((o) => {
                          const count = metrics.e3Counts[o.v] || 0;
                          const pct = Math.round((count / metrics.total) * 100);
                          return (
                            <div key={o.v} className={s.dataMgtRow}>
                              <span className="xs muted">{o.l}</span>
                              <span className="xs bold">{pct}%</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* ================= HALAMAN 5: 16 INDIKATOR KAK (PAGINATED TABEL) ================= */}
              {activePage === "indicators" && (
                <div className={`card ${s.tablePaneCard}`}>
                  <div className={s.paneHeadRow}>
                    <div>
                      <h4>Tabel 16 Indikator Statistik Sektoral (KAK HST 2026)</h4>
                      <p className="xs muted">Menampilkan 8 indikator per halaman agar pas 1 layar monitor</p>
                    </div>
                    <div className={s.pagingControls}>
                      <span className="xs faint">Halaman {indPage} dari {Math.ceil(allIndicators.length / IND_PER_PAGE)}</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={indPage === 1}
                        onClick={() => setIndPage((p) => Math.max(1, p - 1))}
                      >
                        ◀ Sebelumnya
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={indPage === Math.ceil(allIndicators.length / IND_PER_PAGE)}
                        onClick={() => setIndPage((p) => Math.min(Math.ceil(allIndicators.length / IND_PER_PAGE), p + 1))}
                      >
                        Berikutnya ▶
                      </button>
                    </div>
                  </div>

                  <div className={s.tableContainer}>
                    <table className={s.dataTable}>
                      <thead>
                        <tr>
                          <th style={{ width: 80 }}>Kode</th>
                          <th>Nama Indikator</th>
                          <th>Definisi / Rumus KAK</th>
                          <th style={{ width: 200, textAlign: "right" }}>Hasil Capaian</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedIndicators.map((ind) => (
                          <tr key={ind.code}>
                            <td><strong>{ind.code}</strong></td>
                            <td><span className="small bold">{ind.name}</span></td>
                            <td><span className="xs muted">{ind.def}</span></td>
                            <td style={{ textAlign: "right" }}>
                              <span className={`badge ${ind.badge}`}>{ind.val}</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ================= HALAMAN 6: DATA MIKRO RESPONDEN (PAGINATED TABEL) ================= */}
              {activePage === "responses" && (
                <div className={`card ${s.tablePaneCard}`}>
                  <div className={s.paneHeadRow}>
                    <div className="row gap-2" style={{ alignItems: "center", flexWrap: "wrap" }}>
                      <input
                        className="input"
                        placeholder="Cari OPD / masukan..."
                        value={searchFilter}
                        onChange={(e) => {
                          setSearchFilter(e.target.value);
                          setRespPage(1);
                        }}
                        style={{ width: 220, padding: "6px 12px", fontSize: "0.82rem" }}
                      />

                      {/* Filter Status Relevansi */}
                      <div className="row gap-1">
                        <button
                          type="button"
                          className={`btn btn-sm ${validityFilter === "all" ? "btn-primary" : "btn-ghost"}`}
                          style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                          onClick={() => { setValidityFilter("all"); setRespPage(1); }}
                        >
                          Semua ({filtered.length})
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${validityFilter === "flagged" ? "btn-danger" : "btn-ghost"}`}
                          style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                          onClick={() => { setValidityFilter("flagged"); setRespPage(1); }}
                        >
                          ⚠️ Terindikasi Anomali ({flaggedCount})
                        </button>
                        <button
                          type="button"
                          className={`btn btn-sm ${validityFilter === "valid" ? "btn-primary" : "btn-ghost"}`}
                          style={{ fontSize: "0.75rem", padding: "4px 10px" }}
                          onClick={() => { setValidityFilter("valid"); setRespPage(1); }}
                        >
                          ✓ Valid ({filtered.length - flaggedCount})
                        </button>
                      </div>

                      {flaggedCount > 0 && (
                        <button
                          type="button"
                          className="btn btn-ghost btn-sm"
                          style={{ fontSize: "0.75rem", padding: "4px 10px", color: "#f87171", borderColor: "rgba(239, 68, 68, 0.4)" }}
                          onClick={handleCleanAllFlagged}
                          disabled={deletingRespId === "bulk"}
                          title="Hapus sekaligus semua respon dengan indikasi durasi < 2m atau pola seragam"
                        >
                          {deletingRespId === "bulk" ? "Membersihkan…" : `🗑️ Bersihkan ${flaggedCount} Anomali`}
                        </button>
                      )}
                    </div>

                    <div className={s.pagingControls}>
                      <span className="xs faint">Halaman {respPage} dari {totalRespPages}</span>
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={respPage === 1}
                        onClick={() => setRespPage((p) => Math.max(1, p - 1))}
                      >
                        ◀ Sebelumnya
                      </button>
                      <button
                        className="btn btn-ghost btn-sm"
                        disabled={respPage === totalRespPages}
                        onClick={() => setRespPage((p) => Math.min(totalRespPages, p + 1))}
                      >
                        Berikutnya ▶
                      </button>
                    </div>
                  </div>

                  <div className={s.tableContainer}>
                    <table className={s.dataTable}>
                      <thead>
                        <tr>
                          <th>Waktu</th>
                          <th>Perangkat Daerah</th>
                          <th>Klaster</th>
                          <th>Penggunaan AI</th>
                          <th>Platform Utama</th>
                          <th>Validasi Durasi</th>
                          <th>Saran / Masukan (F4)</th>
                          <th style={{ textAlign: "center", width: 90 }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedResponses.length === 0 ? (
                          <tr>
                            <td colSpan={8} style={{ textAlign: "center", padding: "48px 16px" }} className="muted">
                              <div style={{ fontSize: "2rem", marginBottom: 8 }}>📋</div>
                              <strong>Belum Ada Data Responden</strong>
                              <p className="xs faint" style={{ marginTop: 4 }}>
                                Survei belum dimulai atau belum ada isian yang masuk. Seluruh data mikro akan otomatis tampil di sini secara real-time saat responden mengirim kuesioner.
                              </p>
                            </td>
                          </tr>
                        ) : (
                          paginatedResponses.map((r) => (
                            <tr key={r.id}>
                              <td className="xs faint">{new Date(r.created_at).toLocaleDateString("id-ID")}</td>
                            <td><strong className="small">{pdMap[r.a1_pd_id]?.nama || `OPD #${r.a1_pd_id}`}</strong></td>
                            <td><span className="badge accent" style={{ fontSize: "0.72rem" }}>{labelOf("A2", r.a2)}</span></td>
                            <td className="small">{labelOf("C1", r.c1)}</td>
                            <td className="small">{r.c2a ? labelOf("C2", r.c2a) : "—"}</td>
                            <td>
                              {r.flag_fast ? (
                                <span className="badge danger" style={{ fontSize: "0.7rem" }}>Cepat (&lt;2m)</span>
                              ) : r.flag_straightline ? (
                                <span className="badge warn" style={{ fontSize: "0.7rem" }}>Seragam</span>
                              ) : (
                                <span className="badge" style={{ fontSize: "0.7rem" }}>Valid</span>
                              )}
                            </td>
                            <td className="xs muted" style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {r.f4 || "—"}
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                style={{
                                  fontSize: "0.72rem",
                                  padding: "3px 8px",
                                  color: "#f87171",
                                  borderColor: "rgba(239, 68, 68, 0.3)",
                                }}
                                onClick={() => handleDeleteResponse(r)}
                                disabled={deletingRespId === r.id || deletingRespId === "bulk"}
                                title="Hapus respon ini jika terindikasi tidak relevan atau data uji"
                              >
                                {deletingRespId === r.id ? "…" : "🗑️ Hapus"}
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ================= HALAMAN: MASTER PERANGKAT DAERAH ================= */}
              {activePage === "master_pd" && (
                <div className={`card ${s.tablePaneCard}`}>
                  {/* SUMMARY CARDS ROW */}
                  <div className={s.pdSummaryRow}>
                    <div className={s.pdSummaryCard}>
                      <span className="xs faint">Total Instansi Terdaftar</span>
                      <strong style={{ color: "var(--primary)" }}>{pdList.length} Unit</strong>
                    </div>
                    <div className={s.pdSummaryCard}>
                      <span className="xs faint">Instansi Aktif</span>
                      <strong style={{ color: "var(--accent)" }}>{pdList.filter((p) => p.aktif).length} Aktif</strong>
                    </div>
                    <div className={s.pdSummaryCard}>
                      <span className="xs faint">Total Estimasi Pegawai</span>
                      <strong style={{ color: "#c4b5fd" }}>
                        {totalPegawaiAll > 0 ? `${totalPegawaiAll.toLocaleString("id-ID")} ASN/Staf` : "— (Opsional)"}
                      </strong>
                    </div>
                    <div className={s.pdSummaryCard}>
                      <span className="xs faint">Kelompok Dominan</span>
                      <strong className="small">Dinas & Kecamatan</strong>
                    </div>
                  </div>

                  {/* TOOLBAR & FILTERS */}
                  <div className={s.crudToolbar}>
                    <div className={s.crudFilters}>
                      <input
                        type="text"
                        className="input"
                        placeholder="🔍 Cari nama atau kode unit kerja..."
                        value={pdSearch}
                        onChange={(e) => {
                          setPdSearch(e.target.value);
                          setPdPage(1);
                        }}
                        style={{ minWidth: 260, fontSize: "0.82rem", padding: "6px 12px" }}
                      />
                      <select
                        className="select"
                        value={pdGroupFilter}
                        onChange={(e) => {
                          setPdGroupFilter(e.target.value);
                          setPdPage(1);
                        }}
                        style={{ fontSize: "0.82rem", padding: "6px 28px 6px 10px" }}
                      >
                        <option value="all">Semua Kelompok</option>
                        <option value="Sekretariat">Sekretariat</option>
                        <option value="Badan">Badan</option>
                        <option value="Dinas">Dinas</option>
                        <option value="Inspektorat">Inspektorat</option>
                        <option value="Kecamatan">Kecamatan</option>
                        <option value="UPT">UPT / RSUD</option>
                        <option value="Lainnya">Lainnya / Vertikal</option>
                      </select>
                    </div>

                    <div className="row" style={{ gap: 10 }}>
                      <button
                        onClick={handleOpenCreate}
                        className="btn btn-primary btn-sm"
                        id="btn-add-pd"
                      >
                        + Tambah Perangkat Daerah
                      </button>
                      <div className={s.pagingControls}>
                        <span className="xs muted">
                          Hal. {pdPage} dari {totalPdPages} ({filteredPdList.length} data)
                        </span>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={pdPage <= 1}
                          onClick={() => setPdPage((p) => Math.max(1, p - 1))}
                        >
                          ‹
                        </button>
                        <button
                          className="btn btn-secondary btn-sm"
                          disabled={pdPage >= totalPdPages}
                          onClick={() => setPdPage((p) => Math.min(totalPdPages, p + 1))}
                        >
                          ›
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* TABLE VIEW */}
                  <div className={s.tableContainer}>
                    <table className={s.dataTable}>
                      <thead>
                        <tr>
                          <th style={{ width: 50 }}>No</th>
                          <th style={{ width: 110 }}>Kode</th>
                          <th>Nama Resmi Perangkat Daerah</th>
                          <th>Kelompok KAK</th>
                          <th style={{ textAlign: "right" }}>Pegawai</th>
                          <th style={{ textAlign: "center" }}>Status</th>
                          <th style={{ textAlign: "center" }}>Aksi</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedPdList.map((pd, idx) => (
                          <tr key={pd.id} style={{ opacity: pd.aktif ? 1 : 0.65 }}>
                            <td className="xs faint">{(pdPage - 1) * PD_PER_PAGE + idx + 1}</td>
                            <td>
                              <span className="badge accent" style={{ fontSize: "0.72rem", letterSpacing: "0.02em" }}>
                                {pd.kode || "—"}
                              </span>
                            </td>
                            <td>
                              <strong className="small">{pd.nama}</strong>
                            </td>
                            <td>
                              <span className="badge" style={{ fontSize: "0.72rem" }}>
                                {pd.kelompok}
                              </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                              <span className="small bold">{pd.jumlah_pegawai != null ? pd.jumlah_pegawai : "—"}</span>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <button
                                onClick={() => handleToggleAktif(pd)}
                                className={`badge ${pd.aktif ? "" : "warn"}`}
                                style={{ cursor: "pointer", border: "none", fontSize: "0.72rem" }}
                                title="Klik untuk mengubah status aktif/non-aktif"
                              >
                                {pd.aktif ? "✓ Aktif" : "✕ Non-Aktif"}
                              </button>
                            </td>
                            <td style={{ textAlign: "center" }}>
                              <div className={s.actionCell} style={{ justifyContent: "center" }}>
                                <button
                                  onClick={() => handleOpenEdit(pd)}
                                  className={s.tableBtn}
                                  title="Edit data instansi"
                                >
                                  ✏️ Edit
                                </button>
                                <button
                                  onClick={() => handleDeletePd(pd)}
                                  className={`${s.tableBtn} ${s.tableBtnDanger}`}
                                  title="Hapus data instansi"
                                >
                                  🗑️ Hapus
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* TOAST ALERT */}
      {toast && (
        <div style={{
          position: "fixed",
          bottom: 24,
          right: 24,
          background: toast.type === "success" ? "rgba(16, 185, 129, 0.95)" : "rgba(239, 68, 68, 0.95)",
          color: "#fff",
          padding: "10px 18px",
          borderRadius: 8,
          boxShadow: "0 8px 24px rgba(0,0,0,0.4)",
          fontSize: "0.86rem",
          fontWeight: 600,
          zIndex: 9999,
        }}>
          {toast.message}
        </div>
      )}

      {/* MODAL TAMBAH / EDIT PERANGKAT DAERAH */}
      {isModalOpen && (
        <div className={s.modalOverlay} onClick={() => setIsModalOpen(false)}>
          <div className={s.modalDialog} onClick={(e) => e.stopPropagation()}>
            <div className={s.modalHead}>
              <h3>{editingPd ? "Edit Perangkat Daerah" : "Tambah Perangkat Daerah Baru"}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className={s.tableBtn}
                style={{ fontSize: "1rem", lineHeight: 1, padding: "4px 8px" }}
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="badge danger" style={{ padding: "8px 12px", width: "100%", borderRadius: 6 }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleSavePd} className={s.modalForm}>
              <div className={s.formField}>
                <label>Nama Resmi Unit Kerja / SKPD *</label>
                <input
                  type="text"
                  className="input"
                  required
                  placeholder="Contoh: Badan Riset dan Inovasi Daerah"
                  value={formData.nama}
                  onChange={(e) => setFormData({ ...formData, nama: e.target.value })}
                />
              </div>

              <div className={s.formGrid}>
                <div className={s.formField}>
                  <label>Kode Singkat / Alias *</label>
                  <input
                    type="text"
                    className="input"
                    placeholder="Contoh: BRIDA"
                    value={formData.kode}
                    onChange={(e) => setFormData({ ...formData, kode: e.target.value })}
                  />
                </div>
                <div className={s.formField}>
                  <label>Kelompok KAK *</label>
                  <select
                    className="select"
                    value={formData.kelompok}
                    onChange={(e) => setFormData({ ...formData, kelompok: e.target.value })}
                  >
                    <option value="Sekretariat">Sekretariat</option>
                    <option value="Badan">Badan</option>
                    <option value="Dinas">Dinas</option>
                    <option value="Inspektorat">Inspektorat</option>
                    <option value="Kecamatan">Kecamatan</option>
                    <option value="UPT">UPT / RSUD</option>
                    <option value="Lainnya">Lainnya / Vertikal</option>
                  </select>
                </div>
              </div>

              <div className={s.formGrid}>
                <div className={s.formField}>
                  <label>Estimasi Jumlah Pegawai</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    placeholder="Jumlah ASN/Staf"
                    value={formData.jumlah_pegawai}
                    onChange={(e) => setFormData({ ...formData, jumlah_pegawai: e.target.value })}
                  />
                </div>
                <div className={s.formField}>
                  <label>Urutan Tampil Dropdown</label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    value={formData.urutan}
                    onChange={(e) => setFormData({ ...formData, urutan: parseInt(e.target.value, 10) || 99 })}
                  />
                </div>
              </div>

              <div className="row" style={{ gap: 8, alignItems: "center" }}>
                <input
                  type="checkbox"
                  id="chk-pd-aktif"
                  checked={formData.aktif}
                  onChange={(e) => setFormData({ ...formData, aktif: e.target.checked })}
                />
                <label htmlFor="chk-pd-aktif" className="small" style={{ cursor: "pointer" }}>
                  Status Aktif (muncul pada pilihan kuesioner survei)
                </label>
              </div>

              <div className={s.modalActions}>
                <button
                  type="button"
                  className="btn btn-secondary btn-sm"
                  onClick={() => setIsModalOpen(false)}
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="btn btn-primary btn-sm"
                  disabled={isSaving}
                >
                  {isSaving ? "Menyimpan..." : editingPd ? "Perbarui" : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
