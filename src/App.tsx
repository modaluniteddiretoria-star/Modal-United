import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, MessageCircle, XCircle } from "lucide-react";
import type { Booking, Property } from "./lib/types";
import { loadSiteData, useSiteData } from "./lib/data";
import { cancelBookingRemote, loadBookings, saveBookings } from "./lib/bookings";
import { scrollToId } from "./lib/helpers";
import { Navbar } from "./components/Navbar";
import { Hero } from "./components/Hero";
import { Marquee } from "./components/Marquee";
import { Properties } from "./components/Properties";
import { Stats } from "./components/Stats";
import { About } from "./components/About";
import { Testimonials } from "./components/Testimonials";
import { MyBookings } from "./components/MyBookings";
import { CtaBanner } from "./components/CtaBanner";
import { Footer } from "./components/Footer";
import { PropertyModal } from "./components/PropertyModal";
import { BookingModal } from "./components/BookingModal";
import { AdminDashboard } from "./components/AdminDashboard";

interface Toast {
  id: number;
  title: string;
  description?: string;
  tone: "success" | "error";
}

export default function App() {
  const [bookings, setBookings] = useState<Booking[]>(() => loadBookings());
  const [detail, setDetail] = useState<Property | null>(null);
  const [bookingFor, setBookingFor] = useState<Property | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [adminOpen, setAdminOpen] = useState(false);

  const { agent: AGENT, properties: PROPERTIES } = useSiteData();

  useEffect(() => {
    void loadSiteData();
  }, []);

  const pushToast = useCallback(
    (title: string, description?: string, tone: Toast["tone"] = "success") => {
      const id = Date.now() + Math.random();
      setToasts((t) => [...t.slice(-2), { id, title, description, tone }]);
      window.setTimeout(() => {
        setToasts((t) => t.filter((x) => x.id !== id));
      }, 4600);
    },
    []
  );

  const openBooking = useCallback((p: Property) => {
    setDetail(null);
    setBookingFor(p);
  }, []);

  const openBookingById = useCallback(
    (id: string) => {
      const p = PROPERTIES.find((x) => x.id === id);
      if (p) openBooking(p);
    },
    [PROPERTIES, openBooking]
  );

  const addBooking = useCallback((b: Booking) => {
    setBookings((prev) => {
      const next = [...prev, b];
      saveBookings(next);
      return next;
    });
  }, []);

  const cancelBooking = useCallback(
    async (id: string) => {
      const booking = bookings.find((b) => b.id === id);
      if (!booking) return;
      try {
        await cancelBookingRemote(booking);
      } catch {
        pushToast("Não foi possível cancelar", "Verifique sua conexão e tente novamente.", "error");
        return;
      }
      setBookings((prev) => {
        const next = prev.filter((b) => b.id !== id);
        saveBookings(next);
        return next;
      });
      pushToast("Visita cancelada", "O horário foi liberado para outros clientes.", "error");
    },
    [bookings, pushToast]
  );

  const goBookings = useCallback(() => scrollToId("agendamentos"), []);

  return (
    <div className="relative min-h-screen overflow-x-clip bg-ink-950 font-sans text-cream-100">
      {/* ambient glow */}
      <div className="pointer-events-none fixed -top-40 left-1/2 z-0 h-[480px] w-[720px] -translate-x-1/2 rounded-full bg-gold-500/[0.05] blur-3xl" />

      <Navbar
        bookingsCount={bookings.length}
        onOpenBookings={goBookings}
        onOpenAdmin={() => setAdminOpen(true)}
      />

      <main className="relative z-10">
        <Hero onSchedule={openBookingById} />
        <Marquee />
        <Properties onDetails={setDetail} onSchedule={openBooking} />
        <Stats />
        <About />
        <Testimonials />
        <MyBookings
          bookings={bookings}
          onCancel={cancelBooking}
          onExplore={() => scrollToId("imoveis")}
        />
        <CtaBanner />
      </main>

      <Footer />

      {/* Modais */}
      <PropertyModal property={detail} onClose={() => setDetail(null)} onSchedule={openBooking} />
      <BookingModal
        property={bookingFor}
        onClose={() => setBookingFor(null)}
        onCreate={addBooking}
        onViewAll={goBookings}
      />
      <AdminDashboard open={adminOpen} onClose={() => setAdminOpen(false)} />

      {/* Toasts */}
      <div className="pointer-events-none fixed inset-x-0 bottom-24 z-[70] flex flex-col items-center gap-2 px-4 sm:bottom-8">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: 24, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.95 }}
              transition={{ type: "spring", damping: 24, stiffness: 320 }}
              className="pointer-events-auto flex w-full max-w-sm items-center gap-3 rounded-2xl border border-cream-100/10 bg-ink-800/95 px-4 py-3.5 shadow-2xl backdrop-blur-xl"
              role="status"
            >
              {t.tone === "success" ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-gold-400" />
              ) : (
                <XCircle className="h-5 w-5 shrink-0 text-red-300" />
              )}
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-cream-50">{t.title}</p>
                {t.description && (
                  <p className="truncate text-xs text-cream-300">{t.description}</p>
                )}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* WhatsApp flutuante */}
      <motion.a
        initial={{ opacity: 0, scale: 0 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.6, type: "spring", damping: 14 }}
        href={`https://wa.me/${AGENT.whatsapp}?text=${encodeURIComponent(
          "Olá Maia! Vim pelo seu site e quero conversar sobre um imóvel."
        )}`}
        target="_blank"
        rel="noreferrer"
        aria-label="Falar com a Maia no WhatsApp"
        className="group fixed bottom-5 right-5 z-40 flex items-center gap-3 rounded-full bg-emerald-500 p-4 text-ink-950 shadow-[0_16px_40px_-10px_rgba(16,185,129,0.55)] transition-all hover:scale-105 hover:bg-emerald-400 sm:bottom-8 sm:right-8"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="max-w-0 overflow-hidden text-sm font-bold transition-all duration-300 group-hover:max-w-[160px] group-hover:pr-1">
          Falar com a Maia
        </span>
        <span className="absolute -right-0.5 -top-0.5 h-3.5 w-3.5 animate-pulse-soft rounded-full border-2 border-ink-950 bg-gold-400" />
      </motion.a>
    </div>
  );
}
