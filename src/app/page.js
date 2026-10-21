import Link from "next/link";
import { connection } from "next/server";
import { isSupabaseConfigured, publicClient } from "@/lib/supabase";
import { PERIODE } from "@/lib/survey";
import { Logo } from "@/components/Logo";
import s from "./page.module.css";

export const instant = false;

async function getStats() {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await publicClient().rpc("public_stats", { p_periode: PERIODE });
    if (error) return null;
    return data;
  } catch {
    return null;
  }
}

const SECTIONS = [
  { k: "A", t: "Identitas Responden", d: "Perangkat Daerah, klaster jabatan, status, umur" },
  { k: "B", t: "Literasi & Sikap", d: "Pemahaman, pengetahuan dasar, dan sikap terhadap AI" },
  { k: "C", t: "Pemanfaatan AI", d: "Frekuensi, aplikasi, dan tugas dinas yang dibantu AI" },
  { k: "D", t: "Keamanan Informasi", d: "Jenis data yang dimasukkan dan verifikasi hasil" },
  { k: "E", t: "Kesiapan", d: "Internet, perangkat, pengelolaan data, pedoman, pelatihan" },
  { k: "F", t: "Hambatan & Harapan", d: "Hambatan, persepsi risiko, dan kesediaan Bimtek" },
];

const GOALS = [
  { i: "◎", t: "Literasi AI", d: "Mengukur pemahaman, pengetahuan, dan sikap pegawai melalui Indeks Literasi AI." },
  { i: "◇", t: "Pola Pemanfaatan", d: "Memetakan tingkat, intensitas, dan kasus penggunaan AI untuk tugas kedinasan." },
  { i: "⬡", t: "Keamanan Informasi", d: "Mengidentifikasi praktik terkait jenis data yang dimasukkan dan verifikasi hasil." },
  { i: "▣", t: "Kesiapan Infrastruktur", d: "Mengukur kesiapan internet, perangkat, dan data melalui Indeks Kesiapan (IKID)." },
  { i: "△", t: "Hambatan Adopsi", d: "Mengenali hambatan teknis, regulasi, dan sumber daya manusia." },
  { i: "✦", t: "Kebutuhan Pegawai", d: "Menghimpun masukan sebagai dasar pedoman dan program Bimbingan Teknis." },
];

const FAQ = [
  {
    q: "Apakah saya tetap perlu mengisi jika belum pernah menggunakan AI?",
    a: "Ya. Jawaban Anda sama pentingnya. Kuesioner akan otomatis menyesuaikan pertanyaan, sehingga Anda tidak akan ditanya hal yang tidak relevan.",
  },
  {
    q: "Apakah jawaban saya bisa dilacak ke diri saya?",
    a: "Tidak. Survei ini tidak menanyakan nama, NIP, NIK, atau kontak. Hasil hanya dipublikasikan dalam bentuk agregat, dan sel tabel dengan kurang dari 5 responden disamarkan.",
  },
  {
    q: "Apakah jawaban memengaruhi penilaian kinerja?",
    a: "Tidak sama sekali. Data digunakan semata-mata untuk keperluan statistik dan penyusunan kebijakan pemanfaatan AI yang aman.",
  },
  {
    q: "Bagaimana jika koneksi terputus saat mengisi?",
    a: "Jawaban tersimpan otomatis di perangkat Anda. Buka kembali tautan survei pada perangkat yang sama untuk melanjutkan.",
  },
  {
    q: "Siapa saja yang boleh mengisi?",
    a: "Seluruh pegawai aktif di lingkungan Pemkab HST: PNS, PPPK, PPPK paruh waktu, serta tenaga non-ASN (honorer/kontrak, harian lepas, tenaga ahli, alih daya). Cukup satu kali per orang.",
  },
];

const fmt = (n) => new Intl.NumberFormat("id-ID").format(n ?? 0);

export default async function Home() {
  await connection();
  const stats = await getStats();

  return (
    <>
      <header className={s.nav}>
        <div className={`container ${s.navInner}`}>
          <Link href="/" className={s.brand} aria-label="Beranda Survei AI HST">
            <Logo />
            <span>
              <strong>Survei AI</strong>
              <small>Pemkab HST 2026</small>
            </span>
          </Link>
          <nav className={s.links} aria-label="Navigasi utama">
            <a href="#tujuan">Tujuan</a>
            <a href="#alur">Alur</a>
            <a href="#kerahasiaan">Kerahasiaan</a>
            <a href="#faq">FAQ</a>
          </nav>
          <div className="row gap-2">
            <Link href="/login" className="btn btn-ghost btn-sm" id="nav-login">
              Dashboard
            </Link>
            <Link href="/survei" className="btn btn-primary btn-sm" id="nav-survey">
              Isi Survei
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className={`container ${s.hero}`}>
          <div className={s.heroCopy}>
            <h1 className={`${s.h1} fade-up`}>
              Membangun <span className="grad-text">pemanfaatan AI</span> yang aman dan bermanfaat bagi
              Pemkab Hulu Sungai Tengah
            </h1>
            <p className={`${s.lead} fade-up delay-2`}>
              Survei Pemanfaatan Artificial Intelligence Tahun 2026 oleh Diskominfo SP. Suara Anda menjadi data dasar
              penyusunan pedoman, program Bimtek, dan arah platform AI internal pemerintah daerah.
            </p>
            <div className={`row gap-2 ${s.ctaRow} fade-up delay-3`}>
              <Link href="/survei" className="btn btn-primary btn-lg" id="hero-start">
                Mulai Isi Survei <span className="arrow">→</span>
              </Link>
              <a href="#alur" className="btn btn-ghost btn-lg">
                Pelajari Alur
              </a>
            </div>
            <dl className={`${s.meta} fade-up delay-4`}>
              <div>
                <dt>5–7</dt>
                <dd>menit pengisian</dd>
              </div>
              <div>
                <dt>100%</dt>
                <dd>anonim</dd>
              </div>
              <div>
                <dt>6</dt>
                <dd>seksi pertanyaan</dd>
              </div>
            </dl>
          </div>

          <aside className={`card ${s.heroCard} fade-up delay-2`} aria-label="Ringkasan kuesioner">
            <div className={s.heroCardHead}>
              <div>
                <p className="xs faint">PARTISIPASI SAAT INI</p>
                <p className={s.bigNum}>{stats ? fmt(stats.responden) : "—"}</p>
                <p className="small muted">
                  responden{stats ? ` dari ${fmt(stats.perangkat_daerah)} Perangkat Daerah` : ""}
                </p>
              </div>
              <span className="badge accent">Live</span>
            </div>
            <ol className={s.sectionList}>
              {SECTIONS.map((x) => (
                <li key={x.k}>
                  <span className={s.secKey}>{x.k}</span>
                  <span>
                    <strong>{x.t}</strong>
                    <small>{x.d}</small>
                  </span>
                </li>
              ))}
            </ol>
          </aside>
        </section>

        {/* TUJUAN */}
        <section id="tujuan" className={`container ${s.section}`}>
          <div className={s.sectionHead}>
            <span className="badge accent">Tujuan Survei</span>
            <h2>Data dasar untuk kebijakan berbasis bukti</h2>
            <p className="muted">
              Belum ada data terukur mengenai literasi, praktik, dan kesiapan pemanfaatan AI di lingkungan Pemkab HST.
              Survei ini menghasilkan 16 indikator statistik sektoral sebagai landasan faktual.
            </p>
          </div>
          <div className={s.goalGrid}>
            {GOALS.map((g, i) => (
              <article key={g.t} className={`card ${s.goal}`} style={{ animationDelay: `${i * 60}ms` }}>
                <span className={s.goalIcon} aria-hidden="true">
                  {g.i}
                </span>
                <h3>{g.t}</h3>
                <p className="muted small">{g.d}</p>
              </article>
            ))}
          </div>
        </section>

        {/* ALUR */}
        <section id="alur" className={`container ${s.section}`}>
          <div className={s.sectionHead}>
            <span className="badge">Alur Pengisian</span>
            <h2>Empat langkah sederhana</h2>
          </div>
          <ol className={s.steps}>
            {[
              ["Persetujuan", "Baca penjelasan singkat dan nyatakan kesediaan secara sukarela."],
              ["Identitas umum", "Pilih Perangkat Daerah dan karakteristik — tanpa nama atau NIP."],
              ["Isi kuesioner", "Pertanyaan otomatis menyesuaikan pengalaman Anda dengan AI."],
              ["Selesai", "Kirim jawaban. Terima kasih atas kontribusi Anda!"],
            ].map(([t, d], i) => (
              <li key={t} className={s.step}>
                <span className={s.stepNum}>{String(i + 1).padStart(2, "0")}</span>
                <h3>{t}</h3>
                <p className="muted small">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* KERAHASIAAN */}
        <section id="kerahasiaan" className={`container ${s.section}`}>
          <div className={`card ${s.privacy}`}>
            <div>
              <span className="badge">Kerahasiaan Terjamin</span>
              <h2>Jawaban Anda aman dan tidak berkaitan dengan penilaian kinerja</h2>
              <p className="muted">
                Dijamin sesuai Undang-Undang Nomor 16 Tahun 1997 tentang Statistik dan Undang-Undang Nomor 27 Tahun 2022
                tentang Pelindungan Data Pribadi. Data hanya dipakai untuk keperluan statistik.
              </p>
            </div>
            <ul className={s.checks}>
              <li>Tidak menanyakan nama, NIP, NIK, atau kontak pribadi</li>
              <li>Hanya hasil agregat yang dipublikasikan</li>
              <li>Sel tabel &lt; 5 responden disamarkan atau digabung</li>
              <li>Data individual hanya diakses tim pengolah</li>
              <li>Mohon tidak menuliskan data pribadi pada isian terbuka</li>
            </ul>
          </div>
        </section>

        {/* FAQ */}
        <section id="faq" className={`container ${s.section} ${s.faqWrap}`}>
          <div className={s.sectionHead}>
            <span className="badge accent">FAQ</span>
            <h2>Pertanyaan yang sering diajukan</h2>
          </div>
          <div className={s.faq}>
            {FAQ.map((f) => (
              <details key={f.q} className={`card ${s.faqItem}`}>
                <summary>{f.q}</summary>
                <p className="muted">{f.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className={`container ${s.section}`}>
          <div className={s.cta}>
            <h2>Siap berkontribusi?</h2>
            <p>Cukup 5–7 menit. Bagikan juga tautan ini kepada rekan kerja Anda.</p>
            <Link href="/survei" className="btn btn-primary btn-lg" id="cta-start">
              Mulai Sekarang <span className="arrow">→</span>
            </Link>
          </div>
        </section>
      </main>

      <footer className={s.footer}>
        <div className={`container ${s.footerInner}`}>
          <div className="row gap-2">
            <Logo size={30} />
            <div>
              <strong>Dinas Komunikasi, Informatika, Statistik dan Persandian</strong>
              <p className="small faint">Kabupaten Hulu Sungai Tengah · Jalan Perintis Kemerdekaan</p>
            </div>
          </div>
          <p className="small faint">Statistik Sektoral · Satu Data HST · © {PERIODE}</p>
        </div>
      </footer>
    </>
  );
}
