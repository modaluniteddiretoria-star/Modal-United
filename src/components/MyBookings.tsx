import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarDays,
  CalendarX,
  Clock,
  MapPin,
  Phone,
  Trash2,
  User,
} from "lucide-react";
import type { Booking } from "../lib/types";
import { PROPERTIES } from "../lib/data";
import { formatDisplayDate } from "../lib/helpers";
import { Reveal, SectionHeading } from "./Shared";

export function MyBookings({
  bookings,
  onCancel,
  onExplore,
}: {
  bookings: Booking[];
  onCancel: (id: string) => void;
  onExplore: () => void;
}) {
  const [confirmId, setConfirmId] = useState<string | null>(null);

  const sorted = [...bookings].sort(
    (a, b) => `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`)
  );

  return (
    <section id="agendamentos" className="mx-auto max-w-5xl scroll-mt-24 px-4 py-24 sm:px-6 lg:px-8 lg:py-32">
      <SectionHeading
        eyebrow="Sua agenda"
        title={
          <>
            Meus <span className="text-gold-300">agendamentos</span>
          </>
        }
        description="Todas as suas visitas confirmadas em um só lugar. Os dados ficam salvos neste dispositivo — apresente o código da visita no encontro com a corretora."
      />

      <Reveal delay={0.1} className="mt-12">
        {sorted.length === 0 ? (
          <div className="flex flex-col items-center rounded-3xl border border-dashed border-cream-100/15 bg-ink-900/60 px-6 py-16 text-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-gold-500/10 text-gold-400">
              <CalendarX className="h-7 w-7" />
            </span>
            <h3 className="mt-5 font-display text-xl text-cream-50">
              Nenhuma visita agendada ainda
            </h3>
            <p className="mt-2 max-w-sm text-sm text-cream-300">
              Escolha um imóvel do portfólio e agende sua visita em menos de 2 minutos.
            </p>
            <button
              onClick={onExplore}
              className="mt-7 inline-flex items-center gap-2 rounded-full bg-gold-500 px-7 py-3.5 text-sm font-bold text-ink-950 transition-all hover:bg-gold-400 hover:shadow-[0_12px_32px_-10px_rgba(201,160,69,0.6)] active:scale-[0.98]"
            >
              <CalendarDays className="h-4 w-4" />
              Explorar imóveis
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence initial={false}>
              {sorted.map((b) => {
                const p = PROPERTIES.find((x) => x.id === b.propertyId);
                if (!p) return null;
                const confirming = confirmId === b.id;
                return (
                  <motion.article
                    layout
                    key={b.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, x: -40, transition: { duration: 0.25 } }}
                    transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                    className="group flex flex-col gap-4 rounded-3xl border border-cream-100/10 bg-ink-900 p-4 transition-colors hover:border-gold-500/35 sm:flex-row sm:items-center sm:p-5"
                  >
                    <div className="flex items-center gap-4">
                      <img
                        src={p.image}
                        alt={p.title}
                        className="h-20 w-20 shrink-0 rounded-2xl object-cover sm:h-24 sm:w-24"
                      />
                      <div className="min-w-0 sm:hidden">
                        <h3 className="truncate font-display text-lg text-cream-50">{p.title}</h3>
                        <p className="flex items-center gap-1 text-xs text-cream-300">
                          <MapPin className="h-3.5 w-3.5 text-gold-400" />
                          {p.location}, {p.city}
                        </p>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="hidden sm:block">
                        <h3 className="truncate font-display text-lg text-cream-50">{p.title}</h3>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-cream-300">
                          <MapPin className="h-3.5 w-3.5 text-gold-400" />
                          {p.location}, {p.city}
                        </p>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-1.5 text-xs text-cream-300">
                        <span className="flex items-center gap-1.5 capitalize">
                          <CalendarDays className="h-4 w-4 text-gold-400" />
                          {formatDisplayDate(b.date)}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Clock className="h-4 w-4 text-gold-400" />
                          {b.time}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <User className="h-4 w-4 text-gold-400" />
                          {b.name}
                        </span>
                        <span className="hidden items-center gap-1.5 md:flex">
                          <Phone className="h-4 w-4 text-gold-400" />
                          {b.phone}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-3 sm:flex-col sm:items-end">
                      <span className="rounded-full bg-emerald-400/10 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-emerald-300">
                        Confirmada
                      </span>
                      <span className="font-mono text-[11px] tracking-wider text-cream-500">
                        {b.code}
                      </span>
                      <button
                        onClick={() => {
                          if (confirming) {
                            onCancel(b.id);
                            setConfirmId(null);
                          } else {
                            setConfirmId(b.id);
                            setTimeout(() => setConfirmId((c) => (c === b.id ? null : c)), 3500);
                          }
                        }}
                        className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold transition-all ${
                          confirming
                            ? "border-red-400/60 bg-red-500/15 text-red-300"
                            : "border-cream-100/15 text-cream-300 hover:border-red-400/50 hover:text-red-300"
                        }`}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        {confirming ? "Confirmar cancelamento" : "Cancelar"}
                      </button>
                    </div>
                  </motion.article>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </Reveal>
    </section>
  );
}
