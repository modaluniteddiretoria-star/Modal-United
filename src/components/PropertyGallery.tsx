import { useCallback, useEffect, useState, type ReactNode } from "react";
import { AnimatePresence, motion, useReducedMotion, type PanInfo } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SWIPE_PX = 60;

// Moldura desliza num sentido e a foto no outro: efeito parallax na troca
const frame = {
  enter: (dir: number) => ({ x: dir > 0 ? "100%" : "-100%" }),
  center: { x: "0%" },
  exit: (dir: number) => ({ x: dir > 0 ? "-100%" : "100%" }),
};
const photo = {
  enter: (dir: number) => ({ x: dir > 0 ? "-35%" : "35%", scale: 1.15 }),
  center: { x: "0%", scale: 1.03 },
  exit: (dir: number) => ({ x: dir > 0 ? "35%" : "-35%", scale: 1.15 }),
};
const fade = { enter: { opacity: 0 }, center: { opacity: 1 }, exit: { opacity: 0 } };

export function PropertyGallery({
  images,
  title,
  children,
}: {
  images: string[];
  title: string;
  children?: ReactNode; // elementos sobrepostos (selo, fechar, título)
}) {
  const [[index, dir], setState] = useState<[number, number]>([0, 0]);
  const reduce = useReducedMotion();
  const total = images.length;

  const go = useCallback(
    (step: number) => setState(([i]) => [(i + step + total) % total, step]),
    [total]
  );
  const jump = (to: number) => setState(([i]) => [to, to >= i ? 1 : -1]);

  useEffect(() => {
    if (total < 2) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, total]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -SWIPE_PX) go(1);
    else if (info.offset.x > SWIPE_PX) go(-1);
  };

  const ease: [number, number, number, number] = [0.22, 1, 0.36, 1];
  const transition = reduce ? { duration: 0.2 } : { duration: 0.75, ease };

  return (
    <>
      <div className="relative h-64 sm:h-80">
        <div className="absolute inset-0 overflow-hidden bg-ink-950">
          <AnimatePresence initial={false} custom={dir}>
            <motion.div
              key={index}
              custom={dir}
              variants={reduce ? fade : frame}
              initial="enter"
              animate="center"
              exit="exit"
              transition={transition}
              drag={total > 1 ? "x" : false}
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.2}
              onDragEnd={onDragEnd}
              className="absolute inset-0 cursor-grab overflow-hidden active:cursor-grabbing"
            >
              <motion.img
                custom={dir}
                variants={reduce ? undefined : photo}
                initial="enter"
                animate="center"
                exit="exit"
                transition={transition}
                src={images[index]}
                alt={`${title} — foto ${index + 1} de ${total}`}
                draggable={false}
                className="h-full w-full select-none object-cover"
              />
            </motion.div>
          </AnimatePresence>
        </div>

        {total > 1 && (
          <>
            <button
              onClick={() => go(-1)}
              className="absolute left-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-ink-950/55 text-cream-100 backdrop-blur transition hover:bg-ink-950"
              aria-label="Foto anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={() => go(1)}
              className="absolute right-3 top-1/2 z-10 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-ink-950/55 text-cream-100 backdrop-blur transition hover:bg-ink-950"
              aria-label="Próxima foto"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <span className="absolute right-16 top-5 z-10 rounded-full bg-ink-950/60 px-2.5 py-1 text-[11px] font-bold text-cream-100 backdrop-blur">
              {index + 1} / {total}
            </span>
          </>
        )}

        {children}
      </div>

      {total > 1 && (
        <div className="flex gap-2 overflow-x-auto px-5 pt-4 [scrollbar-width:none] sm:px-7">
          {images.map((src, i) => (
            <button
              key={`${src}-${i}`}
              onClick={() => jump(i)}
              className={`relative h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                i === index ? "border-gold-400" : "border-transparent opacity-60 hover:opacity-100"
              }`}
              aria-label={`Ver foto ${i + 1}`}
              aria-current={i === index}
            >
              <img src={src} alt="" loading="lazy" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </>
  );
}
