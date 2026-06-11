"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Menu, X, Wifi, WifiOff } from "lucide-react"
import Sidebar from "@/components/Sidebar"
import ChatMessage from "@/components/ChatMessage"
import InputBar from "@/components/InputBar"
import type { Message, ChatSession } from "@/types"

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  session_id: "",
  role: "assistant",
  content: `👋 **Selamat datang di Konsultan Budidaya Cabai Rawit Merah!**

Saya adalah AI Agent berbasis riset dari Kabupaten Sumedang yang siap membantu Anda.

**Saya bisa membantu tentang:**
- 🌱 Persiapan lahan & penyemaian
- 🧪 Pemupukan & pengairan optimal
- 🦠 Diagnosa penyakit (Fusarium, Antraknose, dll)
- ⚠️ Prediksi & solusi gagal panen
- 🌾 Teknik panen & pascapanen

> 💡 **Tips:** Ceritakan kondisi tanaman Anda secara detail (usia, gejala, kondisi cuaca) untuk mendapatkan rekomendasi yang lebih tepat!

Silakan ketik pertanyaan Anda atau pilih topik di bawah.`,
  created_at: new Date().toISOString(),
}

export default function HomePage() {
  const [sessions, setSessions]               = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages]               = useState<Message[]>([WELCOME_MESSAGE])
  const [isLoading, setIsLoading]             = useState(false)
  const [isStreaming, setIsStreaming]          = useState(false)
  const [sidebarOpen, setSidebarOpen]         = useState(false)
  const [groqStatus, setGroqStatus]           = useState<"online" | "offline" | "checking">("checking")
  const [totalMessages, setTotalMessages]     = useState(0)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // Cek status Groq
  useEffect(() => {
    async function checkGroq() {
      try {
        // Cukup hit endpoint GET sessions untuk cek koneksi
        const res = await fetch("/api/sessions")
        setGroqStatus(res.ok ? "online" : "offline")
      } catch {
        setGroqStatus("offline")
      }
    }
    checkGroq()
  }, [])

  // Muat daftar sesi
  useEffect(() => {
    loadSessions()
  }, [])

  async function loadSessions() {
    try {
      const res = await fetch("/api/sessions")
      const { sessions: data } = await res.json()
      const list: ChatSession[] = data || []
      setSessions(list)
      // Auto-load sesi terbaru supaya riwayat langsung muncul
      if (list.length > 0) {
        await selectSessionById(list[0].id)
      }
    } catch (e) {
      console.error("Gagal muat sesi:", e)
    }
  }

  // Internal helper — load pesan tanpa side-effect sidebar
  async function selectSessionById(id: string) {
    setActiveSessionId(id)
    setIsLoading(true)
    try {
      const res = await fetch(`/api/sessions/messages?session_id=${id}`)
      const { messages: data, error } = await res.json()
      if (error) throw new Error(error)
      setMessages(data?.length > 0 ? data : [WELCOME_MESSAGE])
    } catch (e) {
      console.error("Gagal muat pesan:", e)
      setMessages([WELCOME_MESSAGE])
    } finally {
      setIsLoading(false)
    }
  }

  // Pilih sesi → muat pesan
  async function selectSession(id: string) {
    setSidebarOpen(false)
    await selectSessionById(id)
  }

  // Buat sesi baru secara eksplisit
  async function newSession() {
    try {
      const res = await fetch("/api/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Sesi Baru" }),
      })
      const { session } = await res.json()
      if (session) {
        setSessions((prev) => [session, ...prev])
        setActiveSessionId(session.id)
      }
    } catch (e) {
      console.error("Gagal buat sesi:", e)
    }
    setMessages([WELCOME_MESSAGE])
    setSidebarOpen(false)
  }

  // Hapus sesi
  async function deleteSession(id: string) {
    await fetch(`/api/sessions?id=${id}`, { method: "DELETE" })
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (activeSessionId === id) {
      setActiveSessionId(null)
      setMessages([WELCOME_MESSAGE])
    }
  }

  // Kirim pesan
  async function sendMessage(content: string) {
    if (isStreaming) return

    // Harus ada sesi aktif dulu
    if (!activeSessionId) {
      // Auto-buat sesi kalau user langsung chat tanpa pilih/buat sesi
      // (hanya sekali, tidak berulang)
      try {
        const res = await fetch("/api/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: content.slice(0, 60) }),
        })
        const { session } = await res.json()
        if (!session) return
        setSessions((prev) => [session, ...prev])
        setActiveSessionId(session.id)
        await doSendMessage(content, session.id)
      } catch (e) {
        console.error("Gagal buat sesi:", e)
      }
      return
    }

    await doSendMessage(content, activeSessionId)
  }

  async function doSendMessage(content: string, sessionId: string) {
    const userMsg: Message = {
      id: `u-${Date.now()}`,
      session_id: sessionId,
      role: "user",
      content,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, userMsg])
    setTotalMessages((c) => c + 1)

    const botPlaceholder: Message = {
      id: `b-${Date.now()}`,
      session_id: sessionId,
      role: "assistant",
      content: "...",
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, botPlaceholder])
    setIsStreaming(true)

    const history = messages
      .filter((m) => m.id !== "welcome")
      .slice(-10)
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, content, history }),
      })

      if (!res.ok) throw new Error("API error")

      const contentType = res.headers.get("Content-Type") || ""

      if (contentType.includes("text/event-stream")) {
        const reader = res.body!.getReader()
        const decoder = new TextDecoder()
        let accumulated = ""

        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value)
          const lines = chunk.split("\n").filter((l) => l.startsWith("data: "))

          for (const line of lines) {
            try {
              const data = JSON.parse(line.slice(6))
              if (data.type === "token") {
                accumulated += data.content
                setMessages((prev) => {
                  const updated = [...prev]
                  const last = updated[updated.length - 1]
                  if (last.role === "assistant") {
                    return [...updated.slice(0, -1), { ...last, content: accumulated }]
                  }
                  return updated
                })
              }
              if (data.type === "done") {
                setGroqStatus("online")
                // Update title sesi dengan pesan pertama jika masih "Sesi Baru"
                setSessions((prev) =>
                  prev.map((s) =>
                    s.id === sessionId && s.title === "Sesi Baru"
                      ? { ...s, title: content.slice(0, 60) }
                      : s
                  )
                )
              }
            } catch {/* skip */}
          }
        }
      } else {
        const data = await res.json()
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === "assistant") {
            return [...updated.slice(0, -1), { ...last, content: data.content || "Maaf, terjadi kesalahan." }]
          }
          return updated
        })
      }
    } catch (e) {
      console.error("Send error:", e)
      setMessages((prev) => {
        const updated = [...prev]
        const last = updated[updated.length - 1]
        if (last.role === "assistant" && last.content === "...") {
          return [...updated.slice(0, -1), { ...last, content: "⚠️ Terjadi kesalahan. Pastikan `GROQ_API_KEY` sudah diisi dengan benar di `.env.local`." }]
        }
        return updated
      })
    } finally {
      setIsStreaming(false)
      setTotalMessages((c) => c + 1)
    }
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className={`fixed lg:relative inset-y-0 left-0 z-30 transition-transform duration-300 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      }`}>
        <Sidebar
          sessions={sessions}
          activeSessionId={activeSessionId}
          onSelectSession={selectSession}
          onNewSession={newSession}
          onDeleteSession={deleteSession}
          onQuickTopic={(q) => { setSidebarOpen(false); sendMessage(q) }}
          totalMessages={totalMessages}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="flex items-center justify-between h-14 px-4 shrink-0"
          style={{ background: "var(--bg-surface)", borderBottom: "1px solid var(--border)" }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 rounded-lg hover:bg-white/5"
                    style={{ color: "var(--text-muted)" }}
                    onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={20}/> : <Menu size={20}/>}
            </button>
            <div>
              <h2 className="font-semibold text-sm" style={{ color: "var(--text-primary)" }}>
                Asisten Budidaya Cabai
              </h2>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                Ahli Cabai Rawit Merah · Sumedang
              </p>
            </div>
          </div>

          <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border ${
            groqStatus === "online" ? "bg-green-950/50 border-green-800/50 text-green-400"
            : groqStatus === "offline" ? "bg-red-950/50 border-red-800/50 text-red-400"
            : ""
          }`} style={groqStatus === "checking" ? { background: "var(--bg-elevated)", border: "1px solid var(--border)", color: "var(--text-muted)" } : {}}>
            {groqStatus === "online"
              ? <><Wifi size={12}/> Groq Aktif</>
              : groqStatus === "offline"
              ? <><WifiOff size={12}/> Groq Offline</>
              : <span className="animate-pulse">Memeriksa...</span>
            }
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: "var(--bg-base)" }}>
          {isLoading ? (
            <div className="flex justify-center pt-12">
              <div className="flex gap-2 items-center text-sm" style={{ color: "var(--text-muted)" }}>
                <div className="typing-dot"/><div className="typing-dot"/><div className="typing-dot"/>
                <span className="ml-1">Memuat riwayat...</span>
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <ChatMessage
                key={msg.id}
                message={msg}
                isStreaming={isStreaming && i === messages.length - 1 && msg.role === "assistant" && msg.content !== "..."}
              />
            ))
          )}
          <div ref={chatEndRef} />
        </main>

        <InputBar onSend={sendMessage} disabled={isStreaming} />
      </div>
    </div>
  )
}