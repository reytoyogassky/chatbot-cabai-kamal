import { NextRequest, NextResponse } from "next/server"
import { supabase, GROQ_API_KEY, GROQ_MODEL, SYSTEM_PROMPT } from "@/lib"
import type { SendMessagePayload } from "@/types"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    const body: SendMessagePayload = await req.json()
    const { session_id, content, history } = body

    if (!content?.trim()) {
      return NextResponse.json({ error: "Pesan tidak boleh kosong" }, { status: 400 })
    }

    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY belum dikonfigurasi" }, { status: 500 })
    }

    // Session WAJIB ada — tidak auto-create
    if (!session_id) {
      return NextResponse.json({ error: "session_id diperlukan" }, { status: 400 })
    }

    // Simpan pesan user ke Supabase
    await supabase.from("messages").insert({
      session_id,
      role: "user",
      content: content.trim(),
    })

    // Siapkan messages untuk Groq
    const groqMessages = [
      { role: "system", content: SYSTEM_PROMPT },
      ...history,
      { role: "user", content: content.trim() },
    ]

    // Panggil Groq API dengan streaming
    const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: GROQ_MODEL,
        messages: groqMessages,
        stream: true,
        temperature: 0.7,
        max_tokens: 2048,
      }),
    })

    if (!groqRes.ok) {
      const errText = await groqRes.text()
      console.error("Groq API error:", errText)
      const fallback = getFallbackResponse(content)
      await supabase.from("messages").insert({
        session_id,
        role: "assistant",
        content: fallback,
      })
      return NextResponse.json({ session_id, content: fallback, source: "fallback" })
    }

    // Stream jawaban Groq ke client
    let fullResponse = ""
    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ type: "meta", session_id })}\n\n`)
        )

        const reader = groqRes.body!.getReader()
        const decoder = new TextDecoder()
        let buffer = ""

        try {
          while (true) {
            const { done, value } = await reader.read()
            if (done) break

            buffer += decoder.decode(value, { stream: true })
            const lines = buffer.split("\n")
            buffer = lines.pop() ?? ""

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue
              const jsonStr = line.slice(6).trim()
              if (!jsonStr || jsonStr === "[DONE]") continue

              try {
                const parsed = JSON.parse(jsonStr)
                const token = parsed.choices?.[0]?.delta?.content ?? ""
                if (token) {
                  fullResponse += token
                  controller.enqueue(
                    encoder.encode(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`)
                  )
                }
              } catch { /* skip */ }
            }
          }
        } finally {
          reader.releaseLock()
        }

        if (fullResponse) {
          await supabase.from("messages").insert({
            session_id,
            role: "assistant",
            content: fullResponse,
          })
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "done" })}\n\n`))
        controller.close()
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}

function getFallbackResponse(input: string): string {
  const lower = input.toLowerCase()
  if (lower.includes("layu") || lower.includes("fusarium"))
    return "⚠️ **Groq API tidak tersedia.** Pastikan `GROQ_API_KEY` sudah diisi dengan benar di `.env.local`."
  if (lower.includes("gagal panen"))
    return "⚠️ **Groq API tidak tersedia.** Periksa konfigurasi `GROQ_API_KEY` di `.env.local` lalu restart server."
  return "⚠️ **AI Agent (Groq) tidak merespons.** Pastikan `GROQ_API_KEY` sudah benar di `.env.local`, lalu coba lagi."
}   