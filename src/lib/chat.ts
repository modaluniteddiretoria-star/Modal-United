import { supabase } from "./supabase";

// Chat do cliente logado: lê as mensagens direto do banco (o RLS devolve só as dele)
// e recebe novas em tempo real; o envio passa pela Edge Function "chat" (que aciona o bot offline).

export interface ChatMessage {
  id: number;
  sender: "visitor" | "agent" | "bot";
  body: string;
  created_at: string;
}

export async function fetchMyMessages(): Promise<ChatMessage[]> {
  const { data, error } = await supabase
    .from("chat_messages")
    .select("id, sender, body, created_at")
    .order("id")
    .limit(300);
  if (error) throw error;
  return (data ?? []) as ChatMessage[];
}

export function subscribeMyMessages(onMessage: (m: ChatMessage) => void): () => void {
  const channel = supabase
    .channel(`client-chat-${crypto.randomUUID()}`)
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) =>
      onMessage(payload.new as ChatMessage)
    )
    .subscribe();
  return () => {
    void supabase.removeChannel(channel);
  };
}

export async function sendChat(message: string): Promise<void> {
  const { error } = await supabase.functions.invoke("chat", { body: { message } });
  if (error) {
    let text = "Não foi possível enviar. Tente novamente.";
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const payload = (await ctx.json()) as { error?: string };
        if (payload.error) text = payload.error;
      } catch {
        // resposta sem JSON
      }
    }
    throw new Error(text);
  }
}

export async function isAgentOnline(): Promise<boolean> {
  const { data, error } = await supabase.rpc("agent_is_online");
  return !error && Boolean(data);
}
