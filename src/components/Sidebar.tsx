"use client"

import { useState } from "react"
import { MessageSquare, Trash2, Plus, Leaf, AlertTriangle, Sprout, FlaskConical, Bug, Wheat, Droplets, BarChart3 } from "lucide-react"
import type { ChatSession } from "@/types"

interface SidebarProps {
  sessions: ChatSession[]
  activeSessionId: string | null
  onSelectSession: (id: string) => void
  onNewSession: () => void
  onDeleteSession: (id: string) => void
  onQuickTopic: (topic: string) => void
  totalMessages: number
}

const QUICK_TOPICS = [
  { icon: AlertTriangle, label: "Gagal Panen",     query: "Bagaimana cara memprediksi dan mencegah gagal panen cabai rawit?" },
  { icon: Leaf,          label: "Layu Fusarium",   query: "Tanaman cabai saya layu mendadak, kemungkinan layu fusarium. Apa solusinya?" },
  { icon: Sprout,        label: "Antraknose",      query: "Buah cabai saya berbercak coklat kehitaman, kemungkinan antraknose. Bagaimana penanganannya?" },
  { icon: FlaskConical,  label: "Pemupukan",       query: "Berikan panduan lengkap pemupukan cabai rawit merah dari awal hingga panen" },
  { icon: Bug,           label: "Hama & Penyakit", query: "Apa saja hama dan penyakit utama cabai rawit merah dan cara pengendaliannya?" },
  { icon: Wheat,         label: "Persiapan Lahan", query: "Bagaimana cara mempersiapkan lahan yang baik untuk budidaya cabai rawit merah?" },
  { icon: Droplets,      label: "Pengairan",       query: "Berapa kebutuhan air dan frekuensi pengairan yang ideal untuk cabai rawit?" },
  { icon: BarChart3,     label: "Analisis Usaha",  query: "Berikan analisis usaha tani cabai rawit merah per 1 hektar beserta estimasi keuntungannya" },
]

export default function Sidebar({
  sessions, activeSessionId, onSelectSession,
  onNewSession, onDeleteSession, onQuickTopic, totalMessages
}: SidebarProps) {
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation()
    if (deleteConfirm === id) {
      onDeleteSession(id)
      setDeleteConfirm(null)
    } else {
      setDeleteConfirm(id)
      setTimeout(() => setDeleteConfirm(null), 2500)
    }
  }

  function formatDate(dateStr: string) {
    const d = new Date(dateStr)
    const now = new Date()
    const diffH = (now.getTime() - d.getTime()) / 3600000
    if (diffH < 1)  return "Baru saja"
    if (diffH < 24) return `${Math.floor(diffH)} jam lalu`
    if (diffH < 48) return "Kemarin"
    return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" })
  }

  return (
    <aside
      className="flex flex-col h-full w-72 min-w-[280px] select-none"
      style={{ background: "var(--bg-surface)", borderRight: "3px solid #000" }}
    >
      {/* ── Header ── */}
      <div className="px-5 pt-5 pb-4" style={{ borderBottom: "3px solid #000", background: "var(--accent)" }}>
        <div className="flex items-center gap-3 mb-3">
          <div
            className="w-10 h-10 flex items-center justify-center text-lg shrink-0"
            style={{ background: "#fff", border: "2px solid #000", boxShadow: "var(--shadow-sm)" }}
          >
            🌶️
          </div>
          <div>
            <h1 className="font-extrabold text-sm uppercase tracking-wide" style={{ color: "#fff" }}>
              SiCabe
            </h1>
            <p className="text-xs mt-0.5 font-bold" style={{ color: "#000" }}>
              Asisten Budidaya Cabai Rawit Merah
            </p>
          </div>
        </div>
        <div
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 font-extrabold uppercase"
          style={{ background: "var(--amber)", color: "#000", border: "2px solid #000" }}
        >
          <span className="w-2 h-2 rounded-full bg-black animate-pulse" />
          GroqAi
        </div>
      </div>

      {/* ── Statistik ── */}
      <div className="grid grid-cols-3 gap-2 px-4 py-3" style={{ borderBottom: "3px solid #000" }}>
        {[
          { value: totalMessages, label: "Pesan" },
          { value: sessions.length, label: "Sesi" },
          { value: "84%", label: "Akurasi" },
        ].map((s) => (
          <div
            key={s.label}
            className="text-center py-2"
            style={{ background: "var(--bg-base)", border: "2px solid #000", boxShadow: "var(--shadow-sm)" }}
          >
            <div className="text-base font-extrabold" style={{ color: "var(--accent-dim)" }}>{s.value}</div>
            <div className="text-xs font-bold uppercase" style={{ color: "var(--text-muted)" }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── Topik Cepat ── */}
      <div className="px-4 pt-3 pb-2">
        <p className="text-xs uppercase tracking-widest mb-2 font-extrabold" style={{ color: "var(--text-primary)" }}>
          Topik Cepat
        </p>
        <div className="grid grid-cols-2 gap-1.5">
          {QUICK_TOPICS.map(({ icon: Icon, label, query }) => (
            <button
              key={label}
              onClick={() => onQuickTopic(query)}
              className="flex items-center gap-1.5 text-left text-xs px-2.5 py-2 font-bold transition-all duration-100"
              style={{
                background: "var(--bg-base)",
                color: "var(--text-primary)",
                border: "2px solid #000",
                boxShadow: "var(--shadow-sm)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = "var(--accent-muted)"
                e.currentTarget.style.transform = "translate(2px, 2px)"
                e.currentTarget.style.boxShadow = "0px 0px 0px #000"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = "var(--bg-base)"
                e.currentTarget.style.transform = "translate(0, 0)"
                e.currentTarget.style.boxShadow = "var(--shadow-sm)"
              }}
            >
              <Icon size={12} className="shrink-0" style={{ color: "var(--accent-dim)" }} />
              <span className="truncate">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Riwayat ── */}
      <div
        className="flex-1 flex flex-col overflow-hidden px-4 pt-3"
        style={{ borderTop: "3px solid #000" }}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs uppercase tracking-widest font-extrabold" style={{ color: "var(--text-primary)" }}>Riwayat</p>
          <button
            onClick={onNewSession}
            className="flex items-center gap-1 text-xs px-2.5 py-1 font-extrabold uppercase transition-all duration-100"
            style={{ background: "var(--amber)", color: "#000", border: "2px solid #000", boxShadow: "var(--shadow-sm)" }}
            onMouseEnter={e => { e.currentTarget.style.transform = "translate(2px, 2px)"; e.currentTarget.style.boxShadow = "0px 0px 0px #000" }}
            onMouseLeave={e => { e.currentTarget.style.transform = "translate(0, 0)"; e.currentTarget.style.boxShadow = "var(--shadow-sm)" }}
          >
            <Plus size={12} /> Baru
          </button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-1.5 pr-0.5 pb-2">
          {sessions.length === 0 && (
            <p className="text-xs text-center py-6 font-bold uppercase" style={{ color: "var(--text-muted)" }}>
              Belum ada riwayat
            </p>
          )}
          {sessions.map((s) => (
            <div
              key={s.id}
              onClick={() => onSelectSession(s.id)}
              className="group flex items-start gap-2 px-3 py-2.5 cursor-pointer transition-all duration-100"
              style={{
                background: activeSessionId === s.id ? "var(--accent-muted)" : "var(--bg-base)",
                border: "2px solid #000",
                boxShadow: activeSessionId === s.id ? "var(--shadow-sm)" : "none",
              }}
            >
              <MessageSquare size={13} className="mt-0.5 shrink-0" style={{ color: "var(--text-primary)" }} />
              <div className="flex-1 min-w-0">
                <p className="text-xs truncate font-extrabold" style={{ color: "var(--text-primary)" }}>{s.title}</p>
                <p className="text-xs mt-0.5 font-bold uppercase" style={{ color: "var(--text-muted)" }}>{formatDate(s.updated_at)}</p>
              </div>
              <button
                onClick={(e) => handleDelete(e, s.id)}
                className="shrink-0 p-0.5 transition-all opacity-0 group-hover:opacity-100"
                style={{ color: deleteConfirm === s.id ? "var(--red)" : "var(--text-muted)" }}
                title={deleteConfirm === s.id ? "Klik lagi untuk hapus" : "Hapus sesi"}
              >
                <Trash2 size={13} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Footer ── */}
      <div
        className="px-4 py-3 text-xs text-center leading-relaxed font-extrabold uppercase"
        style={{ borderTop: "3px solid #000", color: "#fff", background: "#000" }}
      >
        Skripsi Kamal Nurfalah · UNSAP 2025
      </div>
    </aside>
  )
}