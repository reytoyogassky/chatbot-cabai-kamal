// ============================================================
// API ROUTE: GET /api/sessions/messages?session_id=xxx
// Ambil semua pesan dari satu sesi
// ============================================================

import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib"

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get("session_id")

    if (!sessionId) {
      return NextResponse.json({ error: "session_id diperlukan" }, { status: 400 })
    }

    const { data: messages, error } = await supabase
      .from("messages")
      .select("*")
      .eq("session_id", sessionId)
      .order("created_at", { ascending: true })

    if (error) throw error

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Messages GET error:", error)
    return NextResponse.json({ error: "Gagal mengambil pesan" }, { status: 500 })
  }
}
