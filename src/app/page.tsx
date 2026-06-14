"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import { Menu, X, Wifi, WifiOff, Volume2, VolumeX } from "lucide-react"
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
  const [ttsEnabled, setTtsEnabled]           = useState(true)
  const [isSpeaking, setIsSpeaking]           = useState(false)
  const chatEndRef   = useRef<HTMLDivElement>(null)
  const ttsQueueRef  = useRef<string | null>(null)
  const voicesRef    = useRef<SpeechSynthesisVoice[]>([])
  const resumeIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const scrollToBottom = useCallback(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [])

  useEffect(() => { scrollToBottom() }, [messages, scrollToBottom])

  // Bersihkan interval resume TTS saat komponen unmount
  useEffect(() => {
    return () => {
      if (resumeIntervalRef.current) clearInterval(resumeIntervalRef.current)
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
    }
  }, [])

  // Cek status Groq
  useEffect(() => {
    async function checkGroq() {
      try {
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

  // ── Muat daftar voice TTS (di banyak browser mobile, voice list ──
  // ── baru terisi setelah event "voiceschanged" terpicu) ──────────
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return

    function loadVoices() {
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) voicesRef.current = voices
    }

    loadVoices()
    window.speechSynthesis.addEventListener("voiceschanged", loadVoices)
    return () => window.speechSynthesis.removeEventListener("voiceschanged", loadVoices)
  }, [])

  // ── TTS Player (Web Speech API - gratis, support Bahasa Indonesia) ───────
  const speakText = useCallback((text: string) => {
    if (!ttsEnabled) return
    if (typeof window === "undefined" || !window.speechSynthesis) {
      console.error("Browser tidak mendukung Web Speech API")
      return
    }

    // Stop ucapan sebelumnya
    window.speechSynthesis.cancel()
    if (resumeIntervalRef.current) {
      clearInterval(resumeIntervalRef.current)
      resumeIntervalRef.current = null
    }

    // Bersihkan markdown sederhana biar gak dibaca apa adanya
    const cleanText = text
      .replace(/\*\*(.*?)\*\*/g, "$1")
      .replace(/\*(.*?)\*/g, "$1")
      .replace(/#{1,6}\s/g, "")
      .replace(/`{1,3}[^`]*`{1,3}/g, "")
      .replace(/\|.*?\|/g, "")
      .replace(/[-*+]\s/g, "")
      .replace(/\d+\.\s/g, "")
      .replace(/>\s/g, "")
      .replace(/\n{2,}/g, ". ")
      .replace(/\n/g, " ")
      .trim()

    if (!cleanText) return

    // ── Pecah teks panjang jadi beberapa kalimat ──
    // Chrome di Android/iOS punya batas durasi ~speech per utterance;
    // teks panjang sering terhenti diam-diam. Memecah per kalimat
    // dan mengantrekannya secara berurutan jauh lebih stabil di HP.
    const chunks = cleanText
      .split(/(?<=[.!?])\s+/)
      .reduce<string[]>((acc, sentence) => {
        const last = acc[acc.length - 1]
        if (last && (last + " " + sentence).length < 180) {
          acc[acc.length - 1] = last + " " + sentence
        } else {
          acc.push(sentence)
        }
        return acc
      }, [])

    if (chunks.length === 0) return

    // Voice ID Bahasa Indonesia kalau tersedia (cache di voicesRef,
    // sudah dimuat oleh listener "voiceschanged")
    const voices = voicesRef.current.length > 0
      ? voicesRef.current
      : window.speechSynthesis.getVoices()
    const idVoice = voices.find(v => v.lang === "id-ID" || v.lang.startsWith("id"))

    let index = 0

    function speakNext() {
      if (index >= chunks.length) {
        setIsSpeaking(false)
        if (resumeIntervalRef.current) {
          clearInterval(resumeIntervalRef.current)
          resumeIntervalRef.current = null
        }
        if (ttsQueueRef.current) {
          const next = ttsQueueRef.current
          ttsQueueRef.current = null
          speakText(next)
        }
        return
      }

      const utterance = new SpeechSynthesisUtterance(chunks[index])
      utterance.lang = "id-ID"
      utterance.rate = 1
      utterance.pitch = 1
      if (idVoice) utterance.voice = idVoice

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onerror = (e) => {
        console.error("TTS error:", e.error)
        index++
        speakNext()
      }
      utterance.onend = () => {
        index++
        speakNext()
      }

      window.speechSynthesis.speak(utterance)
    }

    speakNext()

    // ── Workaround bug Chrome (Android & desktop): speechSynthesis ──
    // kadang otomatis pause setelah ~15 detik. resume() periodik
    // menjaga supaya pembacaan teks panjang tetap lanjut.
    resumeIntervalRef.current = setInterval(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.resume()
      }
    }, 5000)
  }, [ttsEnabled])

  function toggleTts() {
    const next = !ttsEnabled
    setTtsEnabled(next)
    // Stop audio kalau TTS dimatiin
    if (!next && typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
      if (resumeIntervalRef.current) {
        clearInterval(resumeIntervalRef.current)
        resumeIntervalRef.current = null
      }
      setIsSpeaking(false)
    }
  }

  async function loadSessions() {
    try {
      const res = await fetch("/api/sessions")
      const { sessions: data } = await res.json()
      const list: ChatSession[] = data || []
      setSessions(list)
      if (list.length > 0) {
        await selectSessionById(list[0].id)
      }
    } catch (e) {
      console.error("Gagal muat sesi:", e)
    }
  }

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

  async function selectSession(id: string) {
    setSidebarOpen(false)
    await selectSessionById(id)
  }

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

  async function deleteSession(id: string) {
    await fetch(`/api/sessions?id=${id}`, { method: "DELETE" })
    setSessions((prev) => prev.filter((s) => s.id !== id))
    if (activeSessionId === id) {
      setActiveSessionId(null)
      setMessages([WELCOME_MESSAGE])
    }
  }

  async function sendMessage(content: string) {
    if (isStreaming) return

    if (!activeSessionId) {
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

    let finalResponse = ""

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
                finalResponse = accumulated
                setGroqStatus("online")
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
        const botContent = data.content || "Maaf, terjadi kesalahan."
        finalResponse = botContent
        setMessages((prev) => {
          const updated = [...prev]
          const last = updated[updated.length - 1]
          if (last.role === "assistant") {
            return [...updated.slice(0, -1), { ...last, content: botContent }]
          }
          return updated
        })
      }

      // ── Auto-play TTS setelah streaming selesai ──
      if (finalResponse && ttsEnabled) {
        speakText(finalResponse)
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
        <header className="flex items-center justify-between h-16 px-4 shrink-0"
          style={{ background: "var(--accent)", borderBottom: "3px solid #000" }}>
          <div className="flex items-center gap-3">
            <button className="lg:hidden p-1.5 flex items-center justify-center"
                    style={{ color: "#000", background: "#fff", border: "2px solid #000" }}
                    onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={20}/> : <Menu size={20}/>}
            </button>
            <div>
              <h2 className="font-extrabold text-base uppercase" style={{ color: "#fff" }}>
                SiCabe
              </h2>
              <p className="text-xs font-bold" style={{ color: "#000" }}>
                Assistant Cabai Rawit Merah
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* ── TTS Toggle ── */}
            <button
              onClick={toggleTts}
              title={ttsEnabled ? "Matikan suara AI" : "Aktifkan suara AI"}
              className="flex items-center gap-1.5 text-xs px-3 py-1.5 font-extrabold uppercase transition-all"
              style={
                ttsEnabled
                  ? {
                      background: isSpeaking ? "var(--amber)" : "#fff",
                      border: "2px solid #000",
                      color: "#000",
                      boxShadow: "var(--shadow-sm)",
                    }
                  : {
                      background: "#ccc",
                      border: "2px solid #000",
                      color: "#000",
                    }
              }
            >
              {ttsEnabled ? (
                <>
                  <Volume2 size={12} className={isSpeaking ? "animate-pulse" : ""} />
                  <span className="hidden sm:inline">{isSpeaking ? "Berbicara..." : "Suara ON"}</span>
                </>
              ) : (
                <>
                  <VolumeX size={12} />
                  <span className="hidden sm:inline">Suara OFF</span>
                </>
              )}
            </button>

            {/* ── Groq Status ── */}
            <div className={`flex items-center gap-1.5 text-xs px-3 py-1.5 font-extrabold uppercase`}
              style={{
                border: "2px solid #000",
                boxShadow: "var(--shadow-sm)",
                background: groqStatus === "online" ? "#4ce0d2" : groqStatus === "offline" ? "var(--red)" : "#fff",
                color: groqStatus === "offline" ? "#fff" : "#000",
              }}>
              {groqStatus === "online"
                ? <><Wifi size={12}/> Groq Aktif</>
                : groqStatus === "offline"
                ? <><WifiOff size={12}/> Groq Offline</>
                : <span className="animate-pulse">Memeriksa...</span>
              }
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-4 space-y-4" style={{ background: "var(--bg-base)" }}>
          {isLoading ? (
            <div className="flex justify-center pt-12">
              <div className="flex gap-2 items-center text-sm font-extrabold uppercase" style={{ color: "var(--text-primary)" }}>
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
