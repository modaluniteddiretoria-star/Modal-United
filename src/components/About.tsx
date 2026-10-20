import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BadgeCheck, ShieldCheck, TrendingUp, Handshake } from "lucide-react";
import { useSiteData, type Agent, type SiteContent } from "../lib/data";
import { creciLabel } from "../lib/helpers";
import { Reveal, SectionHeading } from "./Shared";

const credentials = (agent: Agent, content: SiteContent) => [
  ...(agent.creci || agent.years > 0 || content.about.education
    ? [
        {
          icon: BadgeCheck,
          title: agent.years > 0 ? `Corretor há ${agent.years} anos` : "Corretor credenciado",
          text: [creciLabel(agent.creci), content.about.education].filter(Boolean).join(" · ") ||
            "Atendimento com registro no conselho regional.",
        },
      ]
    : []),
  {
    icon: ShieldCheck,
    title: "Documentação verificada",
    text: "Todo imóvel anunciado passa por due diligence completa antes de entrar no site.",
  },
  {
    icon: TrendingUp,
    title: "Análise de mercado real",
    text: "Comparativos de valor por m² atualizados semanalmente, do seu bairro de interesse.",
  },
  {
    icon: Handshake,
    title: "Negociação ao seu lado",
    text: "Estratégia de oferta, carta de crédito e acompanhamento até a entrega das chaves.",
  },
];

export function About() {
  const { agent: AGENT, content } = useSiteData();
  const CREDENTIALS = credentials(AGENT, content);
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const imgY = useTransform(scrollYProgress, [0, 1], [40, -40]);
  const frameY = useTransform(scrollYProgress, [0, 1], [80, -60]);

  return (
    <section id="sobre" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-20">
        {/* Imagem com parallax */}
        <div ref={ref} className="relative order-2 lg:order-1">
          <motion.div style={{ y: frameY }} className="absolute -left-4 -top-4 h-full w-full rounded-[2rem] border border-gold-500/30" />
          <motion.div style={{ y: imgY }} className="relative overflow-hidden rounded-[2rem] will-change-transform">
            <img
              src="/images/about.jpg"
              alt="Entrega de chaves a um casal de clientes"
              className="aspect-[4/3] w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-ink-950/60 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 right-5 flex items-center gap-4 rounded-2xl border border-cream-100/15 bg-ink-950/70 p-4 backdrop-blur-xl">
              <img
                src={AGENT.photo}
                alt={AGENT.name}
                className="h-14 w-14 rounded-full border-2 border-gold-500/70 object-cover"
              />
              <div>
                <p className="font-display text-lg text-cream-50">{AGENT.name}</p>
                <p className="text-[11px] uppercase tracking-[0.2em] text-gold-400">
                  {creciLabel(AGENT.creci) || AGENT.tagline}
                </p>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Texto */}
        <div className="order-1 lg:order-2">
          <SectionHeading
            eyebrow="Sobre o corretor"
            title={
              <>
                Quem negocia comigo,{" "}
                <span className="text-gold-300">compra com segurança</span>
              </>
            }
            description={content.about.description}
          />

          <div className="mt-10 grid gap-4 sm:grid-cols-2">
            {CREDENTIALS.map((c, i) => (
              <Reveal key={c.title} delay={0.1 + i * 0.08}>
                <div className="group h-full rounded-2xl border border-cream-100/10 bg-ink-900 p-5 transition-all duration-300 hover:border-gold-500/40 hover:bg-ink-850">
                  <div className="grid h-11 w-11 place-items-center rounded-xl bg-gold-500/12 text-gold-400 transition-transform duration-300 group-hover:scale-110">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-display text-base text-cream-50">{c.title}</h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-cream-300">{c.text}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.4}>
            {content.about.quote && (
              <blockquote className="mt-10 border-l-2 border-gold-500/60 pl-4 text-base italic leading-relaxed text-cream-200">
                “{content.about.quote}”
              </blockquote>
            )}
            <p className={`${content.about.quote ? "mt-3" : "mt-10"} font-display text-3xl italic text-gold-300/90`}>
              “{AGENT.name.split(" ")[0]}”
            </p>
          </Reveal>
        </div>
      </div>
    </section>
  );
}
