"use client";
import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Logo } from "@/components/Logo";
import { browserClient } from "@/lib/supabase-browser";
import s from "./login.module.css";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [isConfigured, setIsConfigured] = useState(true);

  useEffect(() => {
    const hasConfig = Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)
    );
    /* eslint-disable react-hooks/set-state-in-effect */
    setIsConfigured(hasConfig);
    const err = searchParams.get("e");
    if (err === "config") {
      setErrorMsg("Koneksi database Supabase belum dikonfigurasi. Hubungi administrator sistem.");
    }
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [searchParams]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    if (!isConfigured) {
      setErrorMsg("Koneksi Supabase belum terpasang. Harap periksa konfigurasi server.");
      setLoading(false);
      return;
    }

    try {
      const supabase = browserClient();
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMsg(error.message || "Email atau kata sandi salah.");
        setLoading(false);
        return;
      }
      if (data?.session) {
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      setErrorMsg("Gagal melakukan autentikasi: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className={s.wrapper}>
      <div className={`card ${s.loginCard} fade-up`}>
        <div className={s.head}>
          <Link href="/" className={s.logoWrap}>
            <Logo size={42} />
          </Link>
          <span className="badge accent">Portal Internal</span>
          <h2>Dashboard Pemantauan & Analitik</h2>
          <p className="muted small">
            Survei Pemanfaatan AI 2026 · Diskominfo SP Kabupaten Hulu Sungai Tengah
          </p>
        </div>

        {errorMsg && (
          <div className={`${s.notice} ${s.noticeErr}`} role="alert">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleLogin} className={s.form}>
          <div className={s.field}>
            <label className="field-label" htmlFor="email">Email Dinas / Akun Admin</label>
            <input
              id="email"
              type="email"
              className="input"
              placeholder="admin@hulusungaitengahkab.go.id"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required={isConfigured}
            />
          </div>

          <div className={s.field}>
            <label className="field-label" htmlFor="password">Kata Sandi</label>
            <input
              id="password"
              type="password"
              className="input"
              placeholder="••••••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required={isConfigured}
            />
          </div>

          <button type="submit" className="btn btn-primary btn-lg" disabled={loading} id="btn-login">
            {loading ? "Memverifikasi…" : "Masuk ke Dashboard →"}
          </button>
        </form>

        <div className={s.foot}>
          <Link href="/" className="small muted">
            ← Kembali ke Beranda Publik
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className={s.wrapper}><div className={`card ${s.loginCard}`} style={{ minHeight: 300 }} /></div>}>
      <LoginForm />
    </Suspense>
  );
}
