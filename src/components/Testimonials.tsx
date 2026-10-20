import { Quote, Star } from "lucide-react";
import { useSiteData } from "../lib/data";
import { initials } from "../lib/helpers";
import { Reveal, SectionHeading } from "./Shared";

export function Testimonials() {
  const { content, agent } = useSiteData();
  const list = content.testimonials;
  if (list.length === 0) return null;
  const rating =
    agent.reviews > 0 && agent.rating > 0
      ? `Avaliação média de ${agent.rating.toLocaleString("pt-BR")} em ${agent.reviews} avaliações.`
      : "O que dizem os clientes que já compraram, venderam ou alugaram com a gente.";

  return (
    <section
      id="depoimentos"
      className="relative scroll-mt-24 overflow-hidden border-y border-cream-100/10 bg-ink-900 py-24 lg:py-32"
    >
      <div className="pointer-events-none absolute -left-40 bottom-0 h-96 w-96 rounded-full bg-gold-500/[0.06] blur-3xl" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SectionHeading
          align="center"
          eyebrow="Depoimentos"
          title={
            <>
              Histórias que terminam{" "}
              <span className="text-gold-300">com chave na mão</span>
            </>
          }
          description={rating}
        />

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {list.map((t, i) => (
            <Reveal key={`${t.name}-${i}`} delay={i * 0.12}>
              <figure className="group relative h-full rounded-3xl border border-cream-100/10 bg-ink-800/60 p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-gold-500/40 hover:shadow-[0_24px_60px_-24px_rgba(201,160,69,0.35)]">
                <Quote className="absolute right-6 top-6 h-8 w-8 text-gold-500/20 transition-colors group-hover:text-gold-500/40" />
                <div className="flex text-gold-400">
                  {Array.from({ length: 5 }).map((_, s) => (
                    <Star key={s} className="h-4 w-4 fill-current" />
                  ))}
                </div>
                <blockquote className="mt-5 text-sm leading-relaxed text-cream-100">
                  “{t.quote}”
                </blockquote>
                <figcaption className="mt-6 flex items-center gap-3 border-t border-cream-100/10 pt-5">
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-gold-500/15 font-display text-sm font-bold text-gold-300">
                    {initials(t.name)}
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-cream-50">{t.name}</p>
                    {t.role && <p className="text-xs text-cream-500">{t.role}</p>}
                  </div>
                </figcaption>
              </figure>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
