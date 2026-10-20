import { supabase } from "./supabase";

// Conversa do visitante: id + segredo ficam no navegador para retomar o chat.
const KEY = "modal-united-chat-v1";

export interface ChatSession {
  conversationId: string;
  secret: string;
}

export interface ChatMessage {
  id: number;
  sender: "visitor" | "agent" | "bot";
  body: string;
  created_at: string;
}

export function loadChatSession(): ChatSession | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<ChatSession>;
    return parsed.conversationId && parsed.secret ? (parsed as ChatSession) : null;
  } catch {
    return null;
  }
}

function saveChatSession(s: ChatSession) {
  try {
    localStorage.setItem(KEY, JSON.stringify(s));
  } catch {
    // armazenamento indisponível: a conversa vale só nesta aba
  }
}

export function clearChatSession() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    // ignora
  }
}

async function invokeChat(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("chat", { body });
  if (error) {
    let message = "Não foi possível enviar. Tente novamente.";
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const payload = (await ctx.json()) as { error?: string };
        if (payload.error) message = payload.error;
      } catch {
        // resposta sem JSON
      }
    }
    const err = new Error(message) as Error & { status?: number };
    err.status = ctx?.status;
    throw err;
  }
  return data as Record<string, unknown>;
}

export async function startChat(message: string, name: string, captchaToken: string): Promise<ChatSession> {
  const data = await invokeChat({ action: "start", message, name, token: captchaToken });
  const session = { conversationId: String(data.conversationId), secret: String(data.secret) };
  saveChatSession(session);
  return session;
}

export async function sendChat(session: ChatSession, message: string): Promise<void> {
  await invokeChat({ action: "send", message, ...session });
}

export async function pollChat(session: ChatSession, afterId: number): Promise<ChatMessage[]> {
  const { data, error } = await supabase.rpc("chat_poll", {
    p_conversation: session.conversationId,
    p_secret: session.secret,
    p_after: afterId,
  });
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export async function isAgentOnline(): Promise<boolean> {
  const { data, error } = await supabase.rpc("agent_is_online");
  return !error && Boolean(data);
}
