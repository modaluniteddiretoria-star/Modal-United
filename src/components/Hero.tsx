import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Bath,
  BedDouble,
  CalendarDays,
  ChevronDown,
  Instagram,
  MessageCircle,
  Phone,
  Ruler,
  Star,
} from "lucide-react";
import { DEFAULT_PROPERTIES, useSiteData } from "../lib/data";
import { instagramUrl, priceLabel, scrollToId } from "../lib/helpers";
import { GoldButton } from "./Shared";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function Hero({ onSchedule }: { onSchedule: (id: string) => void }) {
  const { agent: AGENT, properties: PROPERTIES } = useSiteData();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const bgY = useTransform(scrollYProgress, [0, 1], ["0%", "24%"]);
  const bgScale = useTransform(scrollYProgress, [0, 1], [1.06, 1.22]);
  const contentFade = useTransform(scrollYProgress, [0, 0.65], [1, 0]);
  const cardY = useTransform(scrollYProgress, [0, 1], [0, -70]);
  const featureY = useTransform(scrollYProgress, [0, 1], [0, -160]);

  const featured = PROPERTIES[0] ?? DEFAULT_PROPERTIES[0];

  return (
    <section ref={ref} className="relative flex min-h-[100svh] items-center overflow-hidden">
      {/* Parallax background */}
      <motion.div style={{ y: bgY, scale: bgScale }} className="absolute inset-0 will-change-transform">
        <img
          src="/images/hero.jpg"
          alt="Mansão moderna de alto padrão com piscina ao entardecer"
          className="h-full w-full object-cover"
        />
      </motion.div>
      <div className="absolute inset-0 bg-gradient-to-b from-ink-950/85 via-ink-950/40 to-ink-950" />
      <div className="absolute inset-0 bg-gradient-to-r from-ink-950/90 via-ink-950/30 to-ink-950/10" />
      <div className="pointer-events-none absolute inset-0 bg-noise opacity-60" />

      {/* Glow orbs */}
      <motion.div
        style={{ y: featureY }}
        className="pointer-events-none absolute -left-24 top-1/4 h-72 w-72 rounded-full bg-gold-500/15 blur-3xl"
      />
      <motion.div
        style={{ y: cardY }}
        className="pointer-events-none absolute -right-16 top-10 h-80 w-80 rounded-full bg-emerald-400/10 blur-3xl"
      />

      <motion.div
        style={{ opacity: contentFade }}
        className="relative z-10 mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 px-4 pb-24 pt-32 sm:px-6 lg:grid-cols-[1.15fr_0.85fr] lg:px-8"
      >
        {/* LEFT column — card do corretor no topo */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease }}
            style={{ y: cardY }}
            className="w-full max-w-md"
          >
            {/* ===== Card do corretor (topo esquerdo) ===== */}
            <div className="relative overflow-hidden rounded-3xl border border-cream-100/15 bg-ink-900/55 p-4 shadow-2xl backdrop-blur-xl sm:p-5">
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gold-500/20 blur-2xl" />
              <div className="flex items-center gap-4">
                {/* Foto redonda */}
                <div className="relative shrink-0">
                  <div className="absolute -inset-1.5 rounded-full bg-gradient-to-tr from-gold-600 via-gold-400 to-gold-300 opacity-90" />
                  <img
                    src={AGENT.photo}
                    alt={`Foto do corretor ${AGENT.name}`}
                    className="relative h-20 w-20 rounded-full border-4 border-ink-900 object-cover sm:h-24 sm:w-24"
                  />
                  <span className="absolute bottom-1 right-1 z-10 h-4 w-4 rounded-full border-2 border-ink-900 bg-emerald-400">
                    <span className="absolute inset-0 animate-ping rounded-full bg-emerald-400/70" />
                  </span>
                </div>

                {/* Dados */}
                <div className="min-w-0">
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold-400">
                    Seu especialista em imóveis
                  </p>
                  <h3 className="truncate font-display text-xl font-semibold text-cream-50 sm:text-2xl">
                    {AGENT.name}
                  </h3>
                  <p className="text-xs text-cream-300">{AGENT.creci}</p>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <div className="flex text-gold-400">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-current" />
                      ))}
                    </div>
                    <span className="text-xs text-cream-300">
                      {AGENT.rating.toLocaleString("pt-BR")} · {AGENT.reviews} avaliações
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-2">
                <a
                  href={`https://wa.me/${AGENT.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-emerald-500/90 px-4 py-2.5 text-xs font-bold text-ink-950 transition-all hover:bg-emerald-400 hover:shadow-lg sm:text-sm"
                >
                  <MessageCircle className="h-4 w-4" />
                  {AGENT.phone}
                </a>
                <a
                  href={`tel:${AGENT.phone.replace(/\D/g, "")}`}
                  className="grid h-10 w-10 place-items-center rounded-full border border-cream-100/20 text-cream-100 transition-colors hover:border-gold-400/60 hover:text-gold-300"
                  aria-label="Ligar agora"
                >
                  <Phone className="h-4 w-4" />
                </a>
                <a
                  href={instagramUrl(AGENT.instagram)}
                  target="_blank"
                  rel="noreferrer"
                  className="grid h-10 w-10 place-items-center rounded-full border border-cream-100/20 text-cream-100 transition-colors hover:border-gold-400/60 hover:text-gold-300"
                  aria-label="Instagram"
                >
                  <Instagram className="h-4 w-4" />
                </a>
              </div>

              <div className="mt-3 flex items-center justify-between border-t border-cream-100/10 pt-3 text-[11px] text-cream-300">
                <span>
                  · <strong className="text-cream-100">{AGENT.sold}+</strong> vendas
                </span>
                <span>
                  · <strong className="text-cream-100">{AGENT.years}</strong> anos de mercado
                </span>
                <span className="hidden sm:inline">
                  · <strong className="text-cream-100">98%</strong> satisfação
                </span>
              </div>
            </div>
          </motion.div>

          {/* Headline */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.35, ease }}
            className="mt-10"
          >
            <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold-500/30 bg-gold-500/10 px-4 py-1.5 text-[11px] font-semibold uppercase tracking-[0.22em] text-gold-300">
              <span className="h-1.5 w-1.5 animate-pulse-soft rounded-full bg-gold-400" />
              Agenda de visitas aberta
            </p>
            <h1 className="font-brand text-[1.85rem] leading-[1.18] text-cream-50 sm:text-5xl lg:text-[3.3rem]">
              O endereço certo para a sua{" "}
              <span className="relative inline-block text-gold-300">
                <em className="not-italic">próxima história</em>
                <svg
                  className="absolute -bottom-2 left-0 w-full text-gold-500/70"
                  viewBox="0 0 300 12"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path d="M2 9C60 3 180 2 298 8" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
                </svg>
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-cream-300 sm:text-lg">
              Curadoria de imóveis de alto padrão em São Paulo e região. Agende sua visita
              em menos de 2 minutos e conheça pessoalmente o imóvel dos seus sonhos.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-3">
              <GoldButton onClick={() => scrollToId("imoveis")} className="px-8 py-4 text-base">
                Explorar imóveis
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </GoldButton>
              <GoldButton variant="outline" onClick={() => onSchedule(featured.id)} className="px-7 py-4 text-base">
                <CalendarDays className="h-4 w-4" />
                Agendar uma visita
              </GoldButton>
            </div>

            <div className="mt-10 hidden items-center gap-8 sm:flex">
              {[
                ["R$ 480M+", "em transações"],
                ["18 dias", "tempo médio de venda"],
                ["47 bairros", "de atuação"],
              ].map(([v, l]) => (
                <div key={l}>
                  <p className="font-display text-2xl text-gold-300">{v}</p>
                  <p className="text-xs uppercase tracking-widest text-cream-500">{l}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* RIGHT — featured property floating card */}
        <motion.div
          style={{ y: featureY }}
          className="relative hidden justify-center lg:flex"
        >
          <motion.button
            initial={{ opacity: 0, y: 60, rotate: 2 }}
            animate={{ opacity: 1, y: 0, rotate: 0 }}
            transition={{ duration: 1, delay: 0.55, ease }}
            onClick={() => scrollToId("imoveis")}
            className="group relative w-full max-w-sm animate-float-y text-left"
          >
            <div className="absolute -inset-1 rounded-[2rem] bg-gradient-to-tr from-gold-600/50 via-gold-400/20 to-transparent opacity-70 blur" />
            <div className="relative overflow-hidden rounded-[1.8rem] border border-cream-100/15 bg-ink-900/80 shadow-2xl backdrop-blur">
              <div className="relative h-60 overflow-hidden">
                <img
                  src={featured.image}
                  alt={featured.title}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-ink-950/70 to-transparent" />
                <span className="absolute left-4 top-4 rounded-full bg-gold-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink-950">
                  {featured.badge}
                </span>
                <p className="absolute bottom-4 left-4 font-display text-2xl text-cream-50">
                  {priceLabel(featured)}
                </p>
              </div>
              <div className="p-5">
                <h3 className="font-display text-xl text-cream-50">{featured.title}</h3>
                <p className="mt-0.5 text-xs uppercase tracking-[0.2em] text-gold-400">
                  {featured.location} · {featured.city}
                </p>
                <div className="mt-4 flex items-center gap-4 text-xs text-cream-300">
                  <span className="flex items-center gap-1.5">
                    <BedDouble className="h-4 w-4 text-gold-400" /> {featured.beds}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Bath className="h-4 w-4 text-gold-400" /> {featured.baths}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Ruler className="h-4 w-4 text-gold-400" /> {featured.area} m²
                  </span>
                  <span className="ml-auto flex items-center gap-1 font-semibold text-gold-300">
                    Ver detalhes <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </div>
          </motion.button>
        </motion.div>
      </motion.div>

      {/* Scroll cue */}
      <motion.button
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4 }}
        onClick={() => scrollToId("imoveis")}
        aria-label="Rolar para imóveis"
        className="absolute bottom-6 left-1/2 z-10 -translate-x-1/2 text-cream-300 transition-colors hover:text-gold-300"
      >
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
          className="flex flex-col items-center gap-1"
        >
          <span className="text-[10px] font-semibold uppercase tracking-[0.3em]">Explore</span>
          <ChevronDown className="h-5 w-5" />
        </motion.div>
      </motion.button>
    </section>
  );
}
