import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, MessageSquare, Send } from "lucide-react";
import { supabase } from "../lib/supabase";
import type { ChatMessage } from "../lib/chat";

interface Conversation {
  id: string;
  visitor_name: string | null;
  status: "open" | "closed";
  created_at: string;
  last_message_at: string;
  agent_read_at: string | null;
}

const isUnread = (c: Conversation) => !c.agent_read_at || c.last_message_at > c.agent_read_at;

function timeLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date().toDateString() === d.toDateString();
  return today
    ? d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

// Conversas do chat do site em tempo real (Supabase Realtime + RLS de admin)
export function AdminChat({ onUnreadChange }: { onUnreadChange?: (n: number) => void }) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [previews, setPreviews] = useState<Record<string, string>>({});
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef<string | null>(null);

  const loadConversations = useCallback(async () => {
    const { data } = await supabase
      .from("chat_conversations")
      .select("*")
      .order("last_message_at", { ascending: false })
      .limit(100);
    setConversations((data ?? []) as Conversation[]);
    // Prévia: última mensagem de cada conversa
    const { data: recent } = await supabase
      .from("chat_messages")
      .select("conversation_id, body")
      .order("id", { ascending: false })
      .limit(300);
    const map: Record<string, string> = {};
    for (const m of (recent ?? []) as { conversation_id: string; body: string }[]) {
      if (!(m.conversation_id in map)) map[m.conversation_id] = m.body;
    }
    setPreviews(map);
  }, []);

  const loadMessages = useCallback(async (id: string) => {
    const { data } = await supabase
      .from("chat_messages")
      .select("*")
      .eq("conversation_id", id)
      .order("id")
      .limit(500);
    if (activeRef.current === id) setMessages((data ?? []) as ChatMessage[]);
  }, []);

  const markRead = useCallback(async (id: string) => {
    await supabase.from("chat_conversations").update({ agent_read_at: new Date().toISOString() }).eq("id", id);
  }, []);

  // Carga inicial + tempo real
  useEffect(() => {
    const first = window.setTimeout(() => void loadConversations(), 0);
    const channel = supabase
      .channel("admin-chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages" }, (payload) => {
        const m = payload.new as ChatMessage & { conversation_id: string };
        setPreviews((p) => ({ ...p, [m.conversation_id]: m.body }));
        if (m.conversation_id === activeRef.current) {
          setMessages((prev) => (prev.some((x) => x.id === m.id) ? prev : [...prev, m]));
          if (m.sender === "visitor") void markRead(m.conversation_id);
        }
        void loadConversations();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "chat_conversations" }, () => {
        void loadConversations();
      })
      .subscribe();
    return () => {
      window.clearTimeout(first);
      void supabase.removeChannel(channel);
    };
  }, [loadConversations, markRead]);

  const unread = useMemo(() => conversations.filter(isUnread).length, [conversations]);
  useEffect(() => onUnreadChange?.(unread), [unread, onUnreadChange]);

  useEffect(() => {
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight });
  }, [messages]);

  const openConversation = (id: string) => {
    activeRef.current = id;
    setActiveId(id);
    setMessages([]);
    setError("");
    void loadMessages(id);
    void markRead(id);
  };

  const send = async () => {
    const body = reply.trim();
    if (!body || !activeId) return;
    setError("");
    const { error: err } = await supabase
      .from("chat_messages")
      .insert({ conversation_id: activeId, sender: "agent", body: body.slice(0, 2000) });
    if (err) {
      setError("Não foi possível enviar. Verifique a conexão.");
      return;
    }
    setReply("");
  };

  const toggleClosed = async (c: Conversation) => {
    await supabase
      .from("chat_conversations")
      .update({ status: c.status === "open" ? "closed" : "open" })
      .eq("id", c.id);
  };

  const active = conversations.find((c) => c.id === activeId) ?? null;

  return (
    <div className="flex h-full min-h-[480px] flex-col gap-4 lg:flex-row">
      {/* Lista */}
      <div className={`${active ? "hidden lg:block" : "block"} lg:w-72 lg:shrink-0`}>
        <div className="mb-3 flex items-center justify-between">
          <h4 className="font-display text-2xl text-cream-50">Conversas</h4>
          <span className="flex items-center gap-1.5 text-xs text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400" /> Você está online
          </span>
        </div>
        {conversations.length === 0 && (
          <p className="rounded-3xl border border-cream-100/10 bg-ink-950/40 p-6 text-sm text-cream-300">
            Nenhuma conversa ainda. Quando um visitante escrever no chat do site, a conversa aparece aqui na hora.
          </p>
        )}
        <ul className="space-y-2">
          {conversations.map((c) => (
            <li key={c.id}>
              <button
                onClick={() => openConversation(c.id)}
                className={`w-full rounded-2xl border p-3 text-left transition ${
                  c.id === activeId
                    ? "border-gold-500/60 bg-gold-500/10"
                    : "border-cream-100/10 bg-ink-950/40 hover:border-gold-400/40"
                } ${c.status === "closed" ? "opacity-60" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-bold text-cream-50">
                    {c.visitor_name || "Visitante"}
                  </span>
                  <span className="shrink-0 text-[11px] text-cream-500">{timeLabel(c.last_message_at)}</span>
                </div>
                <div className="mt-1 flex items-center gap-2">
                  <span className="truncate text-xs text-cream-300">{previews[c.id] ?? "Abrir conversa"}</span>
                  {isUnread(c) && <span className="ml-auto h-2.5 w-2.5 shrink-0 rounded-full bg-gold-400" />}
                </div>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Conversa */}
      <div className={`${active ? "flex" : "hidden lg:flex"} min-h-[420px] flex-1 flex-col rounded-3xl border border-cream-100/10 bg-ink-950/40`}>
        {!active ? (
          <div className="m-auto flex flex-col items-center gap-2 p-8 text-center text-sm text-cream-300">
            <MessageSquare className="h-8 w-8 text-gold-400" />
            Selecione uma conversa para responder.
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 border-b border-cream-100/10 p-4">
              <button
                onClick={() => {
                  activeRef.current = null;
                  setActiveId(null);
                }}
                className="grid h-8 w-8 place-items-center rounded-full border border-cream-100/15 text-cream-100 lg:hidden"
                aria-label="Voltar"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-cream-50">{active.visitor_name || "Visitante"}</p>
                <p className="text-xs text-cream-500">Iniciada em {new Date(active.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <button
                onClick={() => void toggleClosed(active)}
                className="rounded-full border border-cream-100/15 px-3 py-1.5 text-xs font-semibold text-cream-200 hover:border-gold-400/60 hover:text-gold-300"
              >
                {active.status === "open" ? "Encerrar" : "Reabrir"}
              </button>
            </div>
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "visitor" ? "justify-start" : "justify-end"}`}>
                  <div
                    className={`max-w-[80%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm ${
                      m.sender === "visitor"
                        ? "rounded-tl-sm bg-ink-800 text-cream-100"
                        : m.sender === "bot"
                          ? "rounded-tr-sm border border-cream-100/10 bg-ink-900 text-cream-300"
                          : "rounded-tr-sm bg-gold-500 text-ink-950"
                    }`}
                  >
                    {m.sender === "bot" && (
                      <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-gold-400">
                        Bot (automático)
                      </span>
                    )}
                    {m.body}
                    <span className="mt-1 block text-right text-[10px] opacity-60">{timeLabel(m.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void send();
              }}
              className="flex items-end gap-2 border-t border-cream-100/10 p-3"
            >
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    void send();
                  }
                }}
                rows={2}
                placeholder="Responder…"
                aria-label="Resposta"
                className="flex-1 resize-none rounded-xl border border-cream-100/12 bg-ink-800 px-3 py-2.5 text-sm text-cream-100 focus:border-gold-400/60 focus:outline-none"
              />
              <button
                type="submit"
                disabled={!reply.trim()}
                className="grid h-11 w-11 place-items-center rounded-xl bg-gold-500 text-ink-950 hover:bg-gold-400 disabled:opacity-50"
                aria-label="Enviar resposta"
              >
                <Send className="h-4 w-4" />
              </button>
            </form>
            {error && <p className="px-4 pb-3 text-xs text-red-300">{error}</p>}
          </>
        )}
      </div>
    </div>
  );
}
