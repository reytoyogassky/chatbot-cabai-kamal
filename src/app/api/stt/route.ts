import { NextRequest, NextResponse } from "next/server"
import { GROQ_API_KEY } from "@/lib"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

export async function POST(req: NextRequest) {
  try {
    if (!GROQ_API_KEY) {
      return NextResponse.json({ error: "GROQ_API_KEY belum dikonfigurasi" }, { status: 500 })
    }

    const formData = await req.formData()
    const audioFile = formData.get("file") as File | null

    if (!audioFile) {
      return NextResponse.json({ error: "File audio tidak ditemukan" }, { status: 400 })
    }

    // Forward ke Groq Whisper
    const groqForm = new FormData()
    groqForm.append("file", audioFile)
    groqForm.append("model", "whisper-large-v3-turbo")
    groqForm.append("language", "id") // Bahasa Indonesia
    groqForm.append("response_format", "json")

    const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: groqForm,
    })

    if (!groqRes.ok) {
      const err = await groqRes.text()
      console.error("Groq STT error:", err)
      return NextResponse.json({ error: "Gagal transkripsi audio" }, { status: 500 })
    }

    const data = await groqRes.json()
    return NextResponse.json({ text: data.text || "" })
  } catch (error) {
    console.error("STT route error:", error)
    return NextResponse.json({ error: "Terjadi kesalahan server" }, { status: 500 })
  }
}
