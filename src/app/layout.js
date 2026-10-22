import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

export const metadata = {
  title: {
    default: "Survei Pemanfaatan AI — Pemkab Hulu Sungai Tengah 2026",
    template: "%s · Survei AI Pemkab HST 2026",
  },
  description:
    "Survei Pemanfaatan Artificial Intelligence bagi seluruh pegawai Pemerintah Kabupaten Hulu Sungai Tengah Tahun 2026, diselenggarakan Diskominfo SP. Anonim, 5–7 menit.",
};

export const viewport = {
  themeColor: "#070b16",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id" className={jakarta.variable} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('surveiai-theme');
                  var theme = saved || (window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
                  document.documentElement.setAttribute('data-theme', theme);
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body>
        <div className="ambient" aria-hidden="true">
          <div className="grid-bg" />
        </div>
        {children}
      </body>
    </html>
  );
}
