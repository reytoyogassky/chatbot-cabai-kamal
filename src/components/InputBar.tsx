"use client"

import { useState, useRef, useEffect } from "react"
import { Send } from "lucide-react"

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

export default function InputBar({ onSend, disabled = false }: InputBarProps) {
  const [input, setInput] = useState("")
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 120) + "px"
  }, [input])

  function handleSend() {
    const text = input.trim()
    if (!text || disabled) return
    setInput("")
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

  return (
    <div
      className="px-4 py-3"
      style={{
        background: "var(--bg-surface)",
        borderTop: "1px solid var(--border)",
      }}
    >
      {/* ── Sugesti ── */}
      {!input && !disabled && (
        <div className="flex gap-2 overflow-x-auto pb-2 mb-2 scrollbar-none">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => handleSuggestion(s)}
              className="shrink-0 text-xs px-3 py-1.5 rounded-full transition-all whitespace-nowrap"
              style={{
                background: "var(--bg-elevated)",
                color: "var(--text-muted)",
                border: "1px solid var(--border)",
              }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = "rgba(74,222,128,0.4)"
                e.currentTarget.style.color = "var(--accent)"
                e.currentTarget.style.background = "var(--accent-muted)"
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = "var(--border)"
                e.currentTarget.style.color = "var(--text-muted)"
                e.currentTarget.style.background = "var(--bg-elevated)"
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* ── Input Row ── */}
      <div
        className="flex items-end gap-2 rounded-xl px-4 py-2 transition-all"
        style={{
          background: "var(--bg-elevated)",
          border: "1px solid var(--border-mid)",
        }}
        onFocus={(e) => e.currentTarget.style.borderColor = "rgba(74,222,128,0.4)"}
        onBlur={(e) => e.currentTarget.style.borderColor = "var(--border-mid)"}
      >
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          rows={1}
          placeholder={disabled ? "AI Agent sedang menjawab..." : "Tanya tentang cabai rawit... (Enter untuk kirim)"}
          className="flex-1 bg-transparent resize-none outline-none text-sm leading-relaxed disabled:cursor-not-allowed"
          style={{
            color: "var(--text-primary)",
            minHeight: "36px",
            maxHeight: "120px",
          }}
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || disabled}
          className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: input.trim() && !disabled ? "var(--accent-dim)" : "var(--bg-hover)",
            color: input.trim() && !disabled ? "#fff" : "var(--text-muted)",
          }}
        >
          <Send size={15} />
        </button>
      </div>

      <p className="text-center text-xs mt-2" style={{ color: "var(--text-muted)" }}>
        Shift+Enter untuk baris baru · Data penelitian Sumedang 2020–2025
      </p>
    </div>
  )
}