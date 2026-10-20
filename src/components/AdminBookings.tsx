import { useCallback, useEffect, useState } from "react";
import { MessageCircle, RefreshCw, XCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import { formatDisplayDate, maskPhone } from "../lib/helpers";

interface BookingRow {
  id: string;
  code: string;
  property_title: string;
  visit_date: string;
  visit_time: string;
  name: string;
  phone: string;
  email: string | null;
  note: string | null;
  status: "confirmed" | "cancelled";
  created_at: string;
}

// Lista de agendamentos para o admin (o RLS só libera para quem está em public.admins)
export function AdminBookings() {
  const [rows, setRows] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showPast, setShowPast] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    const today = new Date().toLocaleDateString("sv-SE", { timeZone: "America/Sao_Paulo" });
    let query = supabase
      .from("bookings")
      .select("*")
      .order("visit_date", { ascending: !showPast })
      .order("visit_time", { ascending: true })
      .limit(200);
    query = showPast ? query.lt("visit_date", today) : query.gte("visit_date", today);
    const { data, error: err } = await query;
    if (err) setError("Não foi possível carregar os agendamentos.");
    else setRows(data as BookingRow[]);
    setLoading(false);
  }, [showPast]);

  useEffect(() => {
    const t = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(t);
  }, [load]);

  const cancel = async (id: string) => {
    if (!window.confirm("Cancelar esta visita? O horário será liberado.")) return;
    const { error: err } = await supabase.from("bookings").update({ status: "cancelled" }).eq("id", id);
    if (err) setError("Não foi possível cancelar a visita.");
    else void load();
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-display text-2xl text-cream-50">Agendamentos</h4>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPast((v) => !v)}
            className="rounded-full border border-cream-100/15 px-4 py-2 text-sm font-semibold text-cream-200 transition hover:border-gold-400/60 hover:text-gold-300"
          >
            {showPast ? "Ver próximas" : "Ver anteriores"}
          </button>
          <button
            onClick={() => void load()}
            className="grid h-9 w-9 place-items-center rounded-full border border-cream-100/15 text-cream-200 transition hover:border-gold-400/60 hover:text-gold-300"
            aria-label="Atualizar"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}

      {!loading && rows.length === 0 && !error && (
        <p className="rounded-3xl border border-cream-100/10 bg-ink-950/40 p-6 text-sm text-cream-300">
          {showPast ? "Nenhuma visita anterior." : "Nenhuma visita agendada."}
        </p>
      )}

      <div className="space-y-3">
        {rows.map((b) => (
          <article
            key={b.id}
            className={`rounded-3xl border p-4 ${
              b.status === "cancelled"
                ? "border-cream-100/5 bg-ink-950/20 opacity-60"
                : "border-cream-100/10 bg-ink-950/40"
            }`}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold-400">
                  {formatDisplayDate(b.visit_date)} · {b.visit_time}
                  {b.status === "cancelled" && " · cancelada"}
                </p>
                <h5 className="mt-1 font-display text-lg text-cream-50">{b.property_title}</h5>
                <p className="text-sm text-cream-200">
                  {b.name} · {maskPhone(b.phone)}
                  {b.email && ` · ${b.email}`}
                </p>
                {b.note && <p className="mt-1 text-sm text-cream-400">“{b.note}”</p>}
                <p className="mt-1 text-xs text-cream-500">Código {b.code}</p>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={`https://wa.me/55${b.phone}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-emerald-500 px-4 py-2 text-sm font-bold text-ink-950 transition hover:bg-emerald-400"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                {b.status === "confirmed" && (
                  <button
                    onClick={() => void cancel(b.id)}
                    className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:border-red-400"
                  >
                    <XCircle className="h-4 w-4" /> Cancelar
                  </button>
                )}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
