"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  OPT, B2_ITEMS, B3_ITEMS, F2_ITEMS, SCALE_LABELS, F4_MAX, LAINNYA_MAX, PERIODE,
  isUser, c2aOptions, toggleMulti, validateSection,
} from "@/lib/survey";
import s from "./survei.module.css";

const DRAFT_KEY = `surveiai:draft:${PERIODE}`;
const DONE_KEY = `surveiai:done:${PERIODE}`;
const DEVICE_KEY = "surveiai:device";

const STEP_META = {
  PS: { title: "Selamat datang", sec: "Persetujuan" },
  A: { title: "Identitas Responden", sec: "Seksi A", note: "Bagian ini hanya digunakan untuk pengelompokan data dan tidak untuk mengidentifikasi Anda." },
  B1: { title: "Literasi terhadap AI", sec: "Seksi B" },
  B3: { title: "Sikap terhadap AI", sec: "Seksi B" },
  C1: { title: "Pemanfaatan AI untuk Tugas Dinas", sec: "Seksi C", note: "Periode acuan: 12 (dua belas) bulan terakhir." },
  C: { title: "Pemanfaatan AI untuk Tugas Dinas", sec: "Seksi C", note: "Periode acuan: 12 (dua belas) bulan terakhir." },
  D: { title: "Praktik Penggunaan & Keamanan Informasi", sec: "Seksi D", note: "Kami tidak menilai benar atau salahnya praktik Anda; data ini dipakai untuk menyusun pedoman yang realistis." },
  E: { title: "Kesiapan Data, Infrastruktur & Kelembagaan", sec: "Seksi E" },
  F: { title: "Hambatan, Persepsi Risiko & Harapan", sec: "Seksi F" },
};

const shuffle = (arr) => {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
};

const newId = () =>
  (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`).replace(/-/g, "");

/* ------------------------------------------------------------------ */
/* Reusable inputs                                                     */
/* ------------------------------------------------------------------ */

function Question({ code, title, hint, error, children, id }) {
  return (
    <fieldset className={`${s.q} ${error ? s.qError : ""}`} id={id} data-error={error ? "1" : undefined}>
      <legend className={s.qHead}>
        <span className={s.qCode}>{code}</span>
        <span>
          <span className={s.qTitle}>{title}</span>
          {hint && <span className={s.qHint}>{hint}</span>}
        </span>
      </legend>
      {children}
      {error && <p className="error-text" role="alert">{error}</p>}
    </fieldset>
  );
}

function RadioCards({ name, options, value, onChange, cols = 1 }) {
  return (
    <div className={s.opts} style={{ "--cols": cols }}>
      {options.map((o) => (
        <label key={o.v} className={`${s.opt} ${value === o.v ? s.optOn : ""}`}>
          <input type="radio" name={name} value={o.v} checked={value === o.v} onChange={() => onChange(o.v)} />
          <span className={s.radio} aria-hidden="true" />
          <span className={s.optText}>
            {o.l}
            {o.d && <small>{o.d}</small>}
          </span>
        </label>
      ))}
    </div>
  );
}

function CheckCards({ name, group, options, value = [], onChange, max, other, onOther, otherError }) {
  const atMax = max && value.length >= max;
  return (
    <>
      {max && (
        <p className={s.counter}>
          Dipilih <strong>{value.length}</strong> dari maksimal {max}
        </p>
      )}
      <div className={s.opts}>
        {options.map((o) => {
          const on = value.includes(o.v);
          const disabled = !on && atMax && !o.exclusive;
          return (
            <label key={o.v} className={`${s.opt} ${on ? s.optOn : ""} ${disabled ? s.optOff : ""}`}>
              <input
                type="checkbox" name={name} value={o.v} checked={on} disabled={disabled}
                onChange={() => onChange(toggleMulti(group, value, o.v, max))}
              />
              <span className={s.check} aria-hidden="true" />
              <span className={s.optText}>
                {o.l}
                {o.other && " (sebutkan)"}
                {o.exclusive && <small>Tidak dapat dipilih bersama opsi lain</small>}
              </span>
            </label>
          );
        })}
      </div>
      {value.includes("lainnya") && (
        <div className={s.other}>
          <input
            className="input" placeholder="Sebutkan…" maxLength={LAINNYA_MAX}
            value={other ?? ""} onChange={(e) => onOther(e.target.value)} aria-label="Isian lainnya"
          />
          {otherError && <p className="error-text">{otherError}</p>}
        </div>
      )}
    </>
  );
}

function Scale({ name, value, onChange, labels }) {
  return (
    <div className={s.scaleWrap}>
      <div className={s.scale} role="radiogroup">
        {[1, 2, 3, 4, 5].map((n) => (
          <label key={n} className={`${s.scaleBtn} ${value === n ? s.scaleOn : ""}`}>
            <input type="radio" name={name} value={n} checked={value === n} onChange={() => onChange(n)} />
            {n}
          </label>
        ))}
      </div>
      {labels && (
        <div className={s.scaleLabels}>
          <span>1 = {labels[0]}</span>
          <span>5 = {labels[1]}</span>
        </div>
      )}
    </div>
  );
}

function MatrixRow({ label, children, error }) {
  return (
    <div className={`${s.mRow} ${error ? s.mRowErr : ""}`} data-error={error ? "1" : undefined}>
      <p className={s.mLabel}>{label}</p>
      {children}
    </div>
  );
}

/* Pencarian Perangkat Daerah ---------------------------------------- */

const norm = (t = "") =>
  t.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

// Singkatan dari huruf awal tiap kata, mis. "Dinas Kesehatan" -> "dk"
const initials = (t) => norm(t).split(" ").map((w) => w[0]).join("");

function Highlight({ text, terms }) {
  if (!terms.length) return text;
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})`, "ig");
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part));
}

function PdPicker({ options, value, onChange, invalid }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [hi, setHi] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const selected = options.find((o) => o.id === value);

  const index = useMemo(
    () => options.map((o) => ({ ...o, _t: norm(`${o.nama} ${o.kelompok || ""}`), _i: initials(o.nama) })),
    [options]
  );
  const terms = norm(q).split(" ").filter(Boolean);
  const filtered = terms.length
    ? index.filter((o) => terms.every((t) => o._t.includes(t)) || (terms.length === 1 && o._i.startsWith(terms[0])))
    : index;

  const groups = filtered.reduce((acc, o) => {
    const g = o.kelompok || "Perangkat Daerah";
    (acc[g] ||= []).push(o);
    return acc;
  }, {});
  const flat = Object.values(groups).flat();

  const pick = (o) => {
    onChange(o.id);
    setQ("");
    setOpen(false);
    inputRef.current?.blur();
  };

  const openList = () => {
    setOpen(true);
    setHi(0);
    // Di HP, naikkan kolom ke atas agar daftar tidak tertutup keyboard
    if (window.matchMedia("(max-width: 640px)").matches) {
      setTimeout(() => inputRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 250);
    }
  };

  const onKey = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      if (!open) return openList();
      setHi((h) => Math.min(h + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHi((h) => Math.max(h - 1, 0));
    } else if (e.key === "Enter") {
      if (open && flat[hi]) {
        e.preventDefault();
        pick(flat[hi]);
      }
    } else if (e.key === "Escape") {
      setOpen(false);
      setQ("");
    }
  };

  useEffect(() => {
    listRef.current?.querySelector(`[data-idx="${hi}"]`)?.scrollIntoView({ block: "nearest" });
  }, [hi]);

  const pos = new Map(flat.map((o, i) => [o.id, i]));
  return (
    <div className={s.pd}>
      <div className={`${s.pdField} ${open ? s.pdFieldOpen : ""} ${invalid ? s.pdFieldErr : ""}`}>
        <span className={s.pdIcon} aria-hidden="true">⌕</span>
        <input
          ref={inputRef}
          id="a1"
          className={s.pdInput}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls="a1-list"
          aria-autocomplete="list"
          autoComplete="off"
          enterKeyHint="search"
          placeholder={selected ? selected.nama : "Ketik untuk mencari, mis. kesehatan, camat, puskesmas…"}
          value={open ? q : selected?.nama ?? ""}
          onChange={(e) => {
            setQ(e.target.value);
            setHi(0);
            if (!open) setOpen(true);
          }}
          onFocus={openList}
          onBlur={() => setOpen(false)}
          onKeyDown={onKey}
        />
        {(q || selected) && (
          <button
            type="button"
            className={s.pdClear}
            aria-label="Hapus pilihan"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => {
              if (q) setQ("");
              else onChange(undefined);
              inputRef.current?.focus();
            }}
          >
            ✕
          </button>
        )}
      </div>

      {open && (
        <div className={s.pdList} id="a1-list" role="listbox" ref={listRef} onMouseDown={(e) => e.preventDefault()}>
          <p className={s.pdCount}>
            {terms.length ? `${flat.length} hasil` : `${flat.length} Perangkat Daerah / unit kerja`}
          </p>
          {flat.length === 0 && (
            <p className={s.pdEmpty}>
              Tidak ditemukan untuk “{q}”. Coba kata kunci lain, mis. sebagian nama dinas atau kecamatan.
            </p>
          )}
          {Object.entries(groups).map(([g, items]) => (
            <div key={g} role="group" aria-label={g}>
              <p className={s.pdGroup}>{g}</p>
              {items.map((o) => {
                const i = pos.get(o.id);
                return (
                  <div
                    key={o.id}
                    role="option"
                    aria-selected={o.id === value}
                    data-idx={i}
                    className={`${s.pdOpt} ${i === hi ? s.pdOptHi : ""} ${o.id === value ? s.pdOptOn : ""}`}
                    onMouseEnter={() => setHi(i)}
                    onClick={() => pick(o)}
                  >
                    <span><Highlight text={o.nama} terms={terms} /></span>
                    {o.id === value && <span className={s.pdTick}>✓</span>}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}

      {selected && !open && (
        <p className={s.pdSelected}>
          Terpilih: <strong>{selected.nama}</strong>
          {selected.kelompok ? <span> · {selected.kelompok}</span> : null}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main form                                                           */
/* ------------------------------------------------------------------ */

export default function SurveyForm({ perangkatDaerah, loadError }) {
  const [ready, setReady] = useState(false);
  const [status, setStatus] = useState("form"); // form | done | refused | already
  const [a, setA] = useState({});
  const [meta, setMeta] = useState({}); // { deviceId, startedAt, b2Order, b3Order, c2Order, step }
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const topRef = useRef(null);

  // Muat draft & ID perangkat (save & resume)
  useEffect(() => {
    let deviceId = localStorage.getItem(DEVICE_KEY);
    if (!deviceId) {
      deviceId = newId();
      localStorage.setItem(DEVICE_KEY, deviceId);
    }
    const done = localStorage.getItem(DONE_KEY);
    let draft = null;
    try {
      draft = JSON.parse(localStorage.getItem(DRAFT_KEY) || "null");
    } catch {}
    /* eslint-disable react-hooks/set-state-in-effect -- hidrasi satu kali dari localStorage */
    if (done) setStatus("already");
    setA(draft?.a ?? {});
    setMeta({
      deviceId,
      startedAt: draft?.meta?.startedAt ?? null,
      step: draft?.meta?.step ?? 0,
      b2Order: draft?.meta?.b2Order ?? shuffle(B2_ITEMS.map((x) => x.k)),
      b3Order: draft?.meta?.b3Order ?? shuffle(B3_ITEMS.map((x) => x.k)),
      c2Order: draft?.meta?.c2Order ?? shuffle(OPT.C2.filter((o) => o.v !== "lainnya").map((o) => o.v)),
    });
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // Simpan draft otomatis
  useEffect(() => {
    if (!ready || status !== "form" || !meta.startedAt) return;
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ a, meta }));
  }, [a, meta, ready, status]);

  const user = isUser(a.c1);
  const steps = useMemo(
    () => ["PS", "A", "B1", "B3", "C1", "C", ...(user ? ["D"] : []), "E", "F"],
    [user]
  );
  const stepIdx = Math.min(meta.step ?? 0, steps.length - 1);
  const step = steps[stepIdx];
  const progress = stepIdx === 0 ? 0 : Math.round((stepIdx / (steps.length - 1)) * 100);

  const set = (k, v) => {
    setA((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors((e) => ({ ...e, [k]: undefined }));
  };

  // C2a: hanya dari pilihan C2; terisi otomatis bila hanya satu
  useEffect(() => {
    const c2 = a.c2 || [];
    /* eslint-disable react-hooks/set-state-in-effect -- aturan turunan C2 → C2a */
    if (c2.length === 1 && a.c2a !== c2[0]) setA((p) => ({ ...p, c2a: c2[0] }));
    else if (a.c2a && !c2.includes(a.c2a)) setA((p) => ({ ...p, c2a: undefined }));
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [a.c2, a.c2a]);

  const go = (idx) => {
    setMeta((m) => ({ ...m, step: idx }));
    setErrors({});
  };

  // Selalu kembali ke bagian paling atas SETELAH langkah/status baru selesai dirender.
  // (Scroll sebelum render membuat posisi berhenti di tengah pada layar HP.)
  useEffect(() => {
    if (!ready) return;
    if (document.activeElement instanceof HTMLElement) document.activeElement.blur();
    const toTop = () => window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    toTop();
    const raf = requestAnimationFrame(toTop);
    return () => cancelAnimationFrame(raf);
  }, [stepIdx, status, ready]);

  const next = () => {
    const e = validateSection(step, a);
    if (Object.keys(e).length) {
      setErrors(e);
      requestAnimationFrame(() =>
        document.querySelector("[data-error='1']")?.scrollIntoView({ behavior: "smooth", block: "center" })
      );
      return;
    }
    if (stepIdx < steps.length - 1) go(stepIdx + 1);
    else submit();
  };

  async function post(body) {
    const res = await fetch("/api/submit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = await res.json().catch(() => ({}));
    return { res, json };
  }

  function finish(nextStatus) {
    localStorage.setItem(DONE_KEY, new Date().toISOString());
    localStorage.removeItem(DRAFT_KEY);
    setStatus(nextStatus);
  }

  async function submit() {
    setSubmitting(true);
    setSubmitError("");
    try {
      const { res, json } = await post({ consent: true, device_id: meta.deviceId, started_at: meta.startedAt, answers: a });
      if (res.ok || res.status === 409) return finish(res.status === 409 ? "already" : "done");
      if (res.status === 422 && json.errors) {
        setErrors(json.errors);
        setSubmitError("Beberapa jawaban perlu diperiksa kembali.");
      } else {
        const errorDetail = json.error ? ` (${json.error})` : "";
        setSubmitError((json.message || "Gagal mengirim. Periksa koneksi lalu coba lagi.") + errorDetail);
      }
    } catch {
      setSubmitError("Gagal mengirim. Jawaban Anda tetap tersimpan di perangkat ini — silakan coba lagi.");
    } finally {
      setSubmitting(false);
    }
  }

  async function consent(yes) {
    if (yes) {
      setMeta((m) => ({ ...m, startedAt: m.startedAt ?? new Date().toISOString() }));
      go(1);
      return;
    }
    setSubmitting(true);
    try {
      await post({ consent: false, device_id: meta.deviceId });
    } catch {}
    setSubmitting(false);
    finish("refused");
  }

  if (!ready) return <div className={`card ${s.panel} ${s.skeleton}`} aria-busy="true" />;

  if (status !== "form") {
    const content = {
      done: ["✓", "Terima kasih atas partisipasi Anda", "Jawaban Anda sangat berharga bagi perumusan kebijakan pemanfaatan AI yang aman dan bermanfaat di Kabupaten Hulu Sungai Tengah."],
      refused: ["♡", "Terima kasih", "Kami menghargai keputusan Anda. Anda dapat menutup halaman ini."],
      already: ["✓", "Anda sudah mengisi survei ini", "Terima kasih. Setiap pegawai cukup mengisi satu kali. Silakan bagikan tautan survei kepada rekan kerja Anda."],
    }[status];
    return (
      <div ref={topRef} className={`card ${s.panel} ${s.end} fade-up`}>
        <span className={s.endIcon}>{content[0]}</span>
        <h2>{content[1]}</h2>
        <p className="muted">{content[2]}</p>
        <div className="row gap-2" style={{ justifyContent: "center", marginTop: 20, flexWrap: "wrap" }}>
          <Link href="/" className="btn btn-ghost">Kembali ke beranda</Link>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              localStorage.removeItem(DONE_KEY);
              localStorage.removeItem(DRAFT_KEY);
              localStorage.removeItem(DEVICE_KEY);
              window.location.reload();
            }}
          >
            🔄 Reset Sesi & Uji Coba Ulang
          </button>
        </div>
      </div>
    );
  }

  const m = STEP_META[step];
  const c2Opts = [...(meta.c2Order || []).map((v) => OPT.C2.find((o) => o.v === v)), OPT.C2.find((o) => o.v === "lainnya")];

  return (
    <div ref={topRef} className={s.wrap}>
      {step !== "PS" && (
        <div className={s.progress}>
          <div className={s.progressMeta}>
            <span>{m.sec}</span>
            <span>{progress}%</span>
          </div>
          <div className={s.bar}><span style={{ width: `${progress}%` }} /></div>
        </div>
      )}

      <section key={step} className={`card ${s.panel} fade-up`}>
        <header className={s.panelHead}>
          <span className="badge accent">{m.sec}</span>
          <h2>{m.title}</h2>
          {m.note && <p className="muted small">{m.note}</p>}
        </header>

        {step === "PS" && (
          <div className="stack gap-3">
            <p>
              Dinas Komunikasi, Informatika, Statistik dan Persandian (Diskominfo SP) Kabupaten Hulu Sungai Tengah sedang
              menyelenggarakan survei untuk memahami pengetahuan, penggunaan, dan kebutuhan seluruh pegawai di lingkungan
              Pemerintah Kabupaten Hulu Sungai Tengah (ASN maupun non-ASN) terkait teknologi Artificial Intelligence (AI),
              seperti ChatGPT, Gemini, Claude, Copilot, dan fitur AI lainnya.
            </p>
            <p className="muted">
              Pengisian sekitar 5–7 menit. Tidak ada jawaban benar atau salah, jawablah sesuai kondisi sebenarnya. Anda tetap
              dapat mengisi meskipun belum pernah menggunakan AI. Mohon isi kuesioner ini satu kali saja.
            </p>
            <div className={s.rekomendasiBox}>
              <div className={s.rekomendasiHeader}>
                <span className={s.rekomendasiBadge}>Rekomendasi BPS</span>
                <span className={s.rekomendasiTitle}>Survei Statistik Sektoral Resmi</span>
              </div>
              <div className={s.rekomendasiGrid}>
                <div className={s.rekomendasiItem}>
                  <span className={s.rekomendasiLabel}>Identitas Rekomendasi</span>
                  <strong className={s.rekomendasiValue}>V-26.6307.002</strong>
                </div>
                <div className={s.rekomendasiItem}>
                  <span className={s.rekomendasiLabel}>Tanggal Terbit</span>
                  <strong className={s.rekomendasiValue}>21 Oktober 2026</strong>
                </div>
              </div>
              <p className={s.rekomendasiNote}>
                Kegiatan statistik sektoral ini telah memperoleh Rekomendasi Statistik dari Badan Pusat Statistik (BPS) sesuai PP No. 51 Tahun 1999 tentang Penyelenggaraan Statistik.
              </p>
            </div>
            <div className={s.notice}>
              <strong>Kerahasiaan.</strong> Survei ini tidak menanyakan nama, NIP, atau data pribadi lain. Jawaban Anda
              dijamin kerahasiaannya sesuai UU Nomor 16 Tahun 1997 dan UU Nomor 27 Tahun 2022, hanya dipakai untuk keperluan
              statistik, dan dipublikasikan dalam bentuk agregat. Jawaban tidak berkaitan dengan penilaian kinerja Anda.
            </div>
            <div className={`${s.notice} ${s.noticeWarn}`}>
              <strong>Informasi sensitif.</strong> Mohon tidak menuliskan data pribadi atau dokumen rahasia pada kolom isian
              terbuka.
            </div>
            {meta.startedAt && <p className="small muted">Anda memiliki jawaban tersimpan. Melanjutkan dari terakhir kali.</p>}
            <Question code="PS" title="Apakah Anda bersedia berpartisipasi dalam survei ini?">
              <div className={s.consentRow}>
                <button className="btn btn-primary btn-lg" onClick={() => consent(true)} disabled={submitting} id="consent-yes">
                  Ya, saya bersedia secara sukarela dan telah membaca penjelasan di atas
                </button>
                <button className="btn btn-ghost" onClick={() => consent(false)} disabled={submitting} id="consent-no">
                  Tidak bersedia
                </button>
              </div>
            </Question>
          </div>
        )}

        {step === "A" && (
          <div className="stack gap-4">
            <Question code="A1" title="Nama Perangkat Daerah / unit kerja tempat Anda bertugas" error={errors.a1_pd_id}>
              {perangkatDaerah.length === 0 ? (
                <div className={`${s.notice} ${s.noticeWarn}`}>
                  Daftar Perangkat Daerah belum tersedia
                  {loadError === "config" ? " (Supabase belum dikonfigurasi)" : ""}. Hubungi admin Diskominfo SP.
                </div>
              ) : (
                <PdPicker
                  options={perangkatDaerah}
                  value={a.a1_pd_id}
                  onChange={(v) => set("a1_pd_id", v)}
                  invalid={!!errors.a1_pd_id}
                />
              )}
            </Question>
            <Question code="A2" title="Klaster jabatan Anda saat ini" hint="Bila memenuhi lebih dari satu, pilih yang paling atas." error={errors.a2}>
              <RadioCards name="a2" options={OPT.A2} value={a.a2} onChange={(v) => set("a2", v)} />
            </Question>
            <Question code="A3" title="Status kepegawaian" error={errors.a3 || errors.a3_lain}>
              <RadioCards name="a3" options={OPT.A3.map((o) => (o.other ? { ...o, l: "Lainnya (sebutkan)" } : o))} value={a.a3} onChange={(v) => set("a3", v)} />
              {a.a3 === "lainnya" && (
                <input className="input" placeholder="Sebutkan status kepegawaian…" maxLength={LAINNYA_MAX} value={a.a3_lain ?? ""} onChange={(e) => set("a3_lain", e.target.value)} />
              )}
            </Question>
            <div className={s.twoCol}>
              <Question code="A4" title="Kelompok umur Anda" error={errors.a4}>
                <RadioCards name="a4" options={OPT.A4} value={a.a4} onChange={(v) => set("a4", v)} cols={2} />
              </Question>
              <Question code="A5" title="Jenis kelamin" error={errors.a5}>
                <RadioCards name="a5" options={OPT.A5} value={a.a5} onChange={(v) => set("a5", v)} cols={2} />
              </Question>
            </div>
          </div>
        )}

        {step === "B1" && (
          <div className="stack gap-4">
            <Question code="B1" title="Sejauh mana Anda memahami apa itu teknologi AI (kecerdasan buatan) seperti ChatGPT, Gemini, atau fitur AI lainnya?" error={errors.b1}>
              <Scale name="b1" value={a.b1} onChange={(v) => set("b1", v)} labels={SCALE_LABELS.B1} />
            </Question>
            <Question code="B2" title="Menurut Anda, apakah pernyataan berikut Benar atau Salah?" error={B2_ITEMS.some((it) => errors[it.k]) ? "Jawab semua pernyataan." : null}>
              {(meta.b2Order || []).map((k, i) => {
                const it = B2_ITEMS.find((x) => x.k === k);
                return (
                  <MatrixRow key={k} label={`${i + 1}. ${it.t}`} error={errors[k]}>
                    <div className={s.seg}>
                      {OPT.B2_ANSWER.map((o) => (
                        <label key={o.v} className={`${s.segBtn} ${a[k] === o.v ? s.segOn : ""}`}>
                          <input type="radio" name={k} checked={a[k] === o.v} onChange={() => set(k, o.v)} />
                          {o.l}
                        </label>
                      ))}
                    </div>
                  </MatrixRow>
                );
              })}
            </Question>
          </div>
        )}

        {step === "B3" && (
          <Question code="B3" title="Seberapa setuju Anda dengan pernyataan berikut?" hint="1 = Sangat tidak setuju, 5 = Sangat setuju" error={B3_ITEMS.some((it) => errors[it.k]) ? "Jawab semua pernyataan." : null}>
            {(meta.b3Order || []).map((k, i) => {
              const it = B3_ITEMS.find((x) => x.k === k);
              return (
                <MatrixRow key={k} label={`${i + 1}. ${it.t}`} error={errors[k]}>
                  <Scale name={k} value={a[k]} onChange={(v) => set(k, v)} />
                </MatrixRow>
              );
            })}
          </Question>
        )}

        {step === "C1" && (
          <Question code="C1" title="Seberapa sering Anda menggunakan aplikasi berbasis AI untuk keperluan dinas atau penyelesaian tugas kantor?" error={errors.c1}>
            <RadioCards name="c1" options={OPT.C1} value={a.c1} onChange={(v) => set("c1", v)} />
          </Question>
        )}

        {step === "C" && user && (
          <div className="stack gap-4">
            <Question code="C2" title="Aplikasi AI apa saja yang pernah Anda gunakan untuk pekerjaan dinas?" hint="Boleh pilih lebih dari satu." error={errors.c2}>
              <CheckCards name="c2" group="C2" options={c2Opts} value={a.c2} onChange={(v) => set("c2", v)} other={a.c2_lain} onOther={(v) => set("c2_lain", v)} otherError={errors.c2_lain} />
            </Question>
            {(a.c2 || []).length > 0 && (
              <Question code="C2a" title="Dari aplikasi tersebut, mana yang paling sering Anda gunakan?" error={errors.c2a}>
                <RadioCards name="c2a" options={c2aOptions(a.c2, a.c2_lain)} value={a.c2a} onChange={(v) => set("c2a", v)} cols={2} />
              </Question>
            )}
            <Question code="C3" title="Jenis akun yang paling sering Anda gunakan" error={errors.c3}>
              <RadioCards name="c3" options={OPT.C3} value={a.c3} onChange={(v) => set("c3", v)} cols={2} />
            </Question>
            <Question code="C4" title="Untuk tugas apa saja Anda menggunakan AI?" hint="Boleh pilih lebih dari satu." error={errors.c4}>
              <CheckCards name="c4" group="C4" options={OPT.C4} value={a.c4} onChange={(v) => set("c4", v)} other={a.c4_lain} onOther={(v) => set("c4_lain", v)} otherError={errors.c4_lain} />
            </Question>
            <Question code="C5" title="Seberapa besar AI membantu menghemat waktu penyelesaian tugas harian Anda?" error={errors.c5}>
              <Scale name="c5" value={a.c5} onChange={(v) => set("c5", v)} labels={SCALE_LABELS.C5} />
            </Question>
            <Question code="C6" title="Secara umum, seberapa tepat dan berguna hasil AI untuk pekerjaan Anda?" error={errors.c6}>
              <Scale name="c6" value={a.c6} onChange={(v) => set("c6", v)} labels={SCALE_LABELS.C6} />
            </Question>
          </div>
        )}

        {step === "C" && !user && (
          <Question code="C7" title="Apa alasan Anda belum menggunakan AI untuk tugas dinas?" hint="Pilih maksimal 3." error={errors.c7}>
            <CheckCards name="c7" group="C7" options={OPT.C7} value={a.c7} onChange={(v) => set("c7", v)} max={3} other={a.c7_lain} onOther={(v) => set("c7_lain", v)} otherError={errors.c7_lain} />
          </Question>
        )}

        {step === "D" && (
          <div className="stack gap-4">
            <Question code="D1" title="Informasi jenis apa yang pernah Anda masukkan atau unggah ke aplikasi AI untuk keperluan dinas?" hint="Boleh pilih lebih dari satu." error={errors.d1}>
              <CheckCards name="d1" group="D1" options={OPT.D1} value={a.d1} onChange={(v) => set("d1", v)} />
            </Question>
            <Question code="D2" title="Seberapa sering Anda memeriksa kembali kebenaran hasil AI sebelum dipakai dalam pekerjaan dinas?" error={errors.d2}>
              <RadioCards name="d2" options={OPT.D2} value={a.d2} onChange={(v) => set("d2", v)} cols={2} />
            </Question>
          </div>
        )}

        {step === "E" && (
          <div className="stack gap-4">
            <Question code="E1" title="Menurut Anda, apakah kualitas dan ketersediaan internet di kantor memadai untuk mengakses perangkat kerja berbasis cloud dan AI?" error={errors.e1}>
              <Scale name="e1" value={a.e1} onChange={(v) => set("e1", v)} labels={SCALE_LABELS.E1} />
            </Question>
            <Question code="E2" title="Apakah perangkat komputer / laptop yang tersedia memadai untuk menunjang pekerjaan digital, termasuk memanfaatkan AI?" error={errors.e2}>
              <Scale name="e2" value={a.e2} onChange={(v) => set("e2", v)} labels={SCALE_LABELS.E2} />
            </Question>
            <Question code="E3" title="Bagaimana kondisi pengelolaan data di unit kerja Anda?" error={errors.e3}>
              <RadioCards name="e3" options={OPT.E3} value={a.e3} onChange={(v) => set("e3", v)} />
            </Question>
            <Question code="E4" title="Apakah di Perangkat Daerah / Pemkab HST sudah ada pedoman, SOP, atau aturan tentang penggunaan AI oleh pegawai?" error={errors.e4}>
              <RadioCards name="e4" options={OPT.E4} value={a.e4} onChange={(v) => set("e4", v)} cols={2} />
            </Question>
            <Question code="E5" title="Pernahkah Anda mengikuti pelatihan / sosialisasi tentang penggunaan AI?" error={errors.e5}>
              <RadioCards name="e5" options={OPT.E5} value={a.e5} onChange={(v) => set("e5", v)} />
            </Question>
          </div>
        )}

        {step === "F" && (
          <div className="stack gap-4">
            <Question code="F1" title="Apa hambatan utama yang membuat Anda / instansi Anda belum optimal memanfaatkan AI?" hint="Pilih maksimal 3." error={errors.f1}>
              <CheckCards name="f1" group="F1" options={OPT.F1} value={a.f1} onChange={(v) => set("f1", v)} max={3} other={a.f1_lain} onOther={(v) => set("f1_lain", v)} otherError={errors.f1_lain} />
            </Question>
            <Question code="F2" title="Seberapa khawatir Anda terhadap risiko berikut dalam penggunaan AI di lingkungan pemerintah?" hint="1 = Sangat tidak khawatir, 5 = Sangat khawatir" error={F2_ITEMS.some((it) => errors[it.k]) ? "Jawab semua butir risiko." : null}>
              {F2_ITEMS.map((it, i) => (
                <MatrixRow key={it.k} label={`${i + 1}. ${it.t}`} error={errors[it.k]}>
                  <Scale name={it.k} value={a[it.k]} onChange={(v) => set(it.k, v)} />
                </MatrixRow>
              ))}
            </Question>
            <Question code="F3" title="Apakah Anda bersedia mengikuti pelatihan / Bimtek tentang penggunaan AI yang aman?" error={errors.f3}>
              <RadioCards name="f3" options={OPT.F3} value={a.f3} onChange={(v) => set("f3", v)} cols={3} />
            </Question>
            <Question code="F4" title="(Opsional) Saran atau masukan lain untuk Diskominfo SP terkait pemanfaatan AI di lingkungan Pemkab HST" error={errors.f4}>
              <div className={`${s.notice} ${s.noticeWarn}`}>Mohon tidak mencantumkan data pribadi atau informasi rahasia.</div>
              <textarea className="textarea" maxLength={F4_MAX} value={a.f4 ?? ""} onChange={(e) => set("f4", e.target.value)} placeholder="Tulis saran Anda di sini…" id="f4" />
              <p className={s.counter}>{(a.f4 ?? "").length}/{F4_MAX} karakter</p>
            </Question>
          </div>
        )}

        {step !== "PS" && (
          <footer className={s.nav}>
            <button className="btn btn-ghost" onClick={() => go(stepIdx - 1)} disabled={submitting} id="btn-back">
              ← Kembali
            </button>
            <div className="stack gap-1" style={{ alignItems: "flex-end" }}>
              <button className="btn btn-primary" onClick={next} disabled={submitting} id="btn-next">
                {stepIdx === steps.length - 1 ? (submitting ? "Mengirim…" : "Kirim Jawaban ✓") : <>Lanjut <span className="arrow">→</span></>}
              </button>
              {submitError && <p className="error-text">{submitError}</p>}
            </div>
          </footer>
        )}
      </section>
      {step !== "PS" && <p className={s.saved}>Jawaban tersimpan otomatis di perangkat ini.</p>}
    </div>
  );
}
