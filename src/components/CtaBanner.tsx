import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { CalendarDays, MessageCircle } from "lucide-react";
import { useSiteData } from "../lib/data";
import { scrollToId } from "../lib/helpers";
import { GoldButton } from "./Shared";

export function CtaBanner() {
  const { agent: AGENT } = useSiteData();
  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const bgY = useTransform(scrollYProgress, [0, 1], ["-14%", "14%"]);

  return (
    <section ref={ref} className="relative overflow-hidden py-28 lg:py-36">
      {/* Parallax */}
      <motion.div style={{ y: bgY }} className="absolute -inset-y-[18%] inset-x-0 will-change-transform">
        <img
          src="/images/prop-5.jpg"
          alt=""
          className="h-full w-full object-cover"
          loading="lazy"
        />
      </motion.div>
      <div className="absolute inset-0 bg-ink-950/78" />
      <div className="pointer-events-none absolute inset-0 bg-noise" />

      <div className="relative z-10 mx-auto max-w-3xl px-4 text-center sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="text-xs font-bold uppercase tracking-[0.3em] text-gold-400"
        >
          A próxima mudança começa com uma visita
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 28 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-4 font-brand text-2xl leading-snug text-cream-50 sm:text-4xl sm:leading-[1.2]"
        >
          Pronto para conhecer seu próximo lar{" "}
          <span className="text-gold-300">pessoalmente?</span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mx-auto mt-5 max-w-xl text-sm leading-relaxed text-cream-300 sm:text-base"
        >
          Agende agora mesmo — horários de segunda a sábado, com confirmação em
          instantes e acompanhamento exclusivo da Mariana em toda a visita.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mt-9 flex flex-wrap items-center justify-center gap-3"
        >
          <GoldButton onClick={() => scrollToId("imoveis")} className="px-8 py-4 text-base">
            <CalendarDays className="h-4 w-4" />
            Agendar minha visita
          </GoldButton>
          <a
            href={`https://wa.me/${AGENT.whatsapp}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-cream-100/25 bg-ink-950/40 px-7 py-4 text-base font-semibold text-cream-100 backdrop-blur transition-all hover:border-emerald-400/60 hover:text-emerald-300"
          >
            <MessageCircle className="h-4 w-4" />
            Chamar no WhatsApp
          </a>
        </motion.div>
      </div>
    </section>
  );
}
