import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, HandCoins, X } from "lucide-react";
import type { Property } from "../lib/types";
import { PAYMENT_LABEL, createProposal, type ProposalPayment } from "../lib/proposals";
import { brl, priceLabel } from "../lib/helpers";
import { openAccount } from "../lib/auth";

const field =
  "w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-sm text-cream-100 placeholder:text-cream-500/70 outline-none focus:border-gold-400/60";

// Proposta do cliente logado para um imóvel: valor, forma de pagamento e mensagem
export function ProposalModal({ property, onClose }: { property: Property | null; onClose: () => void }) {
  const [digits, setDigits] = useState("");
  const [payment, setPayment] = useState<ProposalPayment>("financiamento");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  // Limpa o formulário ao abrir para outro imóvel
  const [prevId, setPrevId] = useState(property?.id);
  if (property?.id !== prevId) {
    setPrevId(property?.id);
    setDigits("");
    setMessage("");
    setError("");
    setSent(false);
    setPayment(property?.transaction === "aluguel" ? "outro" : "financiamento");
  }

  useEffect(() => {
    if (!property) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [property, onClose]);

  const amount = Number(digits || 0);

  const submit = async () => {
    if (!property || busy) return;
    if (amount <= 0) {
      setError("Informe o valor da sua proposta.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      await createProposal({ propertyId: property.id, amount, payment, message: message.trim() });
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a proposta.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {property && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink-950/85 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="proposal-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[94vh] w-full max-w-lg overflow-y-auto rounded-t-3xl border border-cream-100/10 bg-ink-900 p-6 shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-500 text-ink-950">
                  <HandCoins className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 id="proposal-title" className="font-display text-xl text-cream-50">
                    Fazer proposta
                  </h3>
                  <p className="truncate text-xs text-cream-400">
                    {property.title} · anunciado por {priceLabel(property)}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cream-100/15 text-cream-100 hover:border-gold-400/60"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {sent ? (
              <div className="mt-6 text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-400/15 text-emerald-300">
                  <Check className="h-7 w-7" />
                </span>
                <p className="mt-4 font-display text-xl text-cream-50">Proposta enviada!</p>
                <p className="mt-2 text-sm text-cream-300">
                  O corretor vai analisar e responder. Você acompanha o status em “Minha conta”.
                </p>
                <div className="mt-5 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      onClose();
                      openAccount();
                    }}
                    className="rounded-full bg-gold-500 px-5 py-2.5 text-sm font-bold text-ink-950 hover:bg-gold-400"
                  >
                    Ver minhas propostas
                  </button>
                  <button
                    onClick={onClose}
                    className="rounded-full border border-cream-100/15 px-5 py-2.5 text-sm font-semibold text-cream-100"
                  >
                    Fechar
                  </button>
                </div>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  void submit();
                }}
                className="mt-5 space-y-4"
              >
                <label className="block space-y-2 text-sm text-cream-300">
                  <span>{property.transaction === "aluguel" ? "Valor mensal oferecido" : "Valor oferecido"}</span>
                  <input
                    value={digits ? brl(amount) : ""}
                    onChange={(e) => setDigits(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    inputMode="numeric"
                    placeholder={brl(property.price)}
                    className={`${field} font-display text-lg`}
                  />
                </label>

                <fieldset className="space-y-2">
                  <legend className="text-sm text-cream-300">Forma de pagamento</legend>
                  <div className="grid grid-cols-2 gap-2">
                    {(Object.keys(PAYMENT_LABEL) as ProposalPayment[]).map((p) => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPayment(p)}
                        aria-pressed={payment === p}
                        className={`rounded-2xl border px-4 py-2.5 text-sm font-semibold transition ${
                          payment === p
                            ? "border-gold-400 bg-gold-500/15 text-gold-200"
                            : "border-cream-100/12 text-cream-300 hover:border-gold-400/50"
                        }`}
                      >
                        {PAYMENT_LABEL[p]}
                      </button>
                    ))}
                  </div>
                </fieldset>

                <label className="block space-y-2 text-sm text-cream-300">
                  <span>Mensagem (opcional)</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 1500))}
                    rows={3}
                    placeholder="Ex.: Tenho 30% de entrada e carta de crédito aprovada."
                    className={field}
                  />
                </label>

                {error && (
                  <p role="alert" className="text-sm text-red-300">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={busy}
                  className="w-full rounded-full bg-gold-500 px-5 py-3 text-sm font-bold text-ink-950 hover:bg-gold-400 disabled:opacity-60"
                >
                  {busy ? "Enviando..." : "Enviar proposta"}
                </button>
                <p className="text-center text-[11px] text-cream-500">
                  A proposta não tem valor de contrato; o corretor entra em contato para negociar.
                </p>
              </form>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
