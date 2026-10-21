/**
 * Definisi kuesioner, aturan alur (skip logic), validasi, dan rumus indeks.
 * Sumber: KAK dan Instrumen Survei Pemanfaatan AI Pemkab HST 2026
 *   - Bagian II  : Instrumen / Kuesioner (PS, A1–F4)
 *   - Lampiran 1 : Alur pertanyaan (skip logic)
 *   - Lampiran 2 : Kunci jawaban dan rumus indeks komposit
 *
 * Modul ini dipakai bersama oleh formulir survei (client), API submit (server),
 * dashboard, dan ekspor CSV, sehingga aturan hanya didefinisikan di satu tempat.
 */

export const PERIODE = 2026;
export const F4_MAX = 500;
export const LAINNYA_MAX = 100;
export const FAST_THRESHOLD_SEC = 120; // < 2 menit dianggap tidak wajar (KAK N.1)

/* ------------------------------------------------------------------ */
/* Opsi jawaban                                                        */
/* ------------------------------------------------------------------ */

export const OPT = {
  A2: [
    {
      v: "kebijakan",
      l: "Pimpinan / pengambil kebijakan",
      d: "Pimpinan tinggi pratama, Kepala dan Sekretaris Perangkat Daerah, Camat, pejabat administrator",
    },
    {
      v: "teknis",
      l: "Teknis",
      d: "Pranata Komputer, pengelola data dan informasi, administrator aplikasi / website, operator / walidata pendukung, termasuk tenaga non-ASN",
    },
    {
      v: "pelaksana",
      l: "Pelaksana",
      d: "Pejabat pengawas, pejabat fungsional lainnya, staf administrasi, petugas pelayanan publik, tenaga non-ASN lainnya",
    },
  ],
  A3: [
    { v: "pns", l: "PNS" },
    { v: "pppk", l: "PPPK" },
    { v: "pppk_pw", l: "PPPK paruh waktu" },
    { v: "non_asn", l: "Tenaga non-ASN (honorer / kontrak, harian lepas, tenaga ahli, alih daya)" },
    { v: "lainnya", l: "Lainnya", other: true },
  ],
  A4: [
    { v: "20_30", l: "20–30 tahun" },
    { v: "31_40", l: "31–40 tahun" },
    { v: "41_50", l: "41–50 tahun" },
    { v: "50_plus", l: "Di atas 50 tahun" },
  ],
  A5: [
    { v: "L", l: "Laki-laki" },
    { v: "P", l: "Perempuan" },
  ],
  B2_ANSWER: [
    { v: "benar", l: "Benar" },
    { v: "salah", l: "Salah" },
    { v: "tidak_tahu", l: "Tidak tahu" },
  ],
  C1: [
    { v: "harian", l: "Setiap hari" },
    { v: "mingguan", l: "Beberapa kali seminggu" },
    { v: "bulanan", l: "Beberapa kali sebulan" },
    { v: "jarang", l: "Jarang (kurang dari sekali sebulan)" },
    { v: "belum", l: "Belum pernah" },
  ],
  C2: [
    { v: "chatgpt", l: "ChatGPT (OpenAI)" },
    { v: "gemini", l: "Gemini (Google)" },
    { v: "claude", l: "Claude (Anthropic)" },
    { v: "copilot", l: "Microsoft Copilot" },
    { v: "metaai", l: "Meta AI (WhatsApp / Instagram)" },
    { v: "deepseek", l: "DeepSeek" },
    { v: "grok", l: "Grok" },
    { v: "perplexity", l: "Perplexity" },
    { v: "desain", l: "Aplikasi AI desain atau presentasi (Canva AI, Gamma, dan sejenisnya)" },
    { v: "lainnya", l: "Aplikasi AI lainnya", other: true },
  ],
  C3: [
    { v: "gratis", l: "Gratis (akun pribadi)" },
    { v: "berbayar", l: "Berbayar (langganan pribadi)" },
    { v: "instansi", l: "Disediakan oleh kantor / instansi" },
    { v: "campuran", l: "Campuran / tidak menentu" },
  ],
  C4: [
    { v: "naskah", l: "Menyusun draf naskah dinas, sambutan, atau laporan" },
    { v: "referensi", l: "Mencari referensi atau menyusun kajian kebijakan / aturan hukum" },
    { v: "data", l: "Mengolah dan menganalisis data angka / tabel" },
    { v: "paparan", l: "Membuat bahan paparan, infografis, atau desain media" },
    { v: "ringkasan", l: "Menerjemahkan atau merangkum dokumen, serta membuat notulensi rapat" },
    { v: "kode", l: "Membuat kode, formula, atau otomasi pekerjaan" },
    { v: "konten", l: "Menyiapkan konten layanan atau informasi publik / media sosial" },
    { v: "lainnya", l: "Lainnya", other: true },
  ],
  C7: [
    { v: "tidak_tahu_cara", l: "Belum mengetahui cara menggunakannya" },
    { v: "tidak_butuh", l: "Tidak membutuhkan untuk tugas saya" },
    { v: "aturan", l: "Khawatir melanggar aturan / belum ada pedoman" },
    { v: "keamanan", l: "Khawatir keamanan data" },
    { v: "perangkat", l: "Tidak ada perangkat / jaringan yang mendukung" },
    { v: "tidak_percaya", l: "Tidak percaya pada hasil AI" },
    { v: "lainnya", l: "Lainnya", other: true },
  ],
  D1: [
    { v: "publik", l: "Informasi yang sudah terbuka untuk umum" },
    { v: "umum", l: "Konsep / tulisan umum tanpa data spesifik instansi" },
    { v: "internal", l: "Dokumen internal yang tidak bersifat rahasia" },
    { v: "pribadi", l: "Data pribadi (nama, NIK, alamat warga atau pegawai)", sensitive: true },
    {
      v: "keuangan_rahasia",
      l: "Data keuangan / anggaran yang belum dipublikasikan, atau dokumen berklasifikasi rahasia / terbatas",
      sensitive: true,
    },
    { v: "kode_sandi", l: "Kode program, kata sandi, atau konfigurasi sistem", sensitive: true },
    { v: "tidak_pernah", l: "Saya tidak pernah memasukkan data dinas", exclusive: true },
  ],
  D2: [
    { v: "selalu", l: "Selalu" },
    { v: "sering", l: "Sering" },
    { v: "kadang", l: "Kadang-kadang" },
    { v: "tidak_pernah", l: "Tidak pernah" },
  ],
  E3: [
    { v: "terpusat", l: "Sebagian besar data sudah digital, terstruktur, dan terpusat" },
    { v: "tersebar", l: "Data sudah digital tetapi tersebar di masing-masing komputer pegawai" },
    { v: "fisik", l: "Sebagian besar data masih berupa dokumen fisik / kertas" },
    { v: "tidak_tahu", l: "Tidak tahu" },
  ],
  E4: [
    { v: "ada_sosialisasi", l: "Ada dan sudah disosialisasikan" },
    { v: "ada_belum", l: "Ada tetapi belum disosialisasikan" },
    { v: "belum_ada", l: "Belum ada" },
    { v: "tidak_tahu", l: "Tidak tahu" },
  ],
  E5: [
    { v: "instansi", l: "Ya, diselenggarakan instansi / pemerintah" },
    { v: "mandiri", l: "Ya, secara mandiri atau dari pihak lain" },
    { v: "tidak_pernah", l: "Tidak pernah" },
  ],
  F1: [
    { v: "pengetahuan", l: "Kurangnya pengetahuan / belum ada pelatihan teknis" },
    { v: "infrastruktur", l: "Infrastruktur (internet / komputer) tidak mendukung" },
    { v: "aturan", l: "Khawatir melanggar aturan karena belum ada pedoman / SOP dari Pemda" },
    { v: "keamanan", l: "Kekhawatiran tentang keamanan data instansi" },
    { v: "akun_biaya", l: "Tidak ada akun / perangkat resmi atau biaya langganan" },
    { v: "kualitas", l: "Kualitas hasil AI diragukan" },
    { v: "pimpinan", l: "Dukungan pimpinan belum ada" },
    { v: "tidak_ada", l: "Tidak ada hambatan", exclusive: true },
    { v: "lainnya", l: "Lainnya", other: true },
  ],
  F3: [
    { v: "bersedia", l: "Bersedia" },
    { v: "ragu", l: "Ragu-ragu" },
    { v: "tidak", l: "Tidak bersedia" },
  ],
};

/** Butir B2 (pengetahuan) beserta kunci jawaban — Lampiran 2, Tabel 19. */
export const B2_ITEMS = [
  { k: "b2_1", t: "Aplikasi AI generatif dapat menghasilkan jawaban yang tampak meyakinkan tetapi ternyata keliru.", key: "benar" },
  { k: "b2_2", t: "Informasi yang dimasukkan ke aplikasi AI publik dapat disimpan atau diproses oleh penyedia layanan.", key: "benar" },
  { k: "b2_3", t: "Hasil keluaran AI pasti akurat sehingga tidak perlu diperiksa kembali.", key: "salah" },
  { k: "b2_4", t: "Dokumen dinas yang bersifat rahasia aman diunggah ke aplikasi AI publik yang gratis.", key: "salah" },
];

/** Butir B3 (sikap). B3.2 dilaporkan terpisah, tidak masuk Indeks Sikap. */
export const B3_ITEMS = [
  { k: "b3_1", t: "AI dapat membantu meningkatkan efisiensi pekerjaan pegawai." },
  { k: "b3_2", t: "Penggunaan AI di lingkungan Pemkab perlu diatur dalam pedoman resmi." },
  { k: "b3_3", t: "Hasil keluaran AI harus selalu diperiksa manusia sebelum dipakai dalam dokumen dinas." },
  { k: "b3_4", t: "Saya tertarik meningkatkan kemampuan menggunakan AI untuk mendukung tugas saya." },
];

export const F2_ITEMS = [
  { k: "f2_1", t: "Kebocoran data / dokumen instansi atau data pribadi ke platform AI publik" },
  { k: "f2_2", t: "Hasil AI yang keliru terbawa ke dokumen atau kebijakan" },
  { k: "f2_3", t: "Ketergantungan berlebihan pada AI" },
  { k: "f2_4", t: "Pelanggaran hak cipta / plagiarisme" },
];

export const SCALE_LABELS = {
  B1: ["Sangat tidak paham", "Sangat paham"],
  B3: ["Sangat tidak setuju", "Sangat setuju"],
  C5: ["Tidak menghemat sama sekali", "Sangat menghemat waktu"],
  C6: ["Sangat tidak tepat / berguna", "Sangat tepat / berguna"],
  E1: ["Sangat buruk", "Sangat baik"],
  E2: ["Sangat tidak memadai", "Sangat memadai"],
  F2: ["Sangat tidak khawatir", "Sangat khawatir"],
};

export const SENSITIVE_D1 = OPT.D1.filter((o) => o.sensitive).map((o) => o.v);

export function labelOf(group, value) {
  const o = OPT[group]?.find((x) => x.v === value);
  return o ? o.l : value ?? "";
}

/* ------------------------------------------------------------------ */
/* Skip logic                                                          */
/* ------------------------------------------------------------------ */

/** Lampiran 1: C1 = "Belum pernah" → lewati C2–C6 & Seksi D, tampilkan C7. */
export const isUser = (c1) => !!c1 && c1 !== "belum";

/** C2a hanya menampilkan aplikasi yang dipilih pada C2. */
export function c2aOptions(c2 = [], c2Lain = "") {
  return OPT.C2.filter((o) => c2.includes(o.v)).map((o) =>
    o.v === "lainnya" && c2Lain ? { ...o, l: `Lainnya: ${c2Lain}` } : o
  );
}

/** Opsi eksklusif (D1 "tidak pernah", F1 "tidak ada hambatan"). */
export function toggleMulti(group, current = [], value, max) {
  const opt = OPT[group].find((o) => o.v === value);
  const has = current.includes(value);
  if (has) return current.filter((v) => v !== value);
  if (opt?.exclusive) return [value];
  const exclusive = OPT[group].filter((o) => o.exclusive).map((o) => o.v);
  const next = current.filter((v) => !exclusive.includes(v));
  if (max && next.length >= max) return next; // batas maksimal tercapai
  return [...next, value];
}

/* ------------------------------------------------------------------ */
/* Validasi (dipakai server sebelum menyimpan)                         */
/* ------------------------------------------------------------------ */

const inOpts = (group, v) => OPT[group].some((o) => o.v === v);
const isScale = (v) => Number.isInteger(v) && v >= 1 && v <= 5;
const cleanText = (s, max) =>
  typeof s === "string" ? s.replace(/\s+/g, " ").trim().slice(0, max) : "";

function checkMulti(errors, field, group, arr, { max, otherText } = {}) {
  if (!Array.isArray(arr) || arr.length === 0) {
    errors[field] = "Pilih minimal satu jawaban.";
    return;
  }
  if (arr.some((v) => !inOpts(group, v)) || new Set(arr).size !== arr.length) {
    errors[field] = "Pilihan tidak valid.";
    return;
  }
  const excl = OPT[group].filter((o) => o.exclusive).map((o) => o.v);
  if (arr.length > 1 && arr.some((v) => excl.includes(v))) {
    errors[field] = "Opsi eksklusif tidak dapat dipilih bersama opsi lain.";
  }
  if (max && arr.length > max) errors[field] = `Pilih maksimal ${max} jawaban.`;
  if (arr.includes("lainnya") && !otherText) errors[`${field}_lain`] = "Sebutkan isian lainnya.";
}

/**
 * Validasi per seksi — dipakai formulir (per langkah) dan server (seluruhnya).
 * @returns {Record<string,string>} peta field → pesan galat
 */
export function validateSection(section, a, { pdIds } = {}) {
  const e = {};
  const user = isUser(a.c1);
  switch (section) {
    case "A":
      if (!Number.isInteger(a.a1_pd_id) || (pdIds && !pdIds.has(a.a1_pd_id)))
        e.a1_pd_id = "Pilih Perangkat Daerah / unit kerja.";
      if (!inOpts("A2", a.a2)) e.a2 = "Pilih klaster jabatan.";
      if (!inOpts("A3", a.a3)) e.a3 = "Pilih status kepegawaian.";
      else if (a.a3 === "lainnya" && !cleanText(a.a3_lain, LAINNYA_MAX)) e.a3_lain = "Sebutkan status kepegawaian.";
      if (!inOpts("A4", a.a4)) e.a4 = "Pilih kelompok umur.";
      if (!inOpts("A5", a.a5)) e.a5 = "Pilih jenis kelamin.";
      break;
    case "B1":
      if (!isScale(a.b1)) e.b1 = "Pilih salah satu skala.";
      for (const it of B2_ITEMS) if (!inOpts("B2_ANSWER", a[it.k])) e[it.k] = "Pilih jawaban.";
      break;
    case "B3":
      for (const it of B3_ITEMS) if (!isScale(a[it.k])) e[it.k] = "Pilih skala.";
      break;
    case "C1":
      if (!inOpts("C1", a.c1)) e.c1 = "Pilih frekuensi penggunaan.";
      break;
    case "C":
      if (user) {
        checkMulti(e, "c2", "C2", a.c2, { otherText: cleanText(a.c2_lain, LAINNYA_MAX) });
        if (!e.c2 && !(a.c2 || []).includes(a.c2a)) e.c2a = "Pilih aplikasi yang paling sering digunakan.";
        if (!inOpts("C3", a.c3)) e.c3 = "Pilih jenis akun.";
        checkMulti(e, "c4", "C4", a.c4, { otherText: cleanText(a.c4_lain, LAINNYA_MAX) });
        if (!isScale(a.c5)) e.c5 = "Pilih skala.";
        if (!isScale(a.c6)) e.c6 = "Pilih skala.";
      } else {
        checkMulti(e, "c7", "C7", a.c7, { max: 3, otherText: cleanText(a.c7_lain, LAINNYA_MAX) });
      }
      break;
    case "D":
      if (user) {
        checkMulti(e, "d1", "D1", a.d1);
        if (!inOpts("D2", a.d2)) e.d2 = "Pilih jawaban.";
      }
      break;
    case "E":
      if (!isScale(a.e1)) e.e1 = "Pilih skala.";
      if (!isScale(a.e2)) e.e2 = "Pilih skala.";
      if (!inOpts("E3", a.e3)) e.e3 = "Pilih jawaban.";
      if (!inOpts("E4", a.e4)) e.e4 = "Pilih jawaban.";
      if (!inOpts("E5", a.e5)) e.e5 = "Pilih jawaban.";
      break;
    case "F":
      checkMulti(e, "f1", "F1", a.f1, { max: 3, otherText: cleanText(a.f1_lain, LAINNYA_MAX) });
      for (const it of F2_ITEMS) if (!isScale(a[it.k])) e[it.k] = "Pilih skala.";
      if (!inOpts("F3", a.f3)) e.f3 = "Pilih jawaban.";
      if (typeof a.f4 === "string" && a.f4.length > F4_MAX) e.f4 = `Maksimal ${F4_MAX} karakter.`;
      break;
  }
  return e;
}

export const SECTIONS = ["A", "B1", "B3", "C1", "C", "D", "E", "F"];

/**
 * Validasi lengkap + normalisasi menjadi baris tabel `responses`.
 * Field di luar alur (mis. C2–C6 untuk non-pengguna) dipaksa null.
 */
export function buildResponseRow(a, { pdIds } = {}) {
  const errors = {};
  for (const s of SECTIONS) Object.assign(errors, validateSection(s, a, { pdIds }));
  if (Object.keys(errors).length) return { errors };

  const user = isUser(a.c1);
  const multi = (arr) => (Array.isArray(arr) ? [...arr] : null);
  const other = (arr, txt) => (arr?.includes("lainnya") ? cleanText(txt, LAINNYA_MAX) : null);

  const row = {
    a1_pd_id: a.a1_pd_id,
    a2: a.a2,
    a3: a.a3,
    a3_lain: a.a3 === "lainnya" ? cleanText(a.a3_lain, LAINNYA_MAX) : null,
    a4: a.a4,
    a5: a.a5,
    b1: a.b1,
    b2_1: a.b2_1, b2_2: a.b2_2, b2_3: a.b2_3, b2_4: a.b2_4,
    b3_1: a.b3_1, b3_2: a.b3_2, b3_3: a.b3_3, b3_4: a.b3_4,
    c1: a.c1,
    c2: user ? multi(a.c2) : null,
    c2_lain: user ? other(a.c2, a.c2_lain) : null,
    c2a: user ? a.c2a : null,
    c3: user ? a.c3 : null,
    c4: user ? multi(a.c4) : null,
    c4_lain: user ? other(a.c4, a.c4_lain) : null,
    c5: user ? a.c5 : null,
    c6: user ? a.c6 : null,
    c7: user ? null : multi(a.c7),
    c7_lain: user ? null : other(a.c7, a.c7_lain),
    d1: user ? multi(a.d1) : null,
    d2: user ? a.d2 : null,
    e1: a.e1, e2: a.e2, e3: a.e3, e4: a.e4, e5: a.e5,
    f1: multi(a.f1),
    f1_lain: other(a.f1, a.f1_lain),
    f2_1: a.f2_1, f2_2: a.f2_2, f2_3: a.f2_3, f2_4: a.f2_4,
    f3: a.f3,
    f4: cleanText(a.f4, F4_MAX) || null,
  };

  // Indikasi pola jawaban seragam (straight-lining) pada seluruh butir Likert ganda.
  const likert = [...B3_ITEMS, ...F2_ITEMS].map((it) => a[it.k]);
  row.flag_straightline = likert.every((v) => v === likert[0]);

  return { row };
}

/* ------------------------------------------------------------------ */
/* Indeks komposit — Lampiran 2, Tabel 20                              */
/* ------------------------------------------------------------------ */

const norm = (x) => ((x - 1) / 4) * 100;
const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : null);
const E3_SCORE = { terpusat: 100, tersebar: 50, fisik: 0 }; // "tidak_tahu" dikeluarkan

export function computeIndices(r) {
  const ip = (B2_ITEMS.filter((it) => r[it.k] === it.key).length / 4) * 100;
  const pd = isScale(r.b1) ? norm(r.b1) : null;
  const is = mean(["b3_1", "b3_3", "b3_4"].filter((k) => isScale(r[k])).map((k) => norm(r[k])));
  const ila = pd != null && is != null ? (pd + ip + is) / 3 : null;
  const ikidParts = [];
  if (isScale(r.e1)) ikidParts.push(norm(r.e1));
  if (isScale(r.e2)) ikidParts.push(norm(r.e2));
  if (r.e3 in E3_SCORE) ikidParts.push(E3_SCORE[r.e3]);
  const ikid = mean(ikidParts);
  return { ip, pd, is, ila, ikid };
}

/** Kategori usulan: < 40 rendah; 40–69 sedang; ≥ 70 tinggi. */
export function indexCategory(v) {
  if (v == null || Number.isNaN(v)) return null;
  if (v < 40) return "Rendah";
  if (v < 70) return "Sedang";
  return "Tinggi";
}
