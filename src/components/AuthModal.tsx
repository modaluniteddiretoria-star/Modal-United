import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { UserRound, X } from "lucide-react";
import { closeAuth, finishAuth, loginClient, registerClient, useAuthUi } from "../lib/auth";
import { useSiteData } from "../lib/data";
import { maskPhone } from "../lib/helpers";
import { Turnstile, type TurnstileHandle } from "./Turnstile";

const field =
  "w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-sm text-cream-100 placeholder:text-cream-500/70 outline-none focus:border-gold-400/60";

// Entrar / Criar conta (cadastro exige captcha e aceite da Política de Privacidade)
export function AuthModal() {
  const { authOpen, authReason } = useAuthUi();
  const { agent } = useSiteData();
  const [mode, setMode] = useState<"login" | "signup">("signup");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [accept, setAccept] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [forgot, setForgot] = useState(false);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const captchaRef = useRef<TurnstileHandle>(null);

  useEffect(() => {
    if (!authOpen) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && closeAuth();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [authOpen]);

  const submit = async () => {
    if (busy) return;
    setError("");
    setBusy(true);
    try {
      if (mode === "login") {
        await loginClient(email, password);
      } else {
        if (!accept) throw new Error("Aceite a Política de Privacidade para criar a conta.");
        if (!captchaToken) throw new Error("Aguarde a verificação de segurança e tente de novo.");
        await registerClient({ name, phone, email, password, acceptPrivacy: accept, captchaToken });
      }
      setPassword("");
      finishAuth();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Algo deu errado. Tente novamente.");
      if (mode === "signup") captchaRef.current?.reset();
    } finally {
      setBusy(false);
    }
  };

  const whatsappReset = `https://wa.me/${agent.whatsapp}?text=${encodeURIComponent(
    `Olá ${agent.name.split(" ")[0]}! Esqueci a senha da minha conta no site (e-mail: ${email || "..."}).`
  )}`;

  return (
    <AnimatePresence>
      {authOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closeAuth}
          className="fixed inset-0 z-[85] flex items-end justify-center bg-ink-950/85 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="auth-title"
        >
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[94vh] w-full max-w-md overflow-y-auto rounded-t-3xl border border-cream-100/10 bg-ink-900 p-6 shadow-2xl sm:rounded-3xl"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-500 text-ink-950">
                  <UserRound className="h-5 w-5" />
                </span>
                <div>
                  <h3 id="auth-title" className="font-display text-2xl text-cream-50">
                    {mode === "login" ? "Entrar" : "Criar conta"}
                  </h3>
                  <p className="text-xs text-cream-400">
                    {authReason || "Converse no chat, agende visitas e envie propostas."}
                  </p>
                </div>
              </div>
              <button
                onClick={closeAuth}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-cream-100/15 text-cream-100 hover:border-gold-400/60"
                aria-label="Fechar"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 grid grid-cols-2 rounded-full border border-cream-100/12 p-1 text-sm font-bold">
              {(["signup", "login"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    setError("");
                    setForgot(false);
                  }}
                  className={`rounded-full py-2 transition ${mode === m ? "bg-cream-100 text-ink-950" : "text-cream-300 hover:text-gold-300"}`}
                >
                  {m === "signup" ? "Criar conta" : "Já tenho conta"}
                </button>
              ))}
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                void submit();
              }}
              className="mt-5 space-y-3"
            >
              {mode === "signup" && (
                <>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value.slice(0, 120))}
                    placeholder="Nome completo"
                    autoComplete="name"
                    required
                    aria-label="Nome completo"
                    className={field}
                  />
                  <input
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    placeholder="WhatsApp com DDD"
                    inputMode="tel"
                    autoComplete="tel"
                    required
                    aria-label="WhatsApp com DDD"
                    className={field}
                  />
                </>
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="E-mail"
                autoComplete="email"
                required
                aria-label="E-mail"
                className={field}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === "signup" ? "Crie uma senha (mín. 8 caracteres)" : "Senha"}
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                minLength={mode === "signup" ? 8 : undefined}
                required
                aria-label="Senha"
                className={field}
              />

              {mode === "signup" && (
                <>
                  <label className="flex items-start gap-2 text-xs leading-relaxed text-cream-300">
                    <input
                      type="checkbox"
                      checked={accept}
                      onChange={(e) => setAccept(e.target.checked)}
                      className="mt-0.5 h-4 w-4 accent-[#c9a045]"
                    />
                    <span>
                      Li e aceito a{" "}
                      <a href="#privacidade" className="text-gold-300 underline">
                        Política de Privacidade
                      </a>
                      .
                    </span>
                  </label>
                  <Turnstile ref={captchaRef} onToken={setCaptchaToken} />
                </>
              )}

              {error && (
                <p role="alert" className="text-sm text-red-300">
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="w-full rounded-full bg-gold-500 px-5 py-3 text-sm font-bold text-ink-950 transition hover:bg-gold-400 disabled:opacity-60"
              >
                {busy ? "Aguarde..." : mode === "login" ? "Entrar" : "Criar minha conta"}
              </button>

              {mode === "login" && (
                <div className="text-center text-xs text-cream-400">
                  {!forgot ? (
                    <button type="button" onClick={() => setForgot(true)} className="underline hover:text-gold-300">
                      Esqueci minha senha
                    </button>
                  ) : (
                    <p>
                      Fale com o {agent.name.split(" ")[0]} pelo{" "}
                      <a href={whatsappReset} target="_blank" rel="noreferrer" className="text-emerald-300 underline">
                        WhatsApp
                      </a>{" "}
                      para receber uma senha temporária.
                    </p>
                  )}
                </div>
              )}
            </form>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
