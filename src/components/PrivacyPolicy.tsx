import { useEffect, useSyncExternalStore } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ShieldCheck, X } from "lucide-react";
import { useSiteData } from "../lib/data";

// Abre quando o endereço termina em #privacidade (links simples: <a href="#privacidade">)
export const PRIVACY_HASH = "#privacidade";
const UPDATED_AT = "20 de outubro de 2026";

function subscribeHash(cb: () => void) {
  window.addEventListener("hashchange", cb);
  return () => window.removeEventListener("hashchange", cb);
}

function closePolicy() {
  history.replaceState(null, "", window.location.pathname + window.location.search);
  window.dispatchEvent(new HashChangeEvent("hashchange"));
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h4 className="font-display text-lg text-cream-50">{title}</h4>
      <div className="space-y-2 text-sm leading-relaxed text-cream-300">{children}</div>
    </section>
  );
}

const link = "text-gold-300 underline underline-offset-2 hover:text-gold-200";

export function PrivacyPolicy() {
  const open = useSyncExternalStore(subscribeHash, () => window.location.hash === PRIVACY_HASH);
  const { agent } = useSiteData();

  useEffect(() => {
    if (!open) return;
    const esc = (e: KeyboardEvent) => e.key === "Escape" && closePolicy();
    window.addEventListener("keydown", esc);
    const previousOverflow = document.body.style.overflow; // pode estar aberta sobre o modal de agendamento
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", esc);
      document.body.style.overflow = previousOverflow;
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={closePolicy}
          className="fixed inset-0 z-[90] flex items-end justify-center bg-ink-950/85 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-labelledby="privacy-title"
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
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-gold-500 text-ink-950">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3 id="privacy-title" className="font-display text-xl text-cream-50">
                  Política de Privacidade
                </h3>
                <p className="text-xs text-cream-500">Atualizada em {UPDATED_AT}</p>
              </div>
              <button
                onClick={closePolicy}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cream-100/15 text-cream-100 transition-colors hover:border-gold-400/60 hover:text-gold-300"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-6 overflow-y-auto p-5 sm:p-6">
              <p className="text-sm leading-relaxed text-cream-300">
                Esta política explica como a {agent.brand} trata os dados pessoais de quem visita este site
                e agenda visitas a imóveis, conforme a Lei Geral de Proteção de Dados (Lei nº 13.709/2018 — LGPD).
              </p>

              <Section title="1. Quem é responsável pelos seus dados">
                <p>
                  {agent.brand} ({agent.city}). Para qualquer assunto sobre seus dados, fale com a gente pelo
                  e-mail{" "}
                  <a className={link} href={`mailto:${agent.email}`}>
                    {agent.email}
                  </a>
                  .
                </p>
              </Section>

              <Section title="2. Quais dados coletamos">
                <p>
                  <strong className="text-cream-100">Ao agendar uma visita:</strong> nome, telefone/WhatsApp,
                  e-mail e observações (os dois últimos são opcionais), além do imóvel, data e horário escolhidos.
                </p>
                <p>
                  <strong className="text-cream-100">No chat do site:</strong> o nome (opcional) e as mensagens que
                  você escrever. Quando a corretora está offline, um assistente automático responde dúvidas
                  básicas; todas as mensagens ficam registradas para ela responder depois.
                </p>
                <p>
                  <strong className="text-cream-100">Dados técnicos:</strong> para proteger o formulário contra
                  robôs, usamos o Cloudflare Turnstile, que analisa sinais do navegador e do dispositivo (como
                  endereço IP) no momento do agendamento.
                </p>
                <p>
                  Não usamos cookies de publicidade nem ferramentas de rastreamento ou de gravação de navegação.
                </p>
              </Section>

              <Section title="3. Para que usamos">
                <ul className="list-disc space-y-1 pl-5">
                  <li>Registrar e confirmar sua visita e entrar em contato sobre ela, inclusive por WhatsApp.</li>
                  <li>Responder às suas mensagens no chat do site.</li>
                  <li>Evitar agendamentos duplicados no mesmo horário e impedir abuso do formulário.</li>
                </ul>
                <p>
                  A base legal é a execução de procedimentos preliminares a pedido do titular (art. 7º, V, da LGPD)
                  e o legítimo interesse em manter o site seguro (art. 7º, IX).
                </p>
              </Section>

              <Section title="4. Com quem compartilhamos">
                <p>Não vendemos seus dados. Eles são tratados apenas pelos serviços que fazem o site funcionar:</p>
                <ul className="list-disc space-y-1 pl-5">
                  <li>
                    <strong className="text-cream-100">Supabase</strong> — banco de dados onde os agendamentos ficam
                    armazenados.
                  </li>
                  <li>
                    <strong className="text-cream-100">Vercel</strong> — hospedagem do site.
                  </li>
                  <li>
                    <strong className="text-cream-100">Cloudflare Turnstile</strong> — verificação anti-robô. O uso
                    desses dados pela Cloudflare segue o{" "}
                    <a
                      className={link}
                      href="https://www.cloudflare.com/turnstile-privacy-policy/"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Adendo de Privacidade do Turnstile
                    </a>
                    .
                  </li>
                  <li>
                    <strong className="text-cream-100">Google Fonts</strong> — carregamento das fontes do site.
                  </li>
                  <li>
                    <strong className="text-cream-100">Serviço de envio de e-mail</strong> — para avisar nossa
                    equipe sobre novos agendamentos.
                  </li>
                </ul>
                <p>
                  Alguns desses fornecedores podem processar dados fora do Brasil, com salvaguardas previstas na
                  LGPD. Ao clicar em links de WhatsApp ou Instagram, você passa a usar esses serviços, que têm
                  políticas próprias.
                </p>
              </Section>

              <Section title="5. Por quanto tempo guardamos">
                <p>
                  Pelo tempo necessário para atender sua solicitação e cumprir obrigações legais. Você pode pedir
                  a exclusão a qualquer momento.
                </p>
              </Section>

              <Section title="6. Dados guardados no seu navegador">
                <p>
                  Para mostrar “Minhas visitas”, o site guarda no seu próprio navegador (armazenamento local) o
                  código e os dados das visitas que você agendou, além de um identificador da sua conversa no chat
                  (para você poder retomá-la). Você pode apagar isso limpando os dados do site no navegador.
                </p>
              </Section>

              <Section title="7. Seus direitos">
                <p>
                  Você pode, a qualquer momento: confirmar se tratamos seus dados, acessá-los, corrigi-los, pedir a
                  exclusão, a portabilidade ou informações sobre compartilhamento, e revogar consentimentos (art. 18
                  da LGPD). Basta escrever para{" "}
                  <a className={link} href={`mailto:${agent.email}`}>
                    {agent.email}
                  </a>
                  . Você também pode reclamar à Autoridade Nacional de Proteção de Dados (ANPD).
                </p>
              </Section>

              <Section title="8. Segurança">
                <p>
                  Usamos conexão criptografada (HTTPS), controle de acesso no banco de dados e acesso restrito ao
                  painel administrativo. Nenhum sistema é 100% seguro, mas seguimos boas práticas para proteger
                  suas informações.
                </p>
              </Section>

              <Section title="9. Alterações">
                <p>Podemos atualizar esta política. A data da última versão fica no topo desta página.</p>
              </Section>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
