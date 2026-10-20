import { useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import {
  ArrowUpRight,
  Bath,
  BedDouble,
  CalendarDays,
  MapPin,
  Ruler,
  SearchX,
  Tag,
} from "lucide-react";
import type { Property, PropertyCategory, PropertyTransaction } from "../lib/types";
import { useSiteData } from "../lib/data";
import { priceLabel } from "../lib/helpers";
import { Reveal, SectionHeading } from "./Shared";
import { smallImage } from "../lib/images";

const FILTERS: { label: string; value: PropertyCategory | "todos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "Casas", value: "casa" },
  { label: "Apartamentos", value: "apartamento" },
  { label: "Coberturas", value: "cobertura" },
  { label: "Lofts", value: "loft" },
  { label: "Studios", value: "studio" },
];

const DEALS: { label: string; value: PropertyTransaction | "todos" }[] = [
  { label: "Todos", value: "todos" },
  { label: "Comprar", value: "venda" },
  { label: "Alugar", value: "aluguel" },
];

function PropertyCard({
  property,
  index,
  onDetails,
  onSchedule,
}: {
  property: Property;
  index: number;
  onDetails: (p: Property) => void;
  onSchedule: (p: Property) => void;
}) {
  // Parallax: a foto se desloca mais devagar que o card enquanto a página rola
  const imageBox = useRef<HTMLButtonElement>(null);
  const reduce = useReducedMotion();
  const { scrollYProgress } = useScroll({ target: imageBox, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-9%", "9%"]);
  const second = property.gallery[0];

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 32, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.25 } }}
      transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
      className="group relative flex flex-col overflow-hidden rounded-3xl border border-cream-100/10 bg-ink-900 transition-colors duration-300 hover:border-gold-500/40"
    >
      {/* Imagem */}
      <button
        ref={imageBox}
        onClick={() => onDetails(property)}
        className="relative block h-60 w-full overflow-hidden text-left sm:h-64"
        aria-label={`Ver detalhes de ${property.title}`}
      >
        <motion.div style={{ y }} className="absolute inset-x-0 -top-[10%] h-[120%]">
          <img
            src={smallImage(property.image)}
            decoding="async"
            alt={property.title}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-[900ms] ease-out group-hover:scale-110"
          />
          {second && (
            <img
              src={smallImage(second)}
              decoding="async"
              alt=""
              aria-hidden="true"
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-110 group-hover:opacity-100"
            />
          )}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-t from-ink-950/80 via-transparent to-transparent" />
        {property.badge && (
          <span className="absolute left-4 top-4 rounded-full bg-gold-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink-950">
            {property.badge}
          </span>
        )}
        <span className="absolute right-4 top-4 grid h-9 w-9 translate-y-1 place-items-center rounded-full bg-ink-950/60 text-cream-100 opacity-0 backdrop-blur transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <ArrowUpRight className="h-4 w-4" />
        </span>
        <p className="absolute bottom-4 left-4 font-display text-2xl text-cream-50 drop-shadow">
          {priceLabel(property)}
        </p>
        <span className="absolute bottom-5 right-4 rounded-full border border-cream-100/25 bg-ink-950/60 px-2.5 py-1 text-[10px] font-bold uppercase tracking-widest text-cream-100 backdrop-blur">
          {property.transaction === "aluguel" ? "Para alugar" : "À venda"}
        </span>
      </button>

      {/* Conteúdo */}
      <div className="flex flex-1 flex-col p-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-400">
          {property.typeLabel}
        </p>
        <h3 className="mt-1 font-display text-xl leading-snug text-cream-50">
          {property.title}
        </h3>
        <p className="mt-1.5 flex items-center gap-1.5 text-sm text-cream-300">
          <MapPin className="h-3.5 w-3.5 text-gold-400" />
          {property.location}, {property.city}
        </p>

        <div className="mt-4 flex items-center gap-4 border-t border-cream-100/10 pt-4 text-xs text-cream-300">
          <span className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4 text-gold-400" /> {property.beds} quartos
          </span>
          <span className="flex items-center gap-1.5">
            <Bath className="h-4 w-4 text-gold-400" /> {property.baths}
          </span>
          <span className="flex items-center gap-1.5">
            <Ruler className="h-4 w-4 text-gold-400" /> {property.area} m²
          </span>
        </div>

        <div className="mt-5 flex items-center gap-2">
          <button
            onClick={() => onSchedule(property)}
            className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gold-500 px-4 py-3 text-sm font-bold text-ink-950 transition-all hover:bg-gold-400 hover:shadow-[0_10px_30px_-10px_rgba(201,160,69,0.6)] active:scale-[0.98]"
          >
            <CalendarDays className="h-4 w-4" />
            Agendar visita
          </button>
          <button
            onClick={() => onDetails(property)}
            className="rounded-full border border-cream-100/15 px-4 py-3 text-sm font-semibold text-cream-100 transition-colors hover:border-gold-400/60 hover:text-gold-300"
          >
            Detalhes
          </button>
        </div>
      </div>
    </motion.article>
  );
}

export function Properties({
  onDetails,
  onSchedule,
}: {
  onDetails: (p: Property) => void;
  onSchedule: (p: Property) => void;
}) {
  const { properties: PROPERTIES, agent } = useSiteData();
  const [filter, setFilter] = useState<PropertyCategory | "todos">("todos");
  const [deal, setDeal] = useState<PropertyTransaction | "todos">("todos");

  const list = PROPERTIES.filter(
    (p) => (filter === "todos" || p.category === filter) && (deal === "todos" || p.transaction === deal)
  );

  const sellUrl = `https://wa.me/${agent.whatsapp}?text=${encodeURIComponent(
    `Olá ${agent.name}! Tenho um imóvel e quero vender ou anunciar com a ${agent.brand}.`
  )}`;

  return (
    <section id="imoveis" className="relative mx-auto max-w-7xl scroll-mt-24 px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <div className="pointer-events-none absolute -left-32 top-40 h-96 w-96 rounded-full bg-gold-500/[0.06] blur-3xl" />

      <div className="flex flex-wrap items-end justify-between gap-8">
        <SectionHeading
          eyebrow="Portfólio selecionado"
          title={
            <>
              Imóveis que eu mostraria{" "}
              <span className="text-gold-300">para a minha família</span>
            </>
          }
          description="Cada imóvel abaixo passou por uma curadoria rigorosa: documentação, localização, estado de conservação e potencial de valorização. Não entra no site o que eu não compraria."
        />
      </div>

      {/* Negócio: comprar / alugar + vender */}
      <Reveal delay={0.1} className="mt-10 flex flex-wrap items-center justify-between gap-4">
        <div
          role="tablist"
          aria-label="Tipo de negócio"
          className="inline-flex rounded-full border border-cream-100/15 bg-ink-900/70 p-1"
        >
          {DEALS.map((d) => {
            const active = deal === d.value;
            return (
              <button
                key={d.value}
                role="tab"
                aria-selected={active}
                onClick={() => setDeal(d.value)}
                className={`relative rounded-full px-5 py-2 text-sm font-bold transition-colors ${
                  active ? "text-ink-950" : "text-cream-300 hover:text-gold-300"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="deal-pill"
                    className="absolute inset-0 rounded-full bg-cream-100"
                    transition={{ type: "spring", damping: 28, stiffness: 320 }}
                  />
                )}
                <span className="relative z-10">{d.label}</span>
              </button>
            );
          })}
        </div>
        <a
          href={sellUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 rounded-full border border-gold-500/50 px-5 py-2.5 text-sm font-bold text-gold-300 transition-colors hover:border-gold-400 hover:bg-gold-500/10"
        >
          <Tag className="h-4 w-4" />
          Quero vender meu imóvel
        </a>
      </Reveal>

      {/* Filtros */}
      <Reveal delay={0.15} className="mt-5">
        <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
          {FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`relative shrink-0 rounded-full px-5 py-2.5 text-sm font-semibold transition-all ${
                  active
                    ? "text-ink-950"
                    : "border border-cream-100/15 text-cream-300 hover:border-gold-400/50 hover:text-gold-300"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="filter-pill"
                    className="absolute inset-0 rounded-full bg-gold-500"
                    transition={{ type: "spring", damping: 28, stiffness: 320 }}
                  />
                )}
                <span className="relative z-10">{f.label}</span>
              </button>
            );
          })}
        </div>
      </Reveal>

      {/* Grid */}
      <motion.div layout className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {list.map((p, i) => (
            <PropertyCard
              key={p.id}
              property={p}
              index={i}
              onDetails={onDetails}
              onSchedule={onSchedule}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {list.length === 0 && (
        <div className="mt-10 flex flex-col items-center gap-3 rounded-3xl border border-cream-100/10 bg-ink-900/60 px-6 py-14 text-center">
          <SearchX className="h-8 w-8 text-gold-400" />
          <p className="font-display text-xl text-cream-50">Nenhum imóvel com esse filtro no momento</p>
          <p className="max-w-md text-sm text-cream-300">
            Fale com o {agent.name}: ele pode buscar opções fora do site para você.
          </p>
          <a
            href={`https://wa.me/${agent.whatsapp}?text=${encodeURIComponent(
              `Olá ${agent.name}! Procuro um imóvel ${deal === "aluguel" ? "para alugar" : deal === "venda" ? "para comprar" : ""} e não encontrei no site.`.replace(/\s+/g, " ")
            )}`}
            target="_blank"
            rel="noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-bold text-ink-950 hover:bg-gold-400"
          >
            Falar no WhatsApp
          </a>
        </div>
      )}
    </section>
  );
}
