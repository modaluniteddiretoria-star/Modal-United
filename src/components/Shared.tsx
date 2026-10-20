import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function Reveal({
  children,
  delay = 0,
  y = 28,
  className,
}: {
  children: ReactNode;
  delay?: number;
  y?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.75, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
}: {
  eyebrow: string;
  title: ReactNode;
  description?: string;
  align?: "left" | "center";
}) {
  return (
    <Reveal
      className={
        align === "center"
          ? "mx-auto max-w-2xl text-center"
          : "max-w-2xl text-left"
      }
    >
      <p className="mb-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.28em] text-gold-400 sm:text-xs">
        <span className="h-px w-8 bg-gold-500/70" />
        {eyebrow}
      </p>
      <h2 className="font-brand text-2xl leading-snug text-cream-50 sm:text-3xl lg:text-[2.6rem] lg:leading-[1.2]">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-sm leading-relaxed text-cream-300/90 sm:text-base">
          {description}
        </p>
      )}
    </Reveal>
  );
}

export function GoldButton({
  children,
  onClick,
  className = "",
  variant = "solid",
  type = "button",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  className?: string;
  variant?: "solid" | "outline" | "ghost";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  const base =
    "group inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-semibold transition-all duration-300 will-change-transform focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-400 disabled:cursor-not-allowed disabled:opacity-40";
  const styles = {
    solid:
      "bg-gold-500 text-ink-950 hover:bg-gold-400 hover:shadow-[0_12px_40px_-10px_rgba(201,160,69,0.55)] hover:-translate-y-0.5 active:translate-y-0",
    outline:
      "border border-cream-100/25 bg-cream-100/5 text-cream-100 backdrop-blur hover:border-gold-400/60 hover:text-gold-300 hover:bg-cream-100/10",
    ghost: "text-cream-100 hover:text-gold-300 px-2 py-1",
  } as const;
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${styles[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
}
