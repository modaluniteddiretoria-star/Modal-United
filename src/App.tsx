import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { CheckCircle2, XCircle } from "lucide-react";
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
import { PrivacyPolicy } from "./components/PrivacyPolicy";
import { ChatWidget } from "./components/ChatWidget";

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

  const { properties: PROPERTIES } = useSiteData();

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
      <PrivacyPolicy />

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

      {/* Chat (ao vivo quando a corretora está no painel; bot quando offline) */}
      <ChatWidget />
    </div>
  );
}
