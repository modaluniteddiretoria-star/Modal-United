import { useCallback, useEffect, useState } from "react";
import { MessageCircle, RefreshCw } from "lucide-react";
import { supabase } from "../lib/supabase";
import { brl, maskPhone } from "../lib/helpers";
import { PAYMENT_LABEL, PROPOSAL_STATUS, type Proposal, type ProposalStatus } from "../lib/proposals";

type Row = Proposal & { client: { name: string; phone: string; email: string } | null };

// Aba "Propostas" do painel: em tempo real, com status e resposta (contraproposta) ao cliente
export function AdminProposals({ onPendingChange }: { onPendingChange?: (n: number) => void }) {
  const [rows, setRows] = useState<Row[]>([]);
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from("proposals")
      .select("*, client:clients(name, phone, email)")
      .order("created_at", { ascending: false })
      .limit(300);
    if (err) setError("Não foi possível carregar as propostas.");
    else {
      const list = (data ?? []).map((p) => ({ ...p, amount: Number(p.amount) })) as Row[];
      setRows(list);
      setNotes(Object.fromEntries(list.map((p) => [p.id, p.agent_note ?? ""])));
      onPendingChange?.(list.filter((p) => p.status === "enviada").length);
    }
    setLoading(false);
  }, [onPendingChange]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    const channel = supabase
      .channel("admin-proposals")
      .on("postgres_changes", { event: "*", schema: "public", table: "proposals" }, () => void load())
      .subscribe();
    return () => {
      window.clearTimeout(t);
      void supabase.removeChannel(channel);
    };
  }, [load]);

  const update = async (id: string, patch: Partial<Pick<Proposal, "status" | "agent_note">>) => {
    setError("");
    const { error: err } = await supabase.from("proposals").update(patch).eq("id", id);
    if (err) setError("Não foi possível salvar a alteração.");
    else void load();
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h4 className="font-display text-2xl text-cream-50">Propostas</h4>
        <button
          onClick={() => void load()}
          className="grid h-9 w-9 place-items-center rounded-full border border-cream-100/15 text-cream-200 hover:border-gold-400/60"
          aria-label="Atualizar"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}
      {!loading && rows.length === 0 && (
        <p className="rounded-3xl border border-cream-100/10 bg-ink-950/40 p-6 text-sm text-cream-300">
          Nenhuma proposta ainda. Elas chegam aqui na hora em que o cliente envia.
        </p>
      )}

      <ul className="space-y-3">
        {rows.map((p) => (
          <li key={p.id} className="rounded-3xl border border-cream-100/10 bg-ink-950/40 p-4">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-lg text-cream-50">{p.property_title}</p>
                <p className="text-sm text-gold-300">
                  {brl(p.amount)} · {PAYMENT_LABEL[p.payment]}
                </p>
                <p className="mt-1 text-sm text-cream-200">
                  {p.client?.name ?? "Cliente removido"}
                  {p.client && ` · ${maskPhone(p.client.phone)} · ${p.client.email}`}
                </p>
                {p.message && <p className="mt-1 text-sm text-cream-400">“{p.message}”</p>}
                <p className="mt-1 text-xs text-cream-500">{new Date(p.created_at).toLocaleString("pt-BR")}</p>
              </div>
              <div className="flex items-center gap-2">
                {p.client && (
                  <a
                    href={`https://wa.me/55${p.client.phone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500 px-3 py-1.5 text-xs font-bold text-ink-950 hover:bg-emerald-400"
                  >
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp
                  </a>
                )}
                <select
                  value={p.status}
                  onChange={(e) => void update(p.id, { status: e.target.value as ProposalStatus })}
                  aria-label="Status da proposta"
                  className={`rounded-full border-0 px-3 py-1.5 text-xs font-bold outline-none ${PROPOSAL_STATUS[p.status].tone}`}
                >
                  {(Object.keys(PROPOSAL_STATUS) as ProposalStatus[]).map((s) => (
                    <option key={s} value={s} className="bg-ink-900 text-cream-100">
                      {PROPOSAL_STATUS[s].label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap items-end gap-2">
              <textarea
                value={notes[p.id] ?? ""}
                onChange={(e) => setNotes((n) => ({ ...n, [p.id]: e.target.value.slice(0, 1500) }))}
                rows={2}
                placeholder="Resposta ao cliente (aparece em “Minha conta”). Ex.: contraproposta de R$ ..."
                aria-label="Resposta ao cliente"
                className="min-w-0 flex-1 rounded-2xl border border-cream-100/12 bg-ink-800 px-3 py-2 text-sm text-cream-100 outline-none focus:border-gold-400/60"
              />
              <button
                onClick={() => void update(p.id, { agent_note: (notes[p.id] ?? "").trim() || null })}
                disabled={(notes[p.id] ?? "") === (p.agent_note ?? "")}
                className="rounded-full bg-gold-500 px-4 py-2 text-xs font-bold text-ink-950 hover:bg-gold-400 disabled:opacity-40"
              >
                Salvar resposta
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
