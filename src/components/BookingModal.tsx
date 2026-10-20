import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  Check,
  Clock,
  MapPin,
  MessageCircle,
  X,
} from "lucide-react";
import type { Booking, Property } from "../lib/types";
import { useSiteData } from "../lib/data";
import { createBooking, fetchTakenSlots } from "../lib/bookings";
import { Turnstile, type TurnstileHandle } from "./Turnstile";
import {
  TIME_SLOTS,
  brl,
  fmtDateLocal,
  formatDisplayDate,
  isSlotPast,
  maskPhone,
  nextDays,
  weekdayShort,
} from "../lib/helpers";

const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function BookingModal({
  property,
  onClose,
  onCreate,
  onViewAll,
}: {
  property: Property | null;
  onClose: () => void;
  onCreate: (b: Booking) => void;
  onViewAll: () => void;
}) {
  const { agent: AGENT } = useSiteData();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<{ name?: string; phone?: string }>({});
  const [created, setCreated] = useState<Booking | null>(null);
  const [taken, setTaken] = useState<Set<string>>(() => new Set());
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [captchaFailed, setCaptchaFailed] = useState(false);
  const captchaRef = useRef<TurnstileHandle>(null);
  const handleCaptchaError = useCallback(() => setCaptchaFailed(true), []);

  const days = useMemo(() => nextDays(21), []);

  // Reset sempre que abrir para outro imóvel
  const [prevPropertyId, setPrevPropertyId] = useState(property?.id);
  if (property?.id !== prevPropertyId) {
    setPrevPropertyId(property?.id);
    setStep(1);
    setDate(null);
    setTime(null);
    setCreated(null);
    setErrors({});
    setTaken(new Set());
    setSubmitError("");
    setCaptchaToken(null);
    setCaptchaFailed(false);
  }

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

  const refreshTaken = useCallback(async () => {
    if (!property) return;
    try {
      const from = fmtDateLocal(days[0]);
      const to = fmtDateLocal(days[days.length - 1]);
      setTaken(await fetchTakenSlots(property.id, from, to));
    } catch {
      // sem conexão: mantém a lista atual; o servidor valida na confirmação
    }
  }, [property, days]);

  useEffect(() => {
    if (!property) return;
    let active = true;
    fetchTakenSlots(property.id, fmtDateLocal(days[0]), fmtDateLocal(days[days.length - 1]))
      .then((set) => {
        if (active) setTaken(set);
      })
      .catch(() => {
        // sem conexão: o servidor valida na confirmação
      });
    return () => {
      active = false;
    };
  }, [property, days]);

  const slotDisabled = (t: string) => (date ? isSlotPast(date, t) || taken.has(`${date}|${t}`) : false);

  const submit = async () => {
    if (!property || !date || !time || submitting) return;
    if (!captchaToken) {
      setSubmitError(
        captchaFailed
          ? "Não foi possível carregar a verificação anti-robô. Recarregue a página ou fale pelo WhatsApp."
          : "Aguarde a verificação de segurança terminar e tente de novo."
      );
      return;
    }
    const errs: typeof errors = {};
    if (name.trim().length < 3) errs.name = "Informe seu nome completo.";
    if (phone.replace(/\D/g, "").length < 10)
      errs.phone = "Informe um WhatsApp válido com DDD.";
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitting(true);
    setSubmitError("");
    try {
      const booking = await createBooking({
        propertyId: property.id,
        date,
        time,
        name: name.trim(),
        phone,
        email: email.trim() || undefined,
        note: note.trim() || undefined,
      }, captchaToken);
      onCreate(booking);
      setCreated(booking);
      setStep(3);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : "Não foi possível agendar. Tente novamente.");
      captchaRef.current?.reset(); // tokens do Turnstile valem uma vez só
      void refreshTaken();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {property && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-end justify-center bg-ink-950/80 backdrop-blur-sm sm:items-center sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label={`Agendar visita - ${property.title}`}
        >
          <motion.div
            initial={{ opacity: 0, y: 70, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.98 }}
            transition={{ type: "spring", damping: 28, stiffness: 300 }}
            onClick={(e) => e.stopPropagation()}
            className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl border border-cream-100/10 bg-ink-900 shadow-2xl sm:rounded-3xl"
          >
            {/* Header */}
            <div className="flex items-center gap-4 border-b border-cream-100/10 p-5">
              <img
                src={property.image}
                alt=""
                className="h-14 w-14 shrink-0 rounded-2xl object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-gold-400">
                  Agendar visita
                </p>
                <h3 className="truncate font-display text-lg text-cream-50">{property.title}</h3>
                <p className="flex items-center gap-1 text-xs text-cream-300">
                  <MapPin className="h-3 w-3 text-gold-400" />
                  {property.location}, {property.city} · <span className="text-gold-300">{brl(property.price)}</span>
                </p>
              </div>
              <button
                onClick={onClose}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full border border-cream-100/15 text-cream-100 transition-colors hover:border-gold-400/60 hover:text-gold-300"
                aria-label="Fechar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Steps indicator */}
            <div className="flex items-center gap-2 px-5 pt-4">
              {["Data e horário", "Seus dados", "Confirmação"].map((s, i) => {
                const n = i + 1;
                const active = step === n;
                const done = step > n;
                return (
                  <div key={s} className="flex flex-1 items-center gap-2">
                    <span
                      className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold transition-colors ${
                        done
                          ? "bg-gold-500 text-ink-950"
                          : active
                            ? "border border-gold-400 text-gold-300"
                            : "border border-cream-100/15 text-cream-500"
                      }`}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : n}
                    </span>
                    <span
                      className={`hidden text-[11px] font-semibold uppercase tracking-wider sm:block ${
                        active || done ? "text-cream-100" : "text-cream-500"
                      }`}
                    >
                      {s}
                    </span>
                    {n < 3 && <span className="h-px flex-1 bg-cream-100/10" />}
                  </div>
                );
              })}
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6">
              <AnimatePresence mode="wait">
                {step === 1 && (
                  <motion.div
                    key="step-1"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.35, ease }}
                  >
                    <p className="mb-3 flex items-center gap-2 text-sm font-semibold text-cream-100">
                      <CalendarDays className="h-4 w-4 text-gold-400" />
                      Escolha o dia da visita
                    </p>
                    <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                      {days.map((d) => {
                        const iso = fmtDateLocal(d);
                        const sunday = d.getDay() === 0;
                        const active = date === iso;
                        return (
                          <button
                            key={iso}
                            disabled={sunday}
                            onClick={() => {
                              setDate(iso);
                              setTime(null);
                            }}
                            className={`w-[68px] shrink-0 rounded-2xl border px-2 py-3 text-center transition-all ${
                              sunday
                                ? "cursor-not-allowed border-cream-100/5 opacity-35"
                                : active
                                  ? "border-gold-500 bg-gold-500 text-ink-950 shadow-[0_8px_24px_-8px_rgba(201,160,69,0.7)]"
                                  : "border-cream-100/12 text-cream-100 hover:border-gold-400/50 hover:text-gold-300"
                            }`}
                            title={sunday ? "Fechado aos domingos" : undefined}
                          >
                            <span
                              className={`block text-[10px] font-bold uppercase tracking-widest ${
                                active ? "text-ink-950/70" : "text-gold-400"
                              }`}
                            >
                              {sunday ? "Fechado" : weekdayShort(d)}
                            </span>
                            <span className="block font-display text-2xl leading-tight">
                              {d.getDate()}
                            </span>
                            <span
                              className={`block text-[10px] uppercase ${
                                active ? "text-ink-950/70" : "text-cream-500"
                              }`}
                            >
                              {d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    <p className="mb-3 mt-6 flex items-center gap-2 text-sm font-semibold text-cream-100">
                      <Clock className="h-4 w-4 text-gold-400" />
                      {date ? "Horários disponíveis" : "Escolha um dia para ver os horários"}
                    </p>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                      {TIME_SLOTS.map((t) => {
                        const disabled = !date || slotDisabled(t);
                        const active = time === t;
                        return (
                          <button
                            key={t}
                            disabled={disabled}
                            onClick={() => setTime(t)}
                            className={`rounded-xl border py-2.5 text-sm font-semibold transition-all ${
                              disabled
                                ? "cursor-not-allowed border-cream-100/5 text-cream-500/40 line-through"
                                : active
                                  ? "border-gold-500 bg-gold-500 text-ink-950 shadow-[0_8px_24px_-8px_rgba(201,160,69,0.7)]"
                                  : "border-cream-100/12 text-cream-100 hover:border-gold-400/50 hover:text-gold-300"
                            }`}
                          >
                            {t}
                          </button>
                        );
                      })}
                    </div>
                    <p className="mt-4 text-xs text-cream-500">
                      · Visitas de segunda a sábado, das 9h às 18h · duração média de 45 min · a
                      corretora encontra você no local.
                    </p>
                  </motion.div>
                )}

                {step === 2 && (
                  <motion.div
                    key="step-2"
                    initial={{ opacity: 0, x: 24 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -24 }}
                    transition={{ duration: 0.35, ease }}
                    className="space-y-4"
                  >
                    <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gold-500/25 bg-gold-500/[0.07] px-4 py-3 text-sm text-cream-100">
                      <CalendarDays className="h-4 w-4 shrink-0 text-gold-400" />
                      <span className="capitalize">{date ? formatDisplayDate(date) : ""}</span>
                      <span className="text-cream-500">às</span>
                      <span className="font-bold text-gold-300">{time}</span>
                    </div>

                    <div>
                      <label htmlFor="bk-name" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-cream-300">
                        Nome completo *
                      </label>
                      <input
                        id="bk-name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Ex.: Ana Carolina Souza"
                        className={`w-full rounded-2xl border bg-ink-800/70 px-4 py-3.5 text-sm text-cream-100 placeholder:text-cream-500/60 focus:outline-none focus:ring-2 ${
                          errors.name
                            ? "border-red-400/60 focus:ring-red-400/30"
                            : "border-cream-100/12 focus:border-gold-400/60 focus:ring-gold-500/20"
                        }`}
                      />
                      {errors.name && <p className="mt-1.5 text-xs text-red-300">{errors.name}</p>}
                    </div>

                    <div>
                      <label htmlFor="bk-phone" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-cream-300">
                        WhatsApp *
                      </label>
                      <input
                        id="bk-phone"
                        value={phone}
                        onChange={(e) => setPhone(maskPhone(e.target.value))}
                        placeholder="(11) 99999-0000"
                        inputMode="tel"
                        className={`w-full rounded-2xl border bg-ink-800/70 px-4 py-3.5 text-sm text-cream-100 placeholder:text-cream-500/60 focus:outline-none focus:ring-2 ${
                          errors.phone
                            ? "border-red-400/60 focus:ring-red-400/30"
                            : "border-cream-100/12 focus:border-gold-400/60 focus:ring-gold-500/20"
                        }`}
                      />
                      {errors.phone && <p className="mt-1.5 text-xs text-red-300">{errors.phone}</p>}
                    </div>

                    <div>
                      <label htmlFor="bk-email" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-cream-300">
                        E-mail <span className="font-normal text-cream-500">(opcional)</span>
                      </label>
                      <input
                        id="bk-email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="voce@email.com"
                        className="w-full rounded-2xl border border-cream-100/12 bg-ink-800/70 px-4 py-3.5 text-sm text-cream-100 placeholder:text-cream-500/60 focus:border-gold-400/60 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      />
                    </div>

                    <div>
                      <label htmlFor="bk-note" className="mb-1.5 block text-xs font-bold uppercase tracking-widest text-cream-300">
                        Observações <span className="font-normal text-cream-500">(opcional)</span>
                      </label>
                      <textarea
                        id="bk-note"
                        value={note}
                        onChange={(e) => setNote(e.target.value.slice(0, 220))}
                        placeholder="Ex.: Vou com meu esposo, temos interesse em permuta..."
                        rows={3}
                        className="w-full resize-none rounded-2xl border border-cream-100/12 bg-ink-800/70 px-4 py-3.5 text-sm text-cream-100 placeholder:text-cream-500/60 focus:border-gold-400/60 focus:outline-none focus:ring-2 focus:ring-gold-500/20"
                      />
                    </div>
                  </motion.div>
                )}

                {step === 3 && created && (
                  <motion.div
                    key="step-3"
                    initial={{ opacity: 0, scale: 0.94 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4, ease }}
                    className="flex flex-col items-center py-4 text-center"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", damping: 12, stiffness: 220, delay: 0.1 }}
                      className="grid h-20 w-20 place-items-center rounded-full bg-gradient-to-tr from-gold-600 to-gold-400 shadow-[0_16px_48px_-12px_rgba(201,160,69,0.7)]"
                    >
                      <Check className="h-9 w-9 text-ink-950" strokeWidth={3} />
                    </motion.div>
                    <h3 className="mt-5 font-display text-2xl text-cream-50">
                      Visita agendada com sucesso!
                    </h3>
                    <p className="mt-2 max-w-sm text-sm leading-relaxed text-cream-300">
                      {created.name.split(" ")[0]}, sua visita está confirmada. A Maia entrará em
                      contato pelo WhatsApp para alinhar os detalhes do encontro.
                    </p>

                    <div className="mt-6 w-full rounded-2xl border border-cream-100/10 bg-ink-800/70 p-4 text-left">
                      <div className="flex items-center gap-3">
                        <img src={property.image} alt="" className="h-16 w-16 rounded-xl object-cover" />
                        <div className="min-w-0">
                          <p className="truncate font-display text-base text-cream-50">{property.title}</p>
                          <p className="flex items-center gap-1 text-xs capitalize text-cream-300">
                            <CalendarDays className="h-3.5 w-3.5 text-gold-400" />
                            {formatDisplayDate(created.date)}
                          </p>
                          <p className="flex items-center gap-1 text-xs text-cream-300">
                            <Clock className="h-3.5 w-3.5 text-gold-400" />
                            {created.time} · duração ~45 min
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-cream-100/10 pt-3">
                        <span className="text-[11px] uppercase tracking-widest text-cream-500">
                          Código da visita
                        </span>
                        <span className="rounded-full bg-gold-500/15 px-3 py-1 font-mono text-xs font-bold tracking-wider text-gold-300">
                          {created.code}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Footer actions */}
            <div className="border-t border-cream-100/10 p-5">
              {step === 1 && (
                <div className="flex justify-end">
                  <button
                    disabled={!date || !time}
                    onClick={() => setStep(2)}
                    className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-7 py-3.5 text-sm font-bold text-ink-950 transition-all hover:bg-gold-400 hover:shadow-[0_12px_32px_-10px_rgba(201,160,69,0.6)] disabled:cursor-not-allowed disabled:opacity-35"
                  >
                    Continuar
                    <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              )}
              {step === 2 && (
                <div className="flex items-center justify-between gap-3">
                  <button
                    onClick={() => setStep(1)}
                    className="inline-flex items-center gap-2 rounded-full border border-cream-100/15 px-5 py-3.5 text-sm font-semibold text-cream-100 transition-colors hover:border-gold-400/60 hover:text-gold-300"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </button>
                  <button
                    onClick={() => void submit()}
                    disabled={submitting}
                    className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-6 py-3.5 text-sm font-bold text-ink-950 transition-all hover:bg-gold-400 hover:shadow-[0_12px_32px_-10px_rgba(201,160,69,0.6)] active:scale-[0.98] disabled:cursor-wait disabled:opacity-60"
                  >
                    <Check className="h-4 w-4" />
                    {submitting ? "Agendando..." : "Confirmar agendamento"}
                  </button>
                </div>
              )}
              {step === 2 && <Turnstile ref={captchaRef} onToken={setCaptchaToken} onError={handleCaptchaError} />}
              {step === 2 && submitError && (
                <p role="alert" className="mt-3 text-right text-sm text-red-300">
                  {submitError}
                </p>
              )}
              {step === 3 && (
                <div className="flex flex-col gap-2 sm:flex-row sm:justify-between">
                  <a
                    href={`https://wa.me/${AGENT.whatsapp}?text=${encodeURIComponent(
                      `Olá Maia! Acabei de agendar uma visita (${created?.code}) para o imóvel "${property.title}".`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center gap-2 rounded-full border border-emerald-400/40 px-6 py-3.5 text-sm font-bold text-emerald-300 transition-colors hover:bg-emerald-400/10"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Avisar no WhatsApp
                  </a>
                  <button
                    onClick={() => {
                      onClose();
                      onViewAll();
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-full bg-gold-500 px-6 py-3.5 text-sm font-bold text-ink-950 transition-all hover:bg-gold-400"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Ver meus agendamentos
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
