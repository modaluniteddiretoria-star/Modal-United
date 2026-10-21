import {
  Building2,
  Clock,
  Instagram,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
} from "lucide-react";
import { useSiteData } from "../lib/data";
import { useAuth } from "../lib/auth";
import { creciLabel, instagramUrl, scrollToId } from "../lib/helpers";

export function Footer() {
  const { agent: AGENT, content } = useSiteData();
  const isClient = useAuth().status === "client";
  const creci = creciLabel(AGENT.creci);
  return (
    <footer id="contato" className="scroll-mt-24 border-t border-cream-100/10 bg-ink-950">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 py-16 sm:px-6 md:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Marca */}
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-500 text-ink-950">
              <Building2 className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="font-brand text-[15px] uppercase tracking-[0.18em] text-cream-50">{AGENT.brand}</p>
              <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-400">
                Consultoria em Imóveis
              </p>
            </div>
          </div>
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-cream-300">
            Corretor especialista em imóveis de alto padrão em São Paulo e interior. Curadoria,
            transparência e negociação do início à entrega das chaves.
          </p>
          <div className="mt-5 flex items-center gap-3">
            <a
              href={`https://wa.me/${AGENT.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              aria-label="WhatsApp"
              className="grid h-10 w-10 place-items-center rounded-full border border-cream-100/15 text-cream-100 transition-all hover:-translate-y-0.5 hover:border-gold-400/60 hover:text-gold-300"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
            <a
              href={instagramUrl(AGENT.instagram)}
              target="_blank"
              rel="noreferrer"
              aria-label="Instagram"
              className="grid h-10 w-10 place-items-center rounded-full border border-cream-100/15 text-cream-100 transition-all hover:-translate-y-0.5 hover:border-gold-400/60 hover:text-gold-300"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={`mailto:${AGENT.email}`}
              aria-label="E-mail"
              className="grid h-10 w-10 place-items-center rounded-full border border-cream-100/15 text-cream-100 transition-all hover:-translate-y-0.5 hover:border-gold-400/60 hover:text-gold-300"
            >
              <Mail className="h-4 w-4" />
            </a>
          </div>
        </div>

        {/* Navegação */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.24em] text-gold-400">Navegação</h3>
          <ul className="mt-5 space-y-3 text-sm">
            {[
              ["Imóveis", "imoveis"],
              ["Sobre o corretor", "sobre"],
              ...(content.testimonials.length > 0 ? [["Depoimentos", "depoimentos"]] : []),
              ...(isClient ? [["Meus agendamentos", "agendamentos"]] : []),
            ].map(([label, id]) => (
              <li key={id}>
                <button
                  onClick={() => scrollToId(id)}
                  className="text-cream-300 transition-colors hover:text-gold-300"
                >
                  {label}
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Contato */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.24em] text-gold-400">Contato</h3>
          <ul className="mt-5 space-y-4 text-sm text-cream-300">
            <li className="flex items-start gap-3">
              <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
              <a href={`tel:${AGENT.phone.replace(/\D/g, "")}`} className="hover:text-gold-300">
                {AGENT.phone}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
              <a href={`mailto:${AGENT.email}`} className="break-all hover:text-gold-300">
                {AGENT.email}
              </a>
            </li>
            <li className="flex items-start gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
              <span className="whitespace-pre-line">
                {content.address ? `${content.address}\n${AGENT.city}` : AGENT.city}
              </span>
            </li>
          </ul>
        </div>

        {/* Atendimento */}
        <div>
          <h3 className="text-xs font-bold uppercase tracking-[0.24em] text-gold-400">Atendimento</h3>
          <ul className="mt-5 space-y-4 text-sm text-cream-300">
            <li className="flex items-start gap-3">
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
              <span>
                Segunda a sexta · 9h às 18h
                <br />
                Sábado · 9h às 17h
              </span>
            </li>
            <li className="rounded-2xl border border-cream-100/10 bg-ink-900 p-4">
              <p className="text-xs leading-relaxed text-cream-300">
                Visitas agendadas pelo site têm atendimento prioritário e confirmação imediata
                por WhatsApp.
              </p>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-cream-100/10">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 py-6 text-xs text-cream-500 sm:flex-row sm:px-6 lg:px-8">
          <p>
            © {new Date().getFullYear()} {[AGENT.brand, AGENT.name, creci].filter(Boolean).join(" · ")}
          </p>
          <p className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1">
            <a href="#privacidade" className="underline-offset-2 hover:text-gold-300 hover:underline">
              Política de Privacidade
            </a>
            <span aria-hidden="true">·</span>
            <span>Todos os preços sujeitos a alteração sem aviso prévio.</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
