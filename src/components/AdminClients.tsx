import { useCallback, useEffect, useMemo, useState } from "react";
import { KeyRound, MessageCircle, RefreshCw, Search, ShieldBan, ShieldCheck, Trash2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { maskPhone } from "../lib/helpers";

interface ClientRow {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "active" | "blocked";
  created_at: string;
}

async function adminAction(body: Record<string, unknown>) {
  const { data, error } = await supabase.functions.invoke("admin-clients", { body });
  if (error) {
    let msg = "Não foi possível concluir a ação.";
    const ctx = (error as { context?: Response }).context;
    try {
      const payload = ctx ? ((await ctx.json()) as { error?: string }) : null;
      if (payload?.error) msg = payload.error;
    } catch {
      // resposta sem JSON
    }
    throw new Error(msg);
  }
  return data as { password?: string };
}

// Aba "Clientes" do painel: lista, busca, bloquear, senha temporária e exclusão (LGPD)
export function AdminClients() {
  const [rows, setRows] = useState<ClientRow[]>([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from("clients").select("*").order("created_at", { ascending: false }).limit(500);
    setRows((data ?? []) as ClientRow[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => [r.name, r.email, r.phone].some((v) => v.toLowerCase().includes(q)));
  }, [rows, query]);

  const run = async (label: string, body: Record<string, unknown>, confirmText?: string) => {
    if (confirmText && !window.confirm(confirmText)) return;
    setNotice("");
    try {
      const result = await adminAction(body);
      if (result.password) {
        setNotice(`Senha temporária: ${result.password} — envie ao cliente pelo WhatsApp e peça para trocar depois.`);
      } else {
        setNotice(label);
      }
      void load();
    } catch (err) {
      setNotice(err instanceof Error ? err.message : "Erro.");
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-display text-2xl text-cream-50">
          Clientes <span className="text-base text-cream-500">({rows.length})</span>
        </h4>
        <div className="flex items-center gap-2">
          <label className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar nome, e-mail ou telefone"
              aria-label="Buscar clientes"
              className="w-64 rounded-full border border-cream-100/12 bg-ink-800 py-2 pl-9 pr-3 text-sm text-cream-100 outline-none focus:border-gold-400/60"
            />
          </label>
          <button
            onClick={() => void load()}
            className="grid h-9 w-9 place-items-center rounded-full border border-cream-100/15 text-cream-200 hover:border-gold-400/60"
            aria-label="Atualizar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {notice && (
        <p role="status" className="rounded-2xl border border-gold-500/30 bg-gold-500/10 p-3 text-sm text-cream-100">
          {notice}
        </p>
      )}

      {!loading && filtered.length === 0 && (
        <p className="rounded-3xl border border-cream-100/10 bg-ink-950/40 p-6 text-sm text-cream-300">
          {rows.length === 0 ? "Nenhum cliente cadastrado ainda." : "Nenhum cliente encontrado."}
        </p>
      )}

      <ul className="space-y-3">
        {filtered.map((c) => (
          <li
            key={c.id}
            className={`rounded-3xl border p-4 ${c.status === "blocked" ? "border-red-500/30 bg-red-500/5" : "border-cream-100/10 bg-ink-950/40"}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-bold text-cream-50">
                  {c.name}
                  {c.status === "blocked" && (
                    <span className="ml-2 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold uppercase text-red-200">
                      Bloqueado
                    </span>
                  )}
                </p>
                <p className="text-sm text-cream-300">
                  {c.email} · {maskPhone(c.phone)}
                </p>
                <p className="text-xs text-cream-500">Cliente desde {new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <a
                  href={`https://wa.me/55${c.phone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-ink-950 hover:bg-emerald-400"
                >
                  <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                </a>
                <button
                  onClick={() =>
                    void run("", { action: "reset_password", clientId: c.id }, `Gerar uma senha temporária para ${c.name}?`)
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-cream-100/15 px-3 py-1.5 text-xs font-semibold text-cream-200 hover:border-gold-400/60"
                >
                  <KeyRound className="h-3.5 w-3.5" /> Senha temporária
                </button>
                <button
                  onClick={() =>
                    void run(
                      c.status === "blocked" ? "Cliente desbloqueado." : "Cliente bloqueado.",
                      { action: "set_status", clientId: c.id, status: c.status === "blocked" ? "active" : "blocked" },
                      c.status === "blocked" ? undefined : `Bloquear ${c.name}? Ele não conseguirá entrar nem usar o chat.`
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-cream-100/15 px-3 py-1.5 text-xs font-semibold text-cream-200 hover:border-gold-400/60"
                >
                  {c.status === "blocked" ? <ShieldCheck className="h-3.5 w-3.5" /> : <ShieldBan className="h-3.5 w-3.5" />}
                  {c.status === "blocked" ? "Desbloquear" : "Bloquear"}
                </button>
                <button
                  onClick={() =>
                    void run(
                      "Conta excluída.",
                      { action: "delete", clientId: c.id },
                      `Excluir definitivamente a conta de ${c.name}? Propostas e conversas dele também serão apagadas.`
                    )
                  }
                  className="inline-flex items-center gap-1.5 rounded-full border border-red-500/40 px-3 py-1.5 text-xs font-semibold text-red-200 hover:border-red-400"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Excluir
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
