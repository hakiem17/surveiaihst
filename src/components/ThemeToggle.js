"use client";
import { useEffect, useState } from "react";

export function ThemeToggle({ className = "", compact = false }) {
  // Selalu inisialisasi dengan "dark" agar SSR dan client render awal identik (100% bebas hydration mismatch)
  const [theme, setTheme] = useState("dark");

  useEffect(() => {
    // Sinkronisasi dengan localStorage atau atribut data-theme setelah hidrasi
    let current = "dark";
    try {
      const saved = localStorage.getItem("surveiai-theme");
      const domTheme = document.documentElement.getAttribute("data-theme");
      current = saved || domTheme || (window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark");
    } catch {}

    setTheme(current);
    document.documentElement.setAttribute("data-theme", current);

    // Sinkronkan antar-komponen ThemeToggle di halaman yang sama
    const onThemeChange = (e) => {
      if (e.detail === "light" || e.detail === "dark") {
        setTheme(e.detail);
      }
    };
    window.addEventListener("surveiai-theme-change", onThemeChange);
    return () => window.removeEventListener("surveiai-theme-change", onThemeChange);
  }, []);

  const toggleTheme = () => {
    const current = document.documentElement.getAttribute("data-theme") || theme || "dark";
    const next = current === "light" ? "dark" : "light";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      localStorage.setItem("surveiai-theme", next);
      window.dispatchEvent(new CustomEvent("surveiai-theme-change", { detail: next }));
    } catch {}
  };

  const isLight = theme === "light";

  return (
    <button
      type="button"
      className={`theme-toggle ${compact ? "theme-toggle-compact" : ""} ${className}`}
      onClick={toggleTheme}
      title={isLight ? "Beralih ke Mode Gelap (Dark Mode)" : "Beralih ke Mode Terang (Light Mode)"}
      aria-label={isLight ? "Beralih ke Mode Gelap" : "Beralih ke Mode Terang"}
      suppressHydrationWarning
    >
      <span className="theme-toggle-icon" aria-hidden="true">
        {isLight ? (
          // Bulan (Dark)
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
          </svg>
        ) : (
          // Matahari (Light)
          <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <line x1="12" y1="1" x2="12" y2="3" />
            <line x1="12" y1="21" x2="12" y2="23" />
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
            <line x1="1" y1="12" x2="3" y2="12" />
            <line x1="21" y1="12" x2="23" y2="12" />
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
          </svg>
        )}
      </span>
      {!compact && (
        <span className="theme-toggle-text">
          {isLight ? "Gelap" : "Terang"}
        </span>
      )}
    </button>
  );
}
