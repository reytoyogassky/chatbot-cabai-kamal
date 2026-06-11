import type { Metadata } from "next"
import { Plus_Jakarta_Sans } from "next/font/google"
import "./globals.css"

const font = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
})

export const metadata: Metadata = {
  title: "Konsultan Cabai Rawit Merah | Kab. Sumedang",
  description:
    "AI Agent konsultan budidaya cabai rawit merah berbasis penelitian Decision Tree Kab. Sumedang 2020–2025. Gratis dengan Groq + Supabase.",
  keywords: ["cabai rawit", "budidaya cabai", "pertanian sumedang", "gagal panen", "konsultan pertanian"],
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" className={font.variable}>
      <body style={{ background: "var(--bg-base)", fontFamily: "var(--font-sans), sans-serif" }}>
        {children}
      </body>
    </html>
  )
}