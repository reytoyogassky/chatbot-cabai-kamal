// ============================================================
// TYPES — Chatbot Cabai Rawit Merah
// ============================================================

export interface Message {
  id: string
  session_id: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export interface ChatSession {
  id: string
  title: string
  created_at: string
  updated_at: string
  messages?: Message[]
}

export interface OllamaRequest {
  model: string
  messages: { role: string; content: string }[]
  stream: boolean
}

export interface OllamaStreamChunk {
  model: string
  message: {
    role: string
    content: string
  }
  done: boolean
}

export interface SendMessagePayload {
  session_id: string | null
  content: string
  history: { role: string; content: string }[]
}
