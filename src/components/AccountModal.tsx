import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { LogOut, UserRound, X } from "lucide-react";
import { closeAccount, logoutClient, updateMyProfile, useAuth, useAuthUi } from "../lib/auth";
import { PAYMENT_LABEL, PROPOSAL_STATUS, fetchMyProposals, type Proposal } from "../lib/proposals";
import { brl, maskPhone } from "../lib/helpers";

const field =
  "w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-sm text-cream-100 outline-none focus:border-gold-400/60";

// "Minha conta": dados do cliente e propostas enviadas (as visitas ficam na seção "Meus agendamentos")
export function AccountModal() {
  const { accountOpen } = useAuthUi();
  const { client } = useAuth();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [proposals, setProposals] = useState<Proposal[]>([]);
  const [msg, setMsg] = useState("");
  const [saving, setSaving] = useState(false);

  // Carrega os dados ao abrir
  const [wasOpen, setWasOpen] = useState(false);
  if (accountOpen !== wasOpen) {
    setWasOpen(accountOpen);
    if (accountOpen && client) {
      setName(client.name);
      setPhone(maskPhone(client.phone));
      setMsg("");
    }
  }

  useEffect(() => {
    if (!accountOpen) return;
    let active = true;
    fetchMyProposals()
      .then((list) => active && setProposals(list))
      .catch(() => active && setProposals([]));
    const esc = (e: KeyboardEvent) => e.key === "Escape" && closeAccount();
    window.addEventListener("keydown", esc);
    return () => {
      active = false;
      window.removeEventListener("keydown", esc);
    };
  }, [accountOpen]);

  const save = async () => {
    setSaving(true);
    setMsg("");
    try {
      await updateMyProfile(name, phone);
      setMsg("Dados atualizados.");
    } catch (err) {
      setMsg(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {accountOpen && client && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAccount}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-ink-950/85 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="account-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-cream-100/10 bg-ink-900 shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-center gap-3 border-b border-cream-100/10 p-5">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-500 text-ink-950">
                <UserRound className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 id="account-title" className="font-display text-xl text-cream-50">
                  Minha conta
                </h3>
                <p className="truncate text-xs text-cream-400">{client.email}</p>
              </div>
              <button
                onClick={closeAccount}
                className="grid h-10 w-10 place-items-center rounded-full border border-cream-100/15 text-cream-100 hover:border-gold-400/60"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto p-5 sm:p-6">
              <section className="space-y-3">
                <h4 className="font-display text-lg text-cream-50">Meus dados</h4>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 120))}
                    aria-label="Nome"
                    className={field}
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    inputMode="tel"
                    aria-label="WhatsApp"
                    className={field}
                  />
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => void save()}
                    disabled={saving}
                    className="rounded-full bg-gold-500 px-5 py-2.5 text-sm font-bold text-ink-950 hover:bg-gold-400 disabled:opacity-60"
                  >
                    {saving ? "Salvando..." : "Salvar dados"}
                  </button>
                  {msg && <p className="text-sm text-cream-300">{msg}</p>}
                </div>
              </section>

              <section className="space-y-3">
                <h4 className="font-display text-lg text-cream-50">Minhas propostas</h4>
                {proposals.length === 0 ? (
                  <p className="rounded-2xl border border-cream-100/10 bg-ink-950/40 p-4 text-sm text-cream-300">
                    Você ainda não enviou propostas. Abra os detalhes de um imóvel e clique em “Fazer proposta”.
                  </p>
                ) : (
                  <ul className="space-y-3">
                    {proposals.map((p) => (
                      <li key={p.id} className="rounded-2xl border border-cream-100/10 bg-ink-950/40 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <p className="font-display text-base text-cream-50">{p.property_title}</p>
                          <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${PROPOSAL_STATUS[p.status].tone}`}>
                            {PROPOSAL_STATUS[p.status].label}
                          </span>
                        </div>
                        <p className="mt-1 text-sm text-gold-300">
                          {brl(p.amount)} · {PAYMENT_LABEL[p.payment]}
                        </p>
                        {p.message && <p className="mt-1 text-xs text-cream-400">“{p.message}”</p>}
                        {p.agent_note && (
                          <p className="mt-2 rounded-xl border border-gold-500/30 bg-gold-500/10 p-3 text-sm text-cream-100">
                            <span className="block text-[10px] font-bold uppercase tracking-widest text-gold-300">
                              Resposta do corretor
                            </span>
                            {p.agent_note}
                          </p>
                        )}
                        <p className="mt-2 text-[11px] text-cream-500">
                          Enviada em {new Date(p.created_at).toLocaleDateString("pt-BR")}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </section>

              <button
                onClick={() => {
                  void logoutClient();
                  closeAccount();
                }}
                className="inline-flex items-center gap-2 rounded-full border border-cream-100/15 px-4 py-2.5 text-sm font-semibold text-cream-100 hover:border-gold-400/60 hover:text-gold-300"
              >
                <LogOut className="h-4 w-4" /> Sair da conta
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
