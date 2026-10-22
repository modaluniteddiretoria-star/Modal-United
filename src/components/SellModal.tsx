import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Tag, X } from "lucide-react";
import { useSiteData } from "../lib/data";
import { brl } from "../lib/helpers";

const field =
  "w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-sm text-cream-100 placeholder:text-cream-500/70 outline-none focus:border-gold-400/60";

const TYPES = ["Casa", "Apartamento", "Cobertura", "Casa em condomínio", "Terreno", "Comercial", "Rural", "Outro"];
const GOALS = ["Vender", "Alugar", "Vender ou alugar"];

const EMPTY = {
  name: "",
  type: "Casa",
  goal: "Vender",
  cep: "",
  street: "",
  number: "",
  complement: "",
  district: "",
  city: "",
  area: "",
  builtArea: "",
  beds: "",
  suites: "",
  baths: "",
  parking: "",
  price: "",
  notes: "",
};
type Form = typeof EMPTY;

const maskCep = (v: string) => v.replace(/\D/g, "").slice(0, 8).replace(/^(\d{5})(\d)/, "$1-$2");
const onlyDigits = (v: string, max = 5) => v.replace(/\D/g, "").slice(0, max);

// Monta o texto que vai pronto para o WhatsApp do corretor
function buildMessage(f: Form, agentName: string) {
  const line = (label: string, value: string) => (value.trim() ? `• ${label}: ${value.trim()}` : null);
  const address = [f.street && `${f.street}${f.number ? `, ${f.number}` : ""}`, f.complement].filter(Boolean).join(" - ");
  return [
    `Olá ${agentName}! Quero ${f.goal.toLowerCase()} meu imóvel. Seguem os dados:`,
    "",
    line("Nome", f.name),
    line("Tipo", f.type),
    line("Endereço", address),
    line("Bairro", f.district),
    line("Cidade", f.city),
    line("CEP", f.cep),
    line("Área do terreno", f.area && `${f.area} m²`),
    line("Área construída", f.builtArea && `${f.builtArea} m²`),
    line("Quartos", f.beds),
    line("Suítes", f.suites),
    line("Banheiros", f.baths),
    line("Vagas de garagem", f.parking),
    line("Valor pretendido", f.price && brl(Number(f.price))),
    line("Observações", f.notes),
  ]
    .filter((l) => l !== null)
    .join("\n");
}

// "Quero vender meu imóvel": formulário que abre o WhatsApp com os dados preenchidos
export function SellModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { agent } = useSiteData();
  const [f, setF] = useState<Form>(EMPTY);
  const [error, setError] = useState("");
  const set = (k: keyof Form) => (v: string) => setF((prev) => ({ ...prev, [k]: v }));

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);

  // CEP completo: preenche rua, bairro e cidade pelo ViaCEP (se falhar, o cliente digita)
  const cepDigits = f.cep.replace(/\D/g, "");
  useEffect(() => {
    if (cepDigits.length !== 8) return;
    const ctrl = new AbortController();
    fetch(`https://viacep.com.br/ws/${cepDigits}/json/`, { signal: ctrl.signal })
      .then((r) => r.json() as Promise<{ erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string }>)
      .then((d) => {
        if (d.erro) return;
        setF((prev) => ({
          ...prev,
          street: prev.street || d.logradouro || "",
          district: prev.district || d.bairro || "",
          city: prev.city || [d.localidade, d.uf].filter(Boolean).join(" - "),
        }));
      })
      .catch(() => {});
    return () => ctrl.abort();
  }, [cepDigits]);

  const submit = () => {
    if (!f.street.trim() || !f.district.trim() || !f.city.trim()) {
      setError("Preencha pelo menos rua, bairro e cidade.");
      return;
    }
    setError("");
    const url = `https://wa.me/${agent.whatsapp}?text=${encodeURIComponent(buildMessage(f, agent.name))}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
    setF(EMPTY);
  };

  const num = (label: string, k: keyof Form, placeholder = "0", max = 3) => (
    <label className="block space-y-1.5 text-xs text-cream-300">
      <span>{label}</span>
      <input
        value={f[k]}
        onChange={(e) => set(k)(onlyDigits(e.target.value, max))}
        inputMode="numeric"
        placeholder={placeholder}
        className={field}
      />
    </label>
  );

  // Portal no <body>: fica acima do menu e do chat, fora do contexto da seção de imóveis
  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-[60] flex items-end justify-center bg-ink-950/85 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="sell-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-t-3xl border border-cream-100/10 bg-ink-900 p-6 shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-500 text-ink-950">
                  <Tag className="h-5 w-5" />
                </span>
                <div>
                  <h3 id="sell-title" className="font-display text-xl text-cream-50">
                    Quero vender meu imóvel
                  </h3>
                  <p className="text-xs text-cream-400">
                    Preencha o que souber. Ao enviar, o WhatsApp abre com tudo pronto.
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

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submit();
              }}
              className="mt-5 space-y-5"
            >
              <label className="block space-y-1.5 text-xs text-cream-300">
                <span>Seu nome</span>
                <input
                  value={f.name}
                  onChange={(e) => set("name")(e.target.value.slice(0, 80))}
                  autoComplete="name"
                  placeholder="Como podemos te chamar?"
                  className={field}
                />
              </label>

              <fieldset className="space-y-2">
                <legend className="text-xs text-cream-300">O que você quer fazer?</legend>
                <div className="flex flex-wrap gap-2">
                  {GOALS.map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => set("goal")(g)}
                      aria-pressed={f.goal === g}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        f.goal === g
                          ? "border-gold-400 bg-gold-500/15 text-gold-200"
                          : "border-cream-100/12 text-cream-300 hover:border-gold-400/50"
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </fieldset>

              <label className="block space-y-1.5 text-xs text-cream-300">
                <span>Tipo de imóvel</span>
                <select value={f.type} onChange={(e) => set("type")(e.target.value)} className={field}>
                  {TYPES.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </select>
              </label>

              {/* Endereço */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-6">
                <label className="col-span-2 block space-y-1.5 text-xs text-cream-300">
                  <span>CEP</span>
                  <input
                    value={f.cep}
                    onChange={(e) => set("cep")(maskCep(e.target.value))}
                    inputMode="numeric"
                    autoComplete="postal-code"
                    placeholder="00000-000"
                    className={field}
                  />
                </label>
                <label className="col-span-2 block space-y-1.5 text-xs text-cream-300 sm:col-span-4">
                  <span>Rua *</span>
                  <input
                    value={f.street}
                    onChange={(e) => set("street")(e.target.value.slice(0, 120))}
                    autoComplete="address-line1"
                    placeholder="Rua, avenida..."
                    className={field}
                  />
                </label>
                <label className="block space-y-1.5 text-xs text-cream-300 sm:col-span-2">
                  <span>Número</span>
                  <input
                    value={f.number}
                    onChange={(e) => set("number")(e.target.value.slice(0, 10))}
                    placeholder="123"
                    className={field}
                  />
                </label>
                <label className="block space-y-1.5 text-xs text-cream-300 sm:col-span-4">
                  <span>Complemento</span>
                  <input
                    value={f.complement}
                    onChange={(e) => set("complement")(e.target.value.slice(0, 60))}
                    placeholder="Apto, bloco, casa..."
                    className={field}
                  />
                </label>
                <label className="col-span-2 block space-y-1.5 text-xs text-cream-300 sm:col-span-3">
                  <span>Bairro *</span>
                  <input
                    value={f.district}
                    onChange={(e) => set("district")(e.target.value.slice(0, 80))}
                    className={field}
                  />
                </label>
                <label className="col-span-2 block space-y-1.5 text-xs text-cream-300 sm:col-span-3">
                  <span>Cidade *</span>
                  <input
                    value={f.city}
                    onChange={(e) => set("city")(e.target.value.slice(0, 80))}
                    autoComplete="address-level2"
                    className={field}
                  />
                </label>
              </div>

              {/* Características */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {num("Área do terreno (m²)", "area", "0", 6)}
                {num("Área construída (m²)", "builtArea", "0", 6)}
                {num("Quartos", "beds")}
                {num("Suítes", "suites")}
                {num("Banheiros", "baths")}
                {num("Vagas de garagem", "parking")}
              </div>

              <label className="block space-y-1.5 text-xs text-cream-300">
                <span>Valor pretendido (opcional)</span>
                <input
                  value={f.price ? brl(Number(f.price)) : ""}
                  onChange={(e) => set("price")(onlyDigits(e.target.value, 10))}
                  inputMode="numeric"
                  placeholder="R$ 0"
                  className={field}
                />
              </label>

              <label className="block space-y-1.5 text-xs text-cream-300">
                <span>Observações (opcional)</span>
                <textarea
                  value={f.notes}
                  onChange={(e) => set("notes")(e.target.value.slice(0, 800))}
                  rows={3}
                  placeholder="Ex.: piscina, reformado, documentação em dia, aceita permuta..."
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
                className="w-full rounded-full bg-emerald-500 px-5 py-3 text-sm font-bold text-ink-950 hover:bg-emerald-400"
              >
                Enviar pelo WhatsApp
              </button>
              <p className="text-center text-[11px] text-cream-500">
                Nada é salvo no site: os dados vão só na mensagem que você envia pelo WhatsApp.
              </p>
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}
