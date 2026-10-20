import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  CalendarDays,
  Instagram,
  Menu,
  MessageCircle,
  Phone,
  Settings2,
  X,
} from "lucide-react";
import { useSiteData } from "../lib/data";
import { instagramUrl, scrollToId } from "../lib/helpers";

const LINKS = [
  { label: "Imóveis", id: "imoveis" },
  { label: "Sobre", id: "sobre" },
  { label: "Depoimentos", id: "depoimentos" },
  { label: "Contato", id: "contato" },
];

export function Navbar({
  bookingsCount,
  onOpenBookings,
  onOpenAdmin,
}: {
  bookingsCount: number;
  onOpenBookings: () => void;
  onOpenAdmin: () => void;
}) {
  const { agent: AGENT, content } = useSiteData();
  const links = LINKS.filter((l) => l.id !== "depoimentos" || content.testimonials.length > 0);
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const go = (id: string) => {
    setOpen(false);
    setTimeout(() => scrollToId(id), 60);
  };

  return (
    <>
      <motion.header
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className={`fixed inset-x-0 top-0 z-40 transition-all duration-500 ${
          scrolled
            ? "border-b border-cream-100/10 bg-ink-950/85 backdrop-blur-xl"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
          {/* Logo */}
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="group flex items-center gap-3 text-left"
            aria-label="Ir para o início"
          >
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-500 text-ink-950 shadow-[0_8px_24px_-8px_rgba(201,160,69,0.7)] transition-transform duration-300 group-hover:rotate-6">
              <Building2 className="h-5 w-5" />
            </span>
            <span className="leading-tight">
              <span className="block whitespace-nowrap font-brand text-[13px] uppercase tracking-[0.14em] text-cream-50 sm:text-[15px] sm:tracking-[0.18em]">
                {AGENT.brand}
              </span>
              <span className="block whitespace-nowrap text-[10px] font-semibold uppercase tracking-[0.3em] text-gold-400">
                Consultoria em Imóveis
              </span>
            </span>
          </button>

          {/* Desktop links */}
          <nav className="hidden items-center gap-8 lg:flex">
            {links.map((l) => (
              <button
                key={l.id}
                onClick={() => go(l.id)}
                className="relative text-sm font-medium text-cream-300 transition-colors hover:text-gold-300 after:absolute after:-bottom-1.5 after:left-0 after:h-px after:w-0 after:bg-gold-400 after:transition-all after:duration-300 hover:after:w-full"
              >
                {l.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Meus agendamentos */}
            <button
              onClick={onOpenBookings}
              className="relative flex items-center gap-2 rounded-full border border-cream-100/15 bg-cream-100/5 px-3.5 py-2 text-xs font-semibold text-cream-100 backdrop-blur transition-all hover:border-gold-400/60 hover:text-gold-300 sm:px-4 sm:text-sm"
            >
              <CalendarDays className="h-4 w-4" />
              <span className="hidden sm:inline">Meus agendamentos</span>
              {bookingsCount > 0 && (
                <span className="grid h-5 min-w-5 place-items-center rounded-full bg-gold-500 px-1 text-[10px] font-bold text-ink-950">
                  {bookingsCount}
                </span>
              )}
            </button>

            <button
              onClick={onOpenAdmin}
              className="hidden items-center gap-2 rounded-full border border-cream-100/15 bg-cream-100/5 px-3.5 py-2 text-xs font-semibold text-cream-100 transition-all hover:border-gold-400/60 hover:text-gold-300 md:inline-flex"
            >
              <Settings2 className="h-4 w-4" />
              Painel
            </button>

            <a
              href={`https://wa.me/${AGENT.whatsapp}`}
              target="_blank"
              rel="noreferrer"
              className="hidden items-center gap-2 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-bold text-ink-950 transition-all hover:-translate-y-0.5 hover:bg-gold-400 hover:shadow-[0_12px_32px_-10px_rgba(201,160,69,0.6)] md:inline-flex"
            >
              <MessageCircle className="h-4 w-4" />
              Falar comigo
            </a>

            <button
              onClick={() => setOpen(true)}
              className="grid h-11 w-11 place-items-center rounded-full border border-cream-100/15 text-cream-100 lg:hidden"
              aria-label="Abrir menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-50 bg-ink-950/70 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 260 }}
              className="fixed right-0 top-0 z-50 flex h-full w-[86%] max-w-sm flex-col border-l border-cream-100/10 bg-ink-900 p-6 lg:hidden"
            >
              <div className="flex items-center justify-between">
                <span className="font-display text-lg text-cream-50">Menu</span>
                <button
                  onClick={() => setOpen(false)}
                  className="grid h-10 w-10 place-items-center rounded-full border border-cream-100/15"
                  aria-label="Fechar menu"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <nav className="mt-10 flex flex-col gap-1">
                {links.map((l, i) => (
                  <motion.button
                    key={l.id}
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.08 + i * 0.06 }}
                    onClick={() => go(l.id)}
                    className="rounded-2xl px-4 py-4 text-left font-display text-2xl text-cream-100 transition-colors hover:bg-cream-100/5 hover:text-gold-300"
                  >
                    {l.label}
                  </motion.button>
                ))}
                <motion.button
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.32 }}
                  onClick={() => {
                    setOpen(false);
                    setTimeout(onOpenBookings, 60);
                  }}
                  className="flex items-center justify-between rounded-2xl px-4 py-4 text-left font-display text-2xl text-cream-100 hover:bg-cream-100/5 hover:text-gold-300"
                >
                  Agendamentos
                  {bookingsCount > 0 && (
                    <span className="grid h-6 min-w-6 place-items-center rounded-full bg-gold-500 px-1.5 text-xs font-bold text-ink-950">
                      {bookingsCount}
                    </span>
                  )}
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, x: 24 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.38 }}
                  onClick={() => {
                    setOpen(false);
                    onOpenAdmin();
                  }}
                  className="flex items-center justify-between rounded-2xl px-4 py-4 text-left font-display text-2xl text-cream-100 hover:bg-cream-100/5 hover:text-gold-300"
                >
                  Painel
                  <Settings2 className="h-5 w-5" />
                </motion.button>
              </nav>

              <div className="mt-auto space-y-3">
                <a
                  href={`https://wa.me/${AGENT.whatsapp}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-center gap-2 rounded-full bg-gold-500 px-5 py-3.5 text-sm font-bold text-ink-950"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp direto
                </a>
                <div className="flex items-center justify-center gap-4 pt-2 text-cream-500">
                  <a href={`tel:${AGENT.phone.replace(/\D/g, "")}`} aria-label="Ligar">
                    <Phone className="h-5 w-5 hover:text-gold-300" />
                  </a>
                  <a href={instagramUrl(AGENT.instagram)} target="_blank" rel="noreferrer" aria-label="Instagram">
                    <Instagram className="h-5 w-5 hover:text-gold-300" />
                  </a>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
