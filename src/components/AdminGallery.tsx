import { useState } from "react";
import { ChevronLeft, ChevronRight, ImagePlus, Star, X } from "lucide-react";

const MAX_PHOTOS = 20;

// Galeria do imóvel no painel: capa + fotos extras (enviar várias, reordenar, remover, virar capa)
export function AdminGallery({
  cover,
  gallery,
  onChange,
  upload,
}: {
  cover: string;
  gallery: string[];
  onChange: (next: { image: string; gallery: string[] }) => void;
  upload: (file: File) => Promise<string | null>;
}) {
  const [busy, setBusy] = useState(0);

  const addFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const room = MAX_PHOTOS - gallery.length;
    const list = Array.from(files).slice(0, Math.max(0, room));
    setBusy(list.length);
    const added: string[] = [];
    for (const file of list) {
      const url = await upload(file);
      if (url) added.push(url);
      setBusy((n) => n - 1);
    }
    if (added.length > 0) onChange({ image: cover, gallery: [...gallery, ...added] });
  };

  const move = (i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= gallery.length) return;
    const next = [...gallery];
    [next[i], next[j]] = [next[j], next[i]];
    onChange({ image: cover, gallery: next });
  };

  const remove = (i: number) => onChange({ image: cover, gallery: gallery.filter((_, k) => k !== i) });

  // A foto escolhida vira capa e a capa antiga volta para a galeria
  const makeCover = (i: number) => {
    const next = [...gallery];
    const [chosen] = next.splice(i, 1, cover);
    onChange({ image: chosen, gallery: next });
  };

  return (
    <div className="mt-4 rounded-2xl border border-cream-100/10 bg-ink-900/60 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-semibold text-cream-200">
          Galeria <span className="font-normal text-cream-500">({gallery.length}/{MAX_PHOTOS} fotos extras)</span>
        </p>
        <label
          className={`inline-flex cursor-pointer items-center gap-2 rounded-full border border-gold-500/50 px-3 py-1.5 text-xs font-bold text-gold-300 transition hover:bg-gold-500/10 ${
            gallery.length >= MAX_PHOTOS ? "pointer-events-none opacity-40" : ""
          }`}
        >
          <ImagePlus className="h-4 w-4" />
          {busy > 0 ? `Enviando ${busy}…` : "Adicionar fotos"}
          <input
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={(e) => {
              void addFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>

      {gallery.length === 0 ? (
        <p className="text-xs text-cream-500">
          Nenhuma foto extra. Adicione fotos dos ambientes: elas aparecem no carrossel dos detalhes do imóvel.
        </p>
      ) : (
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-6">
          {gallery.map((url, i) => (
            <li key={`${url}-${i}`} className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-cream-100/10">
              <img src={url} alt={`Foto ${i + 1}`} className="h-full w-full object-cover" />
              <span className="absolute left-1.5 top-1.5 rounded-md bg-ink-950/70 px-1.5 text-[10px] font-bold text-cream-100">
                {i + 1}
              </span>
              <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-ink-950/90 to-transparent p-1 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => move(i, -1)}
                    disabled={i === 0}
                    className="grid h-6 w-6 place-items-center rounded-md bg-ink-950/80 text-cream-100 disabled:opacity-30"
                    aria-label="Mover para a esquerda"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(i, 1)}
                    disabled={i === gallery.length - 1}
                    className="grid h-6 w-6 place-items-center rounded-md bg-ink-950/80 text-cream-100 disabled:opacity-30"
                    aria-label="Mover para a direita"
                  >
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
                <div className="flex gap-1">
                  <button
                    type="button"
                    onClick={() => makeCover(i)}
                    className="grid h-6 w-6 place-items-center rounded-md bg-ink-950/80 text-gold-300"
                    aria-label="Usar como capa"
                    title="Usar como capa"
                  >
                    <Star className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => remove(i)}
                    className="grid h-6 w-6 place-items-center rounded-md bg-red-500/80 text-white"
                    aria-label="Remover foto"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
