import fs from "fs";
import path from "path";

/**
 * Master Data Resmi Perangkat Daerah di Lingkungan Pemerintah Kabupaten Hulu Sungai Tengah (39 Instansi)
 * Sesuai nomenklatur terbaru Pemkab Hulu Sungai Tengah 2026.
 */
export const DEFAULT_PERANGKAT_DAERAH = [
  { id: 1, kode: "SETDA", nama: "Sekretariat Daerah", kelompok: "Sekretariat", jumlah_pegawai: null, urutan: 1, aktif: true },
  { id: 2, kode: "SETWAN", nama: "Sekretariat Dewan Perwakilan Rakyat Daerah", kelompok: "Sekretariat", jumlah_pegawai: null, urutan: 2, aktif: true },
  { id: 3, kode: "INSP", nama: "Inspektorat", kelompok: "Inspektorat", jumlah_pegawai: null, urutan: 3, aktif: true },
  { id: 4, kode: "BAPPERIDA", nama: "Badan Perencanaan Pembangunan, Riset dan Inovasi Daerah", kelompok: "Badan", jumlah_pegawai: null, urutan: 4, aktif: true },
  { id: 5, kode: "BKPSDMD", nama: "Badan Kepegawaian dan Pengembangan Sumber Daya Manusia Daerah", kelompok: "Badan", jumlah_pegawai: null, urutan: 5, aktif: true },
  { id: 6, kode: "BPKPD", nama: "Badan Pengelola Keuangan dan Pendapatan Daerah", kelompok: "Badan", jumlah_pegawai: null, urutan: 6, aktif: true },
  { id: 7, kode: "BAKESBANGPOL", nama: "Badan Kesatuan Bangsa dan Politik", kelompok: "Badan", jumlah_pegawai: null, urutan: 7, aktif: true },
  { id: 8, kode: "BPBD_DAMKAR", nama: "Badan Penanggulangan Bencana Daerah dan Pemadam Kebakaran", kelompok: "Badan", jumlah_pegawai: null, urutan: 8, aktif: true },
  { id: 9, kode: "DISDIK", nama: "Dinas Pendidikan", kelompok: "Dinas", jumlah_pegawai: null, urutan: 9, aktif: true },
  { id: 10, kode: "DISPORABUDPAREKRAF", nama: "Dinas Pemuda Olahraga, Kebudayaan, Pariwisata dan Ekonomi Kreatif", kelompok: "Dinas", jumlah_pegawai: null, urutan: 10, aktif: true },
  { id: 11, kode: "DINKES", nama: "Dinas Kesehatan", kelompok: "Dinas", jumlah_pegawai: null, urutan: 11, aktif: true },
  { id: 12, kode: "DINSOS_PPKB_PPPA", nama: "Dinas Sosial, Pengendalian Penduduk, Keluarga Berencana, Pemberdayaan Perempuan dan Perlindungan Anak", kelompok: "Dinas", jumlah_pegawai: null, urutan: 12, aktif: true },
  { id: 13, kode: "DISDUKCAPIL", nama: "Dinas Kependudukan, dan Pencatatan Sipil", kelompok: "Dinas", jumlah_pegawai: null, urutan: 13, aktif: true },
  { id: 14, kode: "DPMD", nama: "Dinas Pemberdayaan Masyarakat dan Desa", kelompok: "Dinas", jumlah_pegawai: null, urutan: 14, aktif: true },
  { id: 15, kode: "SATPOLPP", nama: "Satuan Polisi Pamong Praja", kelompok: "Dinas", jumlah_pegawai: null, urutan: 15, aktif: true },
  { id: 16, kode: "DPMPTSP", nama: "Dinas Penanaman Modal dan Pelayanan Terpadu Satu Pintu", kelompok: "Dinas", jumlah_pegawai: null, urutan: 16, aktif: true },
  { id: 17, kode: "DISDAG", nama: "Dinas Perdagangan", kelompok: "Dinas", jumlah_pegawai: null, urutan: 17, aktif: true },
  { id: 18, kode: "DISPERINKOP_UKM", nama: "Dinas Perindustrian, Tenaga Kerja, Koperasi dan Usaha Mikro Kecil dan Menengah", kelompok: "Dinas", jumlah_pegawai: null, urutan: 18, aktif: true },
  { id: 19, kode: "DISKOMINFO_SP", nama: "Dinas Komunikasi, Informatika, Statistik dan Persandian", kelompok: "Dinas", jumlah_pegawai: null, urutan: 19, aktif: true },
  { id: 20, kode: "DPUPR", nama: "Dinas Pekerjaan Umum dan Penataan Ruang", kelompok: "Dinas", jumlah_pegawai: null, urutan: 20, aktif: true },
  { id: 21, kode: "DISPERKIMTAN", nama: "Dinas Perumahan Rakyat, Kawasan Pemukiman dan Pertanahan", kelompok: "Dinas", jumlah_pegawai: null, urutan: 21, aktif: true },
  { id: 22, kode: "DISTAN", nama: "Dinas Pertanian", kelompok: "Dinas", jumlah_pegawai: null, urutan: 22, aktif: true },
  { id: 23, kode: "DKPP", nama: "Dinas Ketahanan Pangan dan Perikanan", kelompok: "Dinas", jumlah_pegawai: null, urutan: 23, aktif: true },
  { id: 24, kode: "DLH", nama: "Dinas Lingkungan Hidup", kelompok: "Dinas", jumlah_pegawai: null, urutan: 24, aktif: true },
  { id: 25, kode: "DISHUB", nama: "Dinas Perhubungan", kelompok: "Dinas", jumlah_pegawai: null, urutan: 25, aktif: true },
  { id: 26, kode: "DISPERSIP", nama: "Dinas Perpustakaan dan Kearsipan", kelompok: "Dinas", jumlah_pegawai: null, urutan: 26, aktif: true },
  { id: 27, kode: "KEC_BRB", nama: "Kecamatan Barabai", kelompok: "Kecamatan", jumlah_pegawai: null, urutan: 27, aktif: true },
  { id: 28, kode: "KEC_BB", nama: "Kecamatan Batu Benawa", kelompok: "Kecamatan", jumlah_pegawai: null, urutan: 28, aktif: true },
  { id: 29, kode: "KEC_HTK", nama: "Kecamatan Hantakan", kelompok: "Kecamatan", jumlah_pegawai: null, urutan: 29, aktif: true },
  { id: 30, kode: "KEC_BAS", nama: "Kecamatan Batang Alai Selatan", kelompok: "Kecamatan", jumlah_pegawai: null, urutan: 30, aktif: true },
  { id: 31, kode: "KEC_LMS", nama: "Kecamatan Limpasu", kelompok: "Kecamatan", jumlah_pegawai: null, urutan: 31, aktif: true },
  { id: 32, kode: "KEC_BAT", nama: "Kecamatan Batang Alai Timur", kelompok: "Kecamatan", jumlah_pegawai: null, urutan: 32, aktif: true },
  { id: 33, kode: "KEC_BAU", nama: "Kecamatan Batang Alai Utara", kelompok: "Kecamatan", jumlah_pegawai: null, urutan: 33, aktif: true },
  { id: 34, kode: "KEC_PDW", nama: "Kecamatan Pandawan", kelompok: "Kecamatan", jumlah_pegawai: null, urutan: 34, aktif: true },
  { id: 35, kode: "KEC_LAU", nama: "Kecamatan Labuan Amas Utara", kelompok: "Kecamatan", jumlah_pegawai: null, urutan: 35, aktif: true },
  { id: 36, kode: "KEC_LAS", nama: "Kecamatan Labuan Amas Selatan", kelompok: "Kecamatan", jumlah_pegawai: null, urutan: 36, aktif: true },
  { id: 37, kode: "KEC_HRY", nama: "Kecamatan Haruyan", kelompok: "Kecamatan", jumlah_pegawai: null, urutan: 37, aktif: true },
  { id: 38, kode: "RSUD_DAMANHURI", nama: "RSUD Damanhuri", kelompok: "UPT", jumlah_pegawai: null, urutan: 38, aktif: true },
  { id: 39, kode: "BPS_HST", nama: "Badan Pusat Statistik", kelompok: "Lainnya", jumlah_pegawai: null, urutan: 39, aktif: true }
];

const LOCAL_PD_FILE = path.join(process.cwd(), ".local_perangkat_daerah.json");

export function getLocalPerangkatDaerah() {
  try {
    if (fs.existsSync(LOCAL_PD_FILE)) {
      const data = JSON.parse(fs.readFileSync(LOCAL_PD_FILE, "utf8"));
      if (Array.isArray(data) && data.length > 0) {
        return data;
      }
    }
  } catch (e) {
    console.warn("Gagal membaca .local_perangkat_daerah.json:", e);
  }
  return DEFAULT_PERANGKAT_DAERAH;
}

export function saveLocalPerangkatDaerah(list) {
  try {
    fs.writeFileSync(LOCAL_PD_FILE, JSON.stringify(list, null, 2), "utf8");
    return true;
  } catch (e) {
    console.error("Gagal menulis ke .local_perangkat_daerah.json:", e);
    return false;
  }
}
