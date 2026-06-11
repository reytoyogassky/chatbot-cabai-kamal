import { NextRequest, NextResponse } from "next/server"
import { supabase } from "@/lib"

// GET — ambil semua sesi
export async function GET() {
  try {
    const { data: sessions, error } = await supabase
      .from("chat_sessions")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(20)

    if (error) throw error
    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Sessions GET error:", error)
    return NextResponse.json({ error: "Gagal mengambil sesi" }, { status: 500 })
  }
}

// POST — buat sesi baru secara eksplisit
export async function POST(req: NextRequest) {
  try {
    const { title } = await req.json()
    const { data: session, error } = await supabase
      .from("chat_sessions")
      .insert({ title: title || "Sesi Baru" })
      .select()
      .single()

    if (error) throw error
    return NextResponse.json({ session })
  } catch (error) {
    console.error("Sessions POST error:", error)
    return NextResponse.json({ error: "Gagal membuat sesi" }, { status: 500 })
  }
}

// DELETE — hapus sesi
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "ID tidak ditemukan" }, { status: 400 })

    const { error } = await supabase
      .from("chat_sessions")
      .delete()
      .eq("id", id)

    if (error) throw error
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Sessions DELETE error:", error)
    return NextResponse.json({ error: "Gagal menghapus sesi" }, { status: 500 })
  }
}