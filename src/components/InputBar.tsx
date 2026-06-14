"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { Send, Mic, MicOff } from "lucide-react"

interface InputBarProps {
  onSend: (text: string) => void
  disabled?: boolean
}

const SUGGESTIONS = [
  "Daun cabai saya menguning dan keriting",
  "Bagaimana cara mencegah layu fusarium?",
  "Prediksi risiko gagal panen saya",
  "Rekomendasi pemupukan minggu ini",
  "Buah cabai bercak hitam, apa penyebabnya?",
]

type RecordState = "idle" | "recording"

export default function InputBar({ onSend, disabled = false }: InputBarProps) {
  const [input, setInput] = useState("")
  const [recordState, setRecordState] = useState<RecordState>("idle")
  const [interimText, setInterimText] = useState("")
  const [sttSupported, setSttSupported] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)
  const baseTextRef = useRef("") // teks yang sudah ada sebelum mulai rekam
  const shouldRestartRef = useRef(false)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
  }, [input, interimText])

  // ── Cek dukungan Web Speech API ──
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    setSttSupported(!!SpeechRecognition)
  }, [])

  function handleSend(textOverride?: string) {
    const text = (textOverride ?? input).trim()
    if (!text || disabled) return
    setInput("")
    setInterimText("")
    onSend(text)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  function handleSuggestion(text: string) {
    if (disabled) return
    setInput(text)
    textareaRef.current?.focus()
  }

  // ── Realtime STT via Web Speech API (Bahasa Indonesia) ──
  const startRecording = useCallback(() => {
    if (recordState !== "idle" || disabled) return

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.error("Browser tidak mendukung Web Speech API")
      setSttSupported(false)
      return
    }

    const recognition = new SpeechRecognition()
    recognition.lang = "id-ID"
    recognition.continuous = true
    recognition.interimResults = true

    baseTextRef.current = input ? input + " " : ""
    shouldRestartRef.current = true

    recognition.onresult = (event: any) => {
      let finalChunk = ""
      let interimChunk = ""

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript
        if (event.results[i].isFinal) {
          finalChunk += transcript + " "
        } else {
          interimChunk += transcript
        }
      }

      if (finalChunk) {
        baseTextRef.current = baseTextRef.current + finalChunk
        setInput(baseTextRef.current.trim())
        setInterimText("")

        // Auto-send begitu ada hasil final, tanpa perlu Enter
        const finalText = baseTextRef.current.trim()
        shouldRestartRef.current = false
        recognition.stop()
        if (finalText) handleSend(finalText)
        baseTextRef.current = ""
      } else {
        setInterimText(interimChunk)
      }
    }

    recognition.onerror = (event: any) => {
      console.error("STT error:", event.error)
      shouldRestartRef.current = false
      setRecordState("idle")
      setInterimText("")
    }

    recognition.onend = () => {
      if (shouldRestartRef.current) {
        // Restart otomatis biar tetap realtime/continuous
        try {
          recognition.start()
        } catch {
          setRecordState("idle")
        }
      } else {
        setRecordState("idle")
        setInterimText("")
      }
    }

    recognitionRef.current = recognition
    try {
      recognition.start()
      setRecordState("recording")
    } catch (err) {
      console.error("Mic error:", err)
      setRecordState("idle")
    }
  }, [recordState, disabled, input])

  const stopRecording = useCallback(() => {
    if (recordState !== "recording") return
    shouldRestartRef.current = false
    recognitionRef.current?.stop()
  }, [recordState])

  function handleMicClick() {
    if (recordState === "idle") startRecording()
    else stopRecording()
  }

  const displayValue = recordState === "recording"
    ? (input + (interimText ? (input ? " " : "") + interimText : ""))
    : input

  return (
    <div
      className="px-4 py-3"
      style={{
        background: "var(--bg-surface)",
        borderTop: "3px solid #000",
      }}
    >
      {/* ── Sugesti ── */}
      {!input && !disabled && recordState === "idle" && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              className="shrink-0 text-xs px-3 py-1.5 font-bold whitespace-nowrap transition-all duration-100"
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
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Input Row ── */}
      <div
        className="flex items-end gap-2 px-4 py-2 transition-all"
        style={{
          background: "var(--bg-base)",
          border: "2px solid #000",
          boxShadow: "var(--shadow)",
        }}
      >
        {/* Tombol Mikrofon */}
        <button
          onClick={handleMicClick}
          disabled={disabled || !sttSupported}
          title={
            !sttSupported ? "Browser tidak mendukung pengenalan suara"
            : recordState === "recording" ? "Klik untuk berhenti mendengarkan"
            : "Klik untuk mulai bicara (realtime, tanpa Enter)"
          }
          className="shrink-0 w-9 h-9 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: recordState === "recording" ? "var(--red)" : "var(--amber)",
            color: "#000",
            border: "2px solid #000",
          }}
        >
          {recordState === "recording" ? (
            <MicOff size={16} color="#fff" />
          ) : (
            <Mic size={16} />
          )}
        </button>

        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={
            recordState === "recording" ? "🎙️ Mendengarkan... ngomong aja, otomatis terkirim"
            : disabled ? "AI Agent sedang menjawab..."
            : "Tanya tentang cabai rawit... (Enter untuk kirim)"
          }
          className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed font-bold disabled:cursor-not-allowed"
          style={{
            color: recordState === "recording" && interimText ? "var(--text-muted)" : "var(--text-primary)",
            minHeight: "36px",
            maxHeight: "120px",
          }}
        />
        <button
          onClick={() => handleSend()}
          disabled={!input.trim() || disabled}
          className="shrink-0 w-9 h-9 flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: input.trim() && !disabled ? "var(--accent)" : "#ccc",
            color: "#fff",
            border: "2px solid #000",
          }}
        >
          <Send size={15} />
        </button>
      </div>

      {/* Recording indicator */}
      {recordState === "recording" && (
        <div className="flex items-center gap-2 mt-2 px-1">
          <span
            className="inline-block w-2.5 h-2.5 animate-pulse"
            style={{ background: "var(--red)", border: "1px solid #000" }}
          />
          <p className="text-xs font-extrabold uppercase" style={{ color: "var(--red)" }}>
            Mendengarkan... ucapan akan otomatis terkirim
          </p>
        </div>
      )}

      {!sttSupported && recordState === "idle" && (
        <p className="text-center text-xs mt-2 font-extrabold uppercase" style={{ color: "var(--red)" }}>
          Pengenalan suara tidak didukung di browser ini
        </p>
      )}

      {recordState === "idle" && sttSupported && (
        <p className="text-center text-xs mt-2 font-bold uppercase" style={{ color: "var(--text-muted)" }}>
          Shift+Enter untuk baris baru · Data penelitian Sumedang 2020–2025
        </p>
      )}
    </div>
  )
}
