import { Sparkle } from "lucide-react";

const ITEMS = [
  "Comprar",
  "Vender",
  "Avaliar",
  "Investir",
  "Alto padrão",
  "Curadoria exclusiva",
];

function Row() {
  return (
    <div className="flex shrink-0 items-center">
      {ITEMS.map((item) => (
        <span key={item} className="flex shrink-0 items-center">
          <span className="px-8 font-display text-base uppercase tracking-[0.3em] text-cream-300/80 sm:text-lg">
            {item}
          </span>
          <Sparkle className="h-3.5 w-3.5 shrink-0 text-gold-500" />
        </span>
      ))}
    </div>
  );
}

export function Marquee() {
  return (
    <div className="relative overflow-hidden border-y border-cream-100/10 bg-ink-900 py-5">
      <div className="flex w-max animate-marquee">
        <Row />
        <Row />
      </div>
    </div>
  );
}
