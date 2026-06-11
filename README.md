# 🌶️ Chatbot Konsultan Cabai Rawit Merah
## Next.js 14 + Ollama (Gratis) + Supabase

> Berbasis penelitian: *"Prediksi Risiko Gagal Panen Cabai Rawit Merah Menggunakan Algoritma Decision Tree"*  
> — Kamal Nurfalah, UNSAP 2025

---

## 📋 Prasyarat

Pastikan sudah terinstall:
- [Node.js](https://nodejs.org) versi 18 atau lebih baru
- [Git](https://git-scm.com)
- PC/Laptop minimal RAM 8GB (untuk Ollama)

---

## 🚀 Tahap 1 — Setup Ollama (AI Agent Gratis)

### Install Ollama
```bash
# Windows: download installer dari
https://ollama.com/download

# Mac:
brew install ollama

# Linux:
curl -fsSL https://ollama.com/install.sh | sh
```

### Download & jalankan model AI
```bash
# Pilih salah satu (rekomendasi: llama3 untuk laptop dengan RAM 8GB)
ollama pull llama3

# Atau yang lebih ringan (RAM 4GB cukup):
ollama pull mistral:7b

# Jalankan Ollama server (jalankan ini setiap kali mau pakai chatbot)
ollama serve
```

> ✅ Ollama berjalan di `http://localhost:11434` — tidak butuh internet setelah download model

---

## 🗄️ Tahap 2 — Setup Supabase (Database Gratis)

1. Buka [https://supabase.com](https://supabase.com) → **Start your project** (gratis)
2. Buat project baru, pilih region **Singapore** (terdekat dari Indonesia)
3. Tunggu project siap (~2 menit)
4. Buka **SQL Editor** → **New Query**
5. Copy-paste isi file `supabase-schema.sql` → klik **Run**
6. Buka **Project Settings → API**, salin:
   - `Project URL` → untuk `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public key` → untuk `NEXT_PUBLIC_SUPABASE_ANON_KEY`

---

## ⚙️ Tahap 3 — Setup Project Next.js

### Buka project di VS Code
```bash
# Buka folder project di VS Code
code chatbot-cabai-next

# Atau buka VS Code dulu, lalu File → Open Folder
```

### Buat file konfigurasi
Di VS Code, buat file baru bernama `.env.local` (di folder root project):
```bash
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciO...

OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3
```

### Install dependencies
Buka Terminal di VS Code (`Ctrl + backtick`):
```bash
npm install
```

### Jalankan development server
```bash
npm run dev
```

Buka browser → [http://localhost:3000](http://localhost:3000) 🎉

---

## 📁 Struktur Project

```
chatbot-cabai-next/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── chat/route.ts          ← Endpoint kirim pesan ke Ollama
│   │   │   └── sessions/
│   │   │       ├── route.ts           ← CRUD sesi percakapan
│   │   │       └── messages/route.ts  ← Ambil pesan per sesi
│   │   ├── globals.css                ← Styling global
│   │   ├── layout.tsx                 ← Layout root
│   │   └── page.tsx                   ← Halaman utama (logika chatbot)
│   ├── components/
│   │   ├── Sidebar.tsx                ← Sidebar riwayat & topik cepat
│   │   ├── ChatMessage.tsx            ← Komponen satu pesan
│   │   └── InputBar.tsx               ← Input & sugesti pertanyaan
│   ├── lib/
│   │   └── index.ts                   ← Supabase client + system prompt AI
│   └── types/
│       └── index.ts                   ← TypeScript interfaces
├── supabase-schema.sql                ← Schema database (jalankan di Supabase)
├── .env.example                       ← Template environment variables
├── package.json
├── tailwind.config.ts
└── tsconfig.json
```

---

## 🔧 Cara Mengubah Model AI

Edit file `.env.local`:
```bash
# Model tersedia:
OLLAMA_MODEL=llama3          # Paling cerdas, butuh ~5GB RAM
OLLAMA_MODEL=mistral:7b      # Seimbang, butuh ~4GB RAM
OLLAMA_MODEL=phi3:mini       # Paling ringan, butuh ~2GB RAM
```

Lalu jalankan ulang: `npm run dev`

---

## 🌿 Cara Menambah Pengetahuan AI

Buka file `src/lib/index.ts` → cari `SYSTEM_PROMPT` → tambahkan pengetahuan baru di bagian bawah string.

Contoh menambahkan topik baru:
```typescript
// Tambahkan di akhir SYSTEM_PROMPT:
`
INFORMASI TAMBAHAN:
- Varietas Lado F1 terbukti tahan antraknose berdasarkan uji coba 2024
- Dosis NPK optimal di Sumedang: 250 kg/ha saat musim hujan
`
```

---

## 🚀 Deploy ke Vercel (Opsional)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Tambahkan environment variables di Vercel Dashboard:
# Settings → Environment Variables → tambahkan semua dari .env.local
# Catatan: OLLAMA_BASE_URL harus diganti dengan URL server Ollama publik
```

---

## ❓ Troubleshooting

| Masalah | Solusi |
|---|---|
| "Ollama Offline" | Jalankan `ollama serve` di terminal terpisah |
| Model tidak ada | Jalankan `ollama pull llama3` |
| Supabase error | Periksa SUPABASE_URL dan ANON_KEY di .env.local |
| Port sudah dipakai | Ganti port: `npm run dev -- -p 3001` |
| Jawaban sangat lambat | Ganti ke model yang lebih ringan: `phi3:mini` |

---

*Dibuat berdasarkan Skripsi Kamal Nurfalah, Universitas Sebelas April (UNSAP) Sumedang, 2025*
