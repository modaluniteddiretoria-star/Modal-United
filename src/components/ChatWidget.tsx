import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogIn, MessageCircle, Send, X } from "lucide-react";
import { useSiteData } from "../lib/data";
import { openAuth, useAuth } from "../lib/auth";
import { type ChatMessage, fetchMyMessages, isAgentOnline, sendChat, subscribeMyMessages } from "../lib/chat";

const PRESENCE_MS = 30000;

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.47-1.75-1.64-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.03-.52-.07-.15-.67-1.6-.92-2.2-.24-.58-.49-.5-.67-.5h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48s1.07 2.88 1.21 3.08c.15.2 2.1 3.2 5.08 4.48.71.31 1.26.49 1.7.63.71.22 1.36.19 1.87.12.57-.09 1.75-.72 2-1.41.25-.69.25-1.29.17-1.41-.07-.12-.27-.2-.57-.35M12.05 21.5h-.01a9.4 9.4 0 0 1-4.8-1.32l-.34-.2-3.57.94.95-3.48-.22-.36a9.4 9.4 0 0 1-1.44-5.02c0-5.2 4.24-9.43 9.44-9.43 2.52 0 4.89.98 6.67 2.77a9.37 9.37 0 0 1 2.76 6.67c0 5.2-4.23 9.43-9.44 9.43m8.03-17.46A11.27 11.27 0 0 0 12.05.72C5.8.72.7 5.8.7 12.05c0 2 .52 3.95 1.52 5.67L.6 23.28l5.7-1.5a11.3 11.3 0 0 0 5.74 1.47h.01c6.25 0 11.34-5.09 11.34-11.34 0-3.03-1.18-5.88-3.31-8.02" />
    </svg>
  );
}

export function ChatWidget() {
  const { agent } = useSiteData();
  const firstName = agent.name.split(" ")[0];
  const [open, setOpen] = useState(false);
  const { status, client } = useAuth();
  const isClient = status === "client";
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [seenId, setSeenId] = useState(0);
  const [online, setOnline] = useState(false);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const whatsappUrl = `https://wa.me/${agent.whatsapp}?text=${encodeURIComponent(
    `Olá ${firstName}! Vim pelo seu site e quero conversar sobre um imóvel.`
  )}`;

  // Mensagens do cliente logado: carga inicial + tempo real
  const clientId = client?.id;
  useEffect(() => {
    if (!isClient || !clientId) return;
    let active = true;
    const merge = (incoming: ChatMessage[]) =>
      setMessages((prev) => {
        const ids = new Set(prev.map((m) => m.id));
        return [...prev, ...incoming.filter((m) => !ids.has(m.id))].sort((a, b) => a.id - b.id);
      });
    fetchMyMessages()
      .then((list) => {
        if (!active) return;
        merge(list);
        // Ao entrar, o histórico já conta como lido
        if (list.length > 0) setSeenId((s) => Math.max(s, list[list.length - 1].id));
      })
      .catch(() => {});
    const unsubscribe = subscribeMyMessages((m) => active && merge([m]));
    return () => {
      active = false;
      unsubscribe();
      setMessages([]);
    };
  }, [isClient, clientId]);

  // Status online do corretor
  useEffect(() => {
    if (!open) return;
    const check = () => void isAgentOnline().then(setOnline);
    const first = window.setTimeout(check, 0);
    const timer = window.setInterval(check, PRESENCE_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [open]);

  // Rola para a última mensagem e marca como lida
  useEffect(() => {
    if (!open) return;
    listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: "smooth" });
    const last = messages[messages.length - 1];
    if (last && last.id !== seenId) {
      const t = window.setTimeout(() => setSeenId(last.id), 0);
      return () => window.clearTimeout(t);
    }
  }, [open, messages, seenId]);

  const unread = open ? 0 : messages.filter((m) => m.sender !== "visitor" && m.id > seenId).length;

  const submit = async () => {
    const body = text.trim();
    if (!body || sending) return;
    setError("");
    setSending(true);
    try {
      await sendChat(body);
      setText("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar.");
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.section
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            className="fixed inset-x-3 bottom-24 z-50 flex max-h-[min(560px,calc(100vh-8rem))] flex-col overflow-hidden rounded-3xl border border-cream-100/10 bg-ink-900 shadow-2xl sm:inset-x-auto sm:bottom-28 sm:right-8 sm:w-[380px]"
            role="dialog"
            aria-label={`Chat com ${firstName}`}
          >
            {/* Cabeçalho */}
            <div className="flex items-center gap-3 border-b border-cream-100/10 bg-ink-850 p-4">
              <div className="relative">
                <img src={agent.photo} alt="" className="h-11 w-11 rounded-full object-cover" />
                <span
                  className={`absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-ink-850 ${
                    online ? "bg-emerald-400" : "bg-cream-500"
                  }`}
                />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-base text-cream-50">{agent.name}</p>
                <p className="text-xs text-cream-300">
                  {online ? "Online agora" : "Offline · assistente virtual responde"}
                </p>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noreferrer"
                className="grid h-9 w-9 place-items-center rounded-full bg-emerald-500 text-ink-950 transition hover:bg-emerald-400"
                aria-label="Continuar no WhatsApp"
                title="Continuar no WhatsApp"
              >
                <WhatsAppIcon className="h-4 w-4" />
              </a>
              <button
                onClick={() => setOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full border border-cream-100/15 text-cream-100 transition hover:border-gold-400/60 hover:text-gold-300"
                aria-label="Fechar chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {!isClient && (
              <div className="flex-1 space-y-4 overflow-y-auto p-5 text-center">
                <p className="text-sm leading-relaxed text-cream-200">
                  Para conversar com o {firstName} por aqui, entre na sua conta ou crie uma em menos de 1 minuto.
                </p>
                <button
                  onClick={() => openAuth("Entre ou crie sua conta para conversar no chat.")}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-gold-500 px-5 py-3 text-sm font-bold text-ink-950 hover:bg-gold-400"
                >
                  <LogIn className="h-4 w-4" /> Entrar ou criar conta
                </button>
                <p className="text-xs text-cream-500">ou</p>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-ink-950 hover:bg-emerald-400"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Falar pelo WhatsApp
                </a>
              </div>
            )}

            {/* Mensagens */}
            {isClient && (
            <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
              <div className="max-w-[85%] rounded-2xl rounded-tl-sm bg-ink-800 px-4 py-2.5 text-sm text-cream-100">
                Olá{client ? `, ${client.name.split(" ")[0]}` : ""}! Sou {online ? `o ${firstName}` : `o assistente da ${agent.brand}`}. Como posso ajudar? Pode
                perguntar sobre imóveis, visitas, aluguel ou venda.
              </div>
              {messages.map((m) => (
                <div key={m.id} className={`flex ${m.sender === "visitor" ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[85%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2.5 text-sm ${
                      m.sender === "visitor"
                        ? "rounded-tr-sm bg-gold-500 text-ink-950"
                        : "rounded-tl-sm bg-ink-800 text-cream-100"
                    }`}
                  >
                    {m.sender === "bot" && (
                      <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-gold-400">
                        Assistente virtual
                      </span>
                    )}
                    {m.sender === "agent" && (
                      <span className="mb-0.5 block text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                        {firstName}
                      </span>
                    )}
                    {m.body}
                  </div>
                </div>
              ))}
            </div>
            )}

            {/* Envio */}
            {isClient && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
              className="space-y-2 border-t border-cream-100/10 p-3"
            >
              <div className="flex items-end gap-2">
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value.slice(0, 1000))}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      void submit();
                    }
                  }}
                  rows={1}
                  placeholder="Escreva sua mensagem…"
                  aria-label="Mensagem"
                  className="max-h-28 min-h-[42px] flex-1 resize-none rounded-xl border border-cream-100/12 bg-ink-800 px-3 py-2.5 text-sm text-cream-100 placeholder:text-cream-500/70 focus:border-gold-400/60 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="grid h-[42px] w-[42px] shrink-0 place-items-center rounded-xl bg-gold-500 text-ink-950 transition hover:bg-gold-400 disabled:opacity-50"
                  aria-label="Enviar"
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>
              {error && <p role="alert" className="text-xs text-red-300">{error}</p>}
              <p className="text-[10px] leading-snug text-cream-500">
                Conversando como {client?.name}.{" "}
                <a href="#privacidade" className="underline hover:text-gold-300">
                  Privacidade
                </a>
              </p>
            </form>
            )}
          </motion.section>
        )}
      </AnimatePresence>

      {/* Botão flutuante */}
      <motion.button
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.2, type: "spring", damping: 14 }}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "Fechar chat" : `Conversar com ${firstName}`}
        aria-expanded={open}
        className="group fixed bottom-5 right-5 z-50 flex items-center gap-3 rounded-full bg-emerald-500 p-4 text-ink-950 shadow-[0_16px_40px_-10px_rgba(16,185,129,0.55)] transition-all hover:scale-105 hover:bg-emerald-400 sm:bottom-8 sm:right-8"
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
        {!open && (
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-bold transition-all duration-300 group-hover:max-w-[180px] group-hover:pr-1">
            Falar com o {firstName}
          </span>
        )}
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full border-2 border-ink-950 bg-gold-400 px-1 text-[10px] font-bold">
            {unread}
          </span>
        )}
      </motion.button>
    </>
  );
}
