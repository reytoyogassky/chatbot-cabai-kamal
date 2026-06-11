"use client"

import { useEffect, useRef, useState } from "react"
import type { Message } from "@/types"

interface ChatMessageProps {
  message: Message
  isStreaming?: boolean
}

function parseMarkdown(text: string): string {
  return text
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm,  "<h2>$1</h2>")
    .replace(/^# (.+)$/gm,   "<h1>$1</h1>")
    .replace(/\*\*\*(.+?)\*\*\*/g, "<strong><em>$1</em></strong>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>")
    .replace(/^[•·\-\*] (.+)$/gm, "<li>$1</li>")
    .replace(/(<li>.*<\/li>\n?)+/g, (m) => `<ul>${m}</ul>`)
    .replace(/^\d+\. (.+)$/gm, "<li>$1</li>")
    .replace(/\|(.+)\|/g, (match) => {
      const cells = match.split("|").filter(Boolean)
      if (cells.every(c => /^[-:]+$/.test(c.trim()))) return ""
      return `<tr>${cells.map(c => `<td>${c.trim()}</td>`).join("")}</tr>`
    })
    .replace(/(<tr>.*<\/tr>\n?)+/g, (m) => `<table>${m}</table>`)
    .replace(/\n\n/g, "</p><p>")
    .replace(/\n/g, "<br/>")
}

function useFormattedTime(dateStr: string) {
  const [time, setTime] = useState("")
  useEffect(() => {
    setTime(new Date(dateStr).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }))
  }, [dateStr])
  return time
}

export default function ChatMessage({ message, isStreaming = false }: ChatMessageProps) {
  const isUser = message.role === "user"
  const contentRef = useRef<HTMLDivElement>(null)
  const formattedTime = useFormattedTime(message.created_at)

  useEffect(() => {
    if (isStreaming && contentRef.current) {
      contentRef.current.scrollIntoView({ behavior: "smooth", block: "end" })
    }
  }, [message.content, isStreaming])

  if (isUser) {
    return (
      <div className="flex justify-end msg-animate">
        <div className="max-w-[75%]">
          <div
            className="px-4 py-3 rounded-2xl rounded-br-sm text-sm leading-relaxed shadow-sm"
            style={{
              background: "var(--accent-dim)",
              color: "#fff",
            }}
          >
            {message.content}
          </div>
          <p className="text-right text-xs mt-1 pr-1" style={{ color: "var(--text-muted)" }}>
            {formattedTime}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex gap-3 msg-animate" ref={contentRef}>
      {/* Avatar bot */}
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0 mt-1"
        style={{ background: "var(--accent-muted)", border: "1px solid rgba(74,222,128,0.2)" }}
      >
        🌶️
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="rounded-2xl rounded-tl-sm px-4 py-3"
          style={{
            background: "var(--bg-surface)",
            border: "1px solid var(--border-mid)",
          }}
        >
          {message.content === "..." ? (
            <div className="flex gap-1.5 items-center py-1">
              <div className="typing-dot" />
              <div className="typing-dot" />
              <div className="typing-dot" />
            </div>
          ) : (
            <div
              className={`prose-chat ${isStreaming ? "streaming-cursor" : ""}`}
              dangerouslySetInnerHTML={{ __html: `<p>${parseMarkdown(message.content)}</p>` }}
            />
          )}
        </div>
        <p className="text-xs mt-1 pl-1" style={{ color: "var(--text-muted)" }}>
          {isStreaming ? "Mengetik..." : formattedTime}
        </p>
      </div>
    </div>
  )
}