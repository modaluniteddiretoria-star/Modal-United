import { useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bath,
  BedDouble,
  CalendarDays,
  Check,
  MapPin,
  MessageCircle,
  Ruler,
  X,
} from "lucide-react";
import type { Property } from "../lib/types";
import { useSiteData } from "../lib/data";
import { brl, priceLabel } from "../lib/helpers";

export function PropertyModal({
  property,
  onClose,
  onSchedule,
}: {
  property: Property | null;
  onClose: () => void;
  onSchedule: (p: Property) => void;
}) {
  const { agent: AGENT } = useSiteData();
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = property ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [property]);

  return (
    <AnimatePresence>
      {property && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/80 p-0 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Detalhes de ${property.title}`}
        >
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-t-3xl border border-cream-100/10 bg-ink-900 shadow-2xl sm:rounded-3xl"
          >
            {/* Imagem */}
            <div className="relative h-64 sm:h-80">
              <img src={property.image} alt={property.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink-900 via-ink-900/20 to-transparent" />
              <button
                onClick={onClose}
                className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full bg-ink-950/60 text-cream-100 backdrop-blur transition-colors hover:bg-ink-950"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
              {property.badge && (
                <span className="absolute left-5 top-5 rounded-full bg-gold-500 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-ink-950">
                  {property.badge}
                </span>
              )}
              <div className="absolute bottom-4 left-5 right-5 flex flex-wrap items-end justify-between gap-3">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold-400">
                    {property.typeLabel}
                  </p>
                  <h3 className="font-display text-2xl text-cream-50 sm:text-3xl">{property.title}</h3>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-cream-300">
                    <MapPin className="h-4 w-4 text-gold-400" />
                    {property.location}, {property.city}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl text-gold-300 sm:text-3xl">{priceLabel(property)}</p>
                  {property.condo && (
                    <p className="text-xs text-cream-300">condomínio {brl(property.condo)}/mês</p>
                  )}
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              {/* Specs */}
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: BedDouble, label: "Quartos", value: property.beds },
                  { icon: Bath, label: "Banheiros", value: property.baths },
                  { icon: Ruler, label: "Área", value: `${property.area} m²` },
                ].map(({ icon: Icon, label, value }) => (
                  <div
                    key={label}
                    className="rounded-2xl border border-cream-100/10 bg-ink-800/70 p-4 text-center"
                  >
                    <Icon className="mx-auto h-5 w-5 text-gold-400" />
                    <p className="mt-2 font-display text-xl text-cream-50">{value}</p>
                    <p className="text-[10px] uppercase tracking-widest text-cream-500">{label}</p>
                  </div>
                ))}
              </div>

              <p className="mt-6 text-sm leading-relaxed text-cream-300 sm:text-base">
                {property.description}
              </p>

              {/* Diferenciais */}
              <div className="mt-6 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                {property.features.map((f) => (
                  <div key={f} className="flex items-start gap-2.5 text-sm text-cream-100">
                    <span className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-gold-500/15 text-gold-400">
                      <Check className="h-3 w-3" />
                    </span>
                    {f}
                  </div>
                ))}
              </div>

              {/* Mini card do corretor */}
              <div className="mt-7 flex items-center gap-4 rounded-2xl border border-cream-100/10 bg-ink-800/60 p-4">
                <img
                  src={AGENT.photo}
                  alt={AGENT.name}
                  className="h-14 w-14 rounded-full border-2 border-gold-500/60 object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base text-cream-50">{AGENT.name}</p>
                  <p className="text-xs text-cream-300">
                    {AGENT.creci} · responde em média em 15 min
                  </p>
                </div>
                <a
                  href={`https://wa.me/${AGENT.whatsapp}?text=${encodeURIComponent(
                    `Olá Mariana! Tenho interesse no imóvel "${property.title}".`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="hidden items-center gap-2 rounded-full border border-emerald-400/40 px-4 py-2.5 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-400/10 sm:inline-flex"
                >
                  <MessageCircle className="h-4 w-4" />
                  WhatsApp
                </a>
              </div>

              {/* CTAs */}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  onClick={() => onSchedule(property)}
                  className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gold-500 px-6 py-4 text-sm font-bold text-ink-950 transition-all hover:bg-gold-400 hover:shadow-[0_12px_36px_-10px_rgba(201,160,69,0.6)] active:scale-[0.98]"
                >
                  <CalendarDays className="h-4 w-4" />
                  Agendar visita a este imóvel
                </button>
                <a
                  href={`https://wa.me/${AGENT.whatsapp}?text=${encodeURIComponent(
                    `Olá Mariana! Tenho interesse no imóvel "${property.title}".`
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/40 px-6 py-4 text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-400/10 sm:hidden"
                >
                  <MessageCircle className="h-4 w-4" />
                  Falar no WhatsApp
                </a>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
