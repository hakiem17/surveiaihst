/**
 * Generator data sintetis untuk pengujian & pratinjau dashboard sebelum survei lapangan dimulai.
 * Karakteristik disesuaikan dengan profil pegawai Pemkab HST (Kebijakan, Teknis, Pelaksana).
 */
export function generateSampleResponses(count = 128) {
  const responses = [];
  const pds = [1, 3, 4, 5, 6, 9, 10, 11, 12, 16, 24, 25, 26, 30, 33];
  const clusters = ["kebijakan", "teknis", "pelaksana"];
  const statuses = ["pns", "pns", "pppk", "pppk", "non_asn"];
  const ages = ["20_30", "31_40", "41_50", "50_plus"];
  const freqs = ["harian", "mingguan", "mingguan", "bulanan", "jarang", "belum"];
  const apps = ["chatgpt", "gemini", "claude", "copilot", "desain", "deepseek"];
  const tasks = ["naskah", "referensi", "data", "paparan", "ringkasan", "konten"];

  for (let i = 1; i <= count; i++) {
    const cluster = clusters[i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : 2];
    const freq = freqs[i % freqs.length];
    const isAiUser = freq !== "belum";

    const b1 = (i % 5) + 1;
    const b2_1 = i % 10 !== 0 ? "benar" : "salah";
    const b2_2 = i % 8 !== 0 ? "benar" : "tidak_tahu";
    const b2_3 = i % 7 !== 0 ? "salah" : "benar";
    const b2_4 = i % 9 !== 0 ? "salah" : "tidak_tahu";

    let c2 = null;
    let c2a = null;
    let c3 = null;
    let c4 = null;
    let c5 = null;
    let c6 = null;
    let c7 = null;
    let d1 = null;
    let d2 = null;

    if (isAiUser) {
      c2 = [apps[i % 3], apps[(i + 1) % apps.length]];
      if (i % 4 === 0) c2.push("desain");
      c2a = c2[0];
      c3 = i % 6 === 0 ? "berbayar" : i % 8 === 0 ? "instansi" : "gratis";
      c4 = [tasks[i % tasks.length], tasks[(i + 2) % tasks.length]];
      c5 = 3 + (i % 3);
      c6 = 3 + ((i + 1) % 3);
      d1 = ["publik", "umum"];
      if (i % 5 === 0) d1.push("internal");
      if (i % 11 === 0) d1.push("pribadi"); // data sensitif
      d2 = i % 4 === 0 ? "selalu" : i % 3 === 0 ? "sering" : "kadang";
    } else {
      c7 = ["tidak_tahu_cara", "aturan"];
    }

    const dur = 180 + (i * 17) % 350;

    responses.push({
      id: `resp-${1000 + i}`,
      periode: 2026,
      created_at: new Date(Date.now() - (count - i) * 3600000).toISOString(),
      started_at: new Date(Date.now() - (count - i) * 3600000 - dur * 1000).toISOString(),
      duration_sec: dur,
      flag_fast: dur < 120,
      flag_straightline: i % 25 === 0,
      consent: true,
      a1_pd_id: pds[i % pds.length],
      a2: cluster,
      a3: statuses[i % statuses.length],
      a3_lain: null,
      a4: ages[i % ages.length],
      a5: i % 2 === 0 ? "L" : "P",
      b1,
      b2_1, b2_2, b2_3, b2_4,
      b3_1: 4 + (i % 2),
      b3_2: 5,
      b3_3: 4 + ((i + 1) % 2),
      b3_4: 4,
      c1: freq,
      c2,
      c2_lain: null,
      c2a,
      c3,
      c4,
      c4_lain: null,
      c5,
      c6,
      c7,
      c7_lain: null,
      d1,
      d2,
      e1: 3 + (i % 3),
      e2: 3 + ((i + 2) % 3),
      e3: i % 2 === 0 ? "tersebar" : "terpusat",
      e4: i % 4 === 0 ? "ada_sosialisasi" : "ada_belum",
      e5: i % 3 === 0 ? "mandiri" : "tidak_pernah",
      f1: ["pengetahuan", "aturan"],
      f1_lain: null,
      f2_1: 4,
      f2_2: 4,
      f2_3: 3,
      f2_4: 3,
      f3: i % 7 === 0 ? "ragu" : "bersedia",
      f4: i % 5 === 0 ? "Perlu segera dibuatkan SE Bupati dan Bimtek bertahap." : null,
    });
  }
  return responses;
}
