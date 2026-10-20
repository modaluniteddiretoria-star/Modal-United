import { useEffect, useRef } from "react";
import { animate, useInView } from "framer-motion";
import { Award, CircleDollarSign, KeyRound, Users } from "lucide-react";
import { useSiteData } from "../lib/data";
import { Reveal } from "./Shared";

function Counter({ to, prefix = "", suffix = "" }: { to: number; prefix?: string; suffix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(0, to, {
      duration: 2,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (v) => {
        if (ref.current) {
          ref.current.textContent = `${prefix}${Math.round(v).toLocaleString("pt-BR")}${suffix}`;
        }
      },
    });
    return () => controls.stop();
  }, [inView, to, prefix, suffix]);

  return <span ref={ref}>{`${prefix}0${suffix}`}</span>;
}

const ICONS = [KeyRound, Award, CircleDollarSign, Users];

// "R$ 480M+" -> { prefix: "R$ ", number: 480, suffix: "M+" } para animar só o número
function splitValue(value: string) {
  const m = value.match(/^(\D*?)(\d+(?:[.,]\d+)?)(.*)$/);
  if (!m) return null;
  const n = Number(m[2].replace(/\./g, "").replace(",", "."));
  return Number.isFinite(n) && Number.isInteger(n) ? { prefix: m[1], number: n, suffix: m[3] } : null;
}

export function Stats() {
  const { content } = useSiteData();
  const stats = content.stats;
  if (stats.length === 0) return null;

  return (
    <section className="relative overflow-hidden border-y border-cream-100/10 bg-ink-900">
      <div className="pointer-events-none absolute -right-32 -top-24 h-96 w-96 rounded-full bg-gold-500/[0.07] blur-3xl" />
      <div
        className={`mx-auto grid max-w-7xl grid-cols-2 gap-x-4 gap-y-10 px-4 py-16 sm:px-6 lg:px-8 lg:py-20 ${
          stats.length >= 4 ? "lg:grid-cols-4" : stats.length === 3 ? "lg:grid-cols-3" : ""
        }`}
      >
        {stats.map((s, i) => {
          const Icon = ICONS[i % ICONS.length];
          const parts = splitValue(s.value);
          return (
            <Reveal key={`${s.label}-${i}`} delay={i * 0.1} className="text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl border border-gold-500/25 bg-gold-500/10 text-gold-400">
                <Icon className="h-6 w-6" />
              </div>
              <p className="mt-4 font-display text-4xl text-cream-50 lg:text-5xl">
                {parts ? <Counter to={parts.number} prefix={parts.prefix} suffix={parts.suffix} /> : s.value}
              </p>
              <p className="mt-2 text-[11px] font-semibold uppercase tracking-[0.24em] text-cream-500">
                {s.label}
              </p>
            </Reveal>
          );
        })}
      </div>
    </section>
  );
}
