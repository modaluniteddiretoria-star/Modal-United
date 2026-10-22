import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Copy, ImagePlus, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import type { Property, PropertyStatus } from "../lib/types";
import { deleteProperty, saveProperty, topSortOrder, useSiteData } from "../lib/data";
import { brl, priceLabel } from "../lib/helpers";
import { smallImage } from "../lib/images";
import { AdminGallery } from "./AdminGallery";

const PAGE_SIZE = 20;

const STATUS: Record<PropertyStatus, { label: string; tone: string }> = {
  ativo: { label: "Ativo", tone: "bg-emerald-400/15 text-emerald-200" },
  pausado: { label: "Pausado", tone: "bg-cream-100/10 text-cream-300" },
  vendido: { label: "Vendido", tone: "bg-gold-500/20 text-gold-200" },
};

const CATEGORIES: { value: Property["category"]; label: string }[] = [
  { value: "casa", label: "Casa" },
  { value: "apartamento", label: "Apartamento" },
  { value: "cobertura", label: "Cobertura" },
  { value: "loft", label: "Loft" },
  { value: "studio", label: "Studio" },
];

const field =
  "w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-sm text-cream-100 outline-none focus:border-gold-400/60";

const statusOf = (p: Property): PropertyStatus => p.status ?? "ativo";

function makeId() {
  return `imovel-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function blankProperty(): Property {
  return {
    id: makeId(),
    title: "",
    typeLabel: "Apartamento",
    category: "apartamento",
    transaction: "venda",
    price: 0,
    location: "",
    city: "São Paulo",
    beds: 0,
    baths: 0,
    area: 0,
    image: "",
    gallery: [],
    description: "",
    features: [],
    status: "ativo",
  };
}

type Editing = { property: Property; isNew: boolean };

// Aba "Imóveis" do painel: lista compacta (busca, filtros, páginas) + editor de um imóvel por vez
export function AdminProperties({ upload }: { upload: (file: File) => Promise<string | null> }) {
  const { allProperties } = useSiteData();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | "todos">("todos");
  const [dealFilter, setDealFilter] = useState<Property["transaction"] | "todos">("todos");
  const [categoryFilter, setCategoryFilter] = useState<Property["category"] | "todos">("todos");
  const [page, setPage] = useState(0);
  const [editing, setEditing] = useState<Editing | null>(null);
  const [notice, setNotice] = useState("");

  const counts = useMemo(() => {
    const c: Record<PropertyStatus, number> = { ativo: 0, pausado: 0, vendido: 0 };
    allProperties.forEach((p) => c[statusOf(p)]++);
    return c;
  }, [allProperties]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allProperties.filter(
      (p) =>
        (statusFilter === "todos" || statusOf(p) === statusFilter) &&
        (dealFilter === "todos" || p.transaction === dealFilter) &&
        (categoryFilter === "todos" || p.category === categoryFilter) &&
        (!q || [p.title, p.location, p.city, p.typeLabel].some((v) => v.toLowerCase().includes(q)))
    );
  }, [allProperties, query, statusFilter, dealFilter, categoryFilter]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * PAGE_SIZE, current * PAGE_SIZE + PAGE_SIZE);

  // Qualquer mudança de filtro volta para a primeira página
  const resetPage = <T,>(set: (v: T) => void) => (v: T) => {
    set(v);
    setPage(0);
  };

  const changeStatus = async (p: Property, status: PropertyStatus) => {
    setNotice("");
    try {
      await saveProperty({ ...p, status });
    } catch {
      setNotice("Não foi possível mudar o status. Tente de novo.");
    }
  };

  const remove = async (p: Property) => {
    if (!window.confirm(`Excluir "${p.title}" definitivamente? Se ele só foi vendido, use o status Vendido.`)) return;
    setNotice("");
    try {
      await deleteProperty(p.id);
      setNotice("Imóvel excluído.");
    } catch {
      setNotice("Não foi possível excluir o imóvel.");
    }
  };

  const edit = (p: Property) => setEditing({ property: structuredClone(p), isNew: false });
  const duplicate = (p: Property) =>
    setEditing({
      property: { ...structuredClone(p), id: makeId(), title: `${p.title} (cópia)`.slice(0, 120), sortOrder: undefined },
      isNew: true,
    });

  const chip = (active: boolean) =>
    `rounded-full px-3.5 py-1.5 text-xs font-bold transition ${
      active ? "bg-cream-100 text-ink-950" : "border border-cream-100/12 text-cream-300 hover:border-gold-400/50"
    }`;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h4 className="font-display text-2xl text-cream-50">
          Imóveis <span className="text-base text-cream-500">({allProperties.length})</span>
        </h4>
        <button
          onClick={() => setEditing({ property: blankProperty(), isNew: true })}
          className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-4 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-gold-400"
        >
          <Plus className="h-4 w-4" />
          Novo imóvel
        </button>
      </div>

      {/* Busca e filtros */}
      <div className="space-y-3 rounded-3xl border border-cream-100/10 bg-ink-950/40 p-4">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-cream-500" />
          <input
            value={query}
            onChange={(e) => resetPage(setQuery)(e.target.value)}
            placeholder="Buscar por título, bairro, cidade ou tipo"
            aria-label="Buscar imóveis"
            className={`${field} pl-10`}
          />
        </label>
        <div className="flex flex-wrap items-center gap-2">
          <button className={chip(statusFilter === "todos")} onClick={() => resetPage(setStatusFilter)("todos")}>
            Todos
          </button>
          {(Object.keys(STATUS) as PropertyStatus[]).map((s) => (
            <button key={s} className={chip(statusFilter === s)} onClick={() => resetPage(setStatusFilter)(s)}>
              {STATUS[s].label} ({counts[s]})
            </button>
          ))}
          <select
            value={dealFilter}
            onChange={(e) => resetPage(setDealFilter)(e.target.value as typeof dealFilter)}
            aria-label="Filtrar por negócio"
            className="rounded-full border border-cream-100/12 bg-ink-800 px-3 py-1.5 text-xs font-semibold text-cream-200 outline-none"
          >
            <option value="todos">Venda e aluguel</option>
            <option value="venda">Venda</option>
            <option value="aluguel">Aluguel</option>
          </select>
          <select
            value={categoryFilter}
            onChange={(e) => resetPage(setCategoryFilter)(e.target.value as typeof categoryFilter)}
            aria-label="Filtrar por tipo"
            className="rounded-full border border-cream-100/12 bg-ink-800 px-3 py-1.5 text-xs font-semibold text-cream-200 outline-none"
          >
            <option value="todos">Todos os tipos</option>
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {notice && (
        <p role="status" className="rounded-2xl border border-gold-500/30 bg-gold-500/10 p-3 text-sm text-cream-100">
          {notice}
        </p>
      )}

      {filtered.length === 0 ? (
        <p className="rounded-3xl border border-cream-100/10 bg-ink-950/40 p-6 text-sm text-cream-300">
          {allProperties.length === 0 ? "Nenhum imóvel cadastrado ainda." : "Nenhum imóvel encontrado com esses filtros."}
        </p>
      ) : (
        <ul className="divide-y divide-cream-100/10 overflow-hidden rounded-3xl border border-cream-100/10 bg-ink-950/40">
          {visible.map((p) => {
            const st = statusOf(p);
            return (
              <li key={p.id} className="flex flex-wrap items-center gap-3 p-3 sm:flex-nowrap">
                <button onClick={() => edit(p)} className="flex min-w-0 flex-1 items-center gap-3 text-left">
                  <span className="h-14 w-20 shrink-0 overflow-hidden rounded-xl border border-cream-100/10 bg-ink-900">
                    {p.image && <img src={smallImage(p.image)} alt="" className="h-full w-full object-cover" loading="lazy" />}
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-cream-50">{p.title}</span>
                    <span className="block truncate text-xs text-cream-400">
                      {p.typeLabel} · {[p.location, p.city].filter(Boolean).join(", ")}
                    </span>
                    <span className="block text-xs text-gold-300">
                      {priceLabel(p)} · {p.transaction === "aluguel" ? "Aluguel" : "Venda"}
                    </span>
                  </span>
                </button>
                <div className="flex items-center gap-1.5">
                  <select
                    value={st}
                    onChange={(e) => void changeStatus(p, e.target.value as PropertyStatus)}
                    aria-label={`Status de ${p.title}`}
                    className={`rounded-full border-0 px-3 py-1.5 text-xs font-bold outline-none ${STATUS[st].tone}`}
                  >
                    {(Object.keys(STATUS) as PropertyStatus[]).map((s) => (
                      <option key={s} value={s} className="bg-ink-900 text-cream-100">
                        {STATUS[s].label}
                      </option>
                    ))}
                  </select>
                  <IconButton label="Editar" onClick={() => edit(p)}>
                    <Pencil className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Duplicar" onClick={() => duplicate(p)}>
                    <Copy className="h-4 w-4" />
                  </IconButton>
                  <IconButton label="Excluir" danger onClick={() => void remove(p)}>
                    <Trash2 className="h-4 w-4" />
                  </IconButton>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {pages > 1 && (
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-cream-300">
          <span>
            {current * PAGE_SIZE + 1}–{Math.min(filtered.length, (current + 1) * PAGE_SIZE)} de {filtered.length}
          </span>
          <div className="flex items-center gap-2">
            <IconButton label="Página anterior" onClick={() => setPage(current - 1)} disabled={current === 0}>
              <ChevronLeft className="h-4 w-4" />
            </IconButton>
            <span>
              Página {current + 1} de {pages}
            </span>
            <IconButton label="Próxima página" onClick={() => setPage(current + 1)} disabled={current >= pages - 1}>
              <ChevronRight className="h-4 w-4" />
            </IconButton>
          </div>
        </div>
      )}

      {editing && (
        <PropertyEditor
          key={editing.property.id}
          editing={editing}
          upload={upload}
          onClose={() => setEditing(null)}
          onSaved={(title, isNew) => {
            setEditing(null);
            setNotice(isNew ? `"${title}" foi adicionado no topo da lista.` : `"${title}" foi salvo.`);
            if (isNew) setPage(0);
          }}
        />
      )}
    </div>
  );
}

function IconButton({
  label,
  onClick,
  children,
  danger,
  disabled,
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border transition disabled:opacity-30 ${
        danger
          ? "border-red-500/30 text-red-200 hover:border-red-400"
          : "border-cream-100/15 text-cream-200 hover:border-gold-400/60 hover:text-gold-300"
      }`}
    >
      {children}
    </button>
  );
}

// Janela de edição de um imóvel (novo, duplicado ou existente)
function PropertyEditor({
  editing,
  upload,
  onClose,
  onSaved,
}: {
  editing: Editing;
  upload: (file: File) => Promise<string | null>;
  onClose: () => void;
  onSaved: (title: string, isNew: boolean) => void;
}) {
  const [p, setP] = useState<Property>(editing.property);
  const [features, setFeatures] = useState(editing.property.features.join("\n"));
  const [saving, setSaving] = useState(false);
  const [coverBusy, setCoverBusy] = useState(false);
  const [error, setError] = useState("");

  const dirty =
    editing.isNew ||
    JSON.stringify({ ...p, features }) !==
      JSON.stringify({ ...editing.property, features: editing.property.features.join("\n") });

  const requestClose = () => {
    if (dirty && !window.confirm("Descartar as alterações deste imóvel?")) return;
    onClose();
  };

  // Esc fecha só o editor: captura antes do Esc que fecha o painel inteiro
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.stopPropagation();
      requestClose();
    };
    window.addEventListener("keydown", esc, true);
    return () => window.removeEventListener("keydown", esc, true);
  });

  const set = (patch: Partial<Property>) => setP((prev) => ({ ...prev, ...patch }));
  const num = (v: string) => Number(v.replace(/\D/g, "") || 0);

  const changeCover = async (file: File | null) => {
    if (!file) return;
    setCoverBusy(true);
    const url = await upload(file);
    setCoverBusy(false);
    if (url) set({ image: url });
  };

  const save = async () => {
    if (!p.title.trim()) return setError("Dê um título ao imóvel.");
    if (!p.image) return setError("Adicione uma foto de capa.");
    if (!p.location.trim() || !p.city.trim()) return setError("Preencha bairro/localização e cidade.");
    setError("");
    setSaving(true);
    try {
      const property: Property = {
        ...p,
        features: features
          .split("\n")
          .map((f) => f.trim())
          .filter(Boolean)
          .slice(0, 30),
        sortOrder: editing.isNew ? topSortOrder() : p.sortOrder,
      };
      await saveProperty(property);
      onSaved(property.title.trim(), editing.isNew);
    } catch (err) {
      console.error(err);
      setError("Não foi possível salvar. Confira os campos e tente de novo.");
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      onClick={requestClose}
      className="fixed inset-0 z-[90] flex items-end justify-center bg-ink-950/85 backdrop-blur-sm sm:items-center sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-labelledby="property-editor-title"
    >
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", damping: 28, stiffness: 300 }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl border border-cream-100/10 bg-ink-900 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-cream-100/10 px-5 py-4">
          <h3 id="property-editor-title" className="font-display text-xl text-cream-50">
            {editing.isNew ? "Novo imóvel" : "Editar imóvel"}
          </h3>
          <button
            onClick={requestClose}
            className="grid h-9 w-9 place-items-center rounded-full border border-cream-100/15 text-cream-100 hover:border-gold-400/60"
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 space-y-5 overflow-y-auto p-5">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="w-full shrink-0 space-y-2 sm:w-48">
              <div className="grid h-32 place-items-center overflow-hidden rounded-2xl border border-dashed border-cream-100/15 bg-ink-950">
                {p.image ? (
                  <img src={smallImage(p.image)} alt="Capa" className="h-full w-full object-cover" />
                ) : (
                  <span className="text-xs text-cream-500">Sem foto de capa</span>
                )}
              </div>
              <label className="flex cursor-pointer items-center justify-center gap-2 rounded-full border border-cream-100/15 px-4 py-2 text-xs font-semibold text-cream-200 hover:border-gold-400/60 hover:text-gold-300">
                <ImagePlus className="h-4 w-4" />
                {coverBusy ? "Enviando..." : p.image ? "Trocar capa" : "Enviar capa"}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  disabled={coverBusy}
                  onChange={(e) => void changeCover(e.target.files?.[0] ?? null)}
                />
              </label>
            </div>

            <div className="grid flex-1 gap-3 sm:grid-cols-2">
              <Field label="Título *" className="sm:col-span-2">
                <input value={p.title} onChange={(e) => set({ title: e.target.value.slice(0, 120) })} className={field} />
              </Field>
              <Field label="Status">
                <select
                  value={statusOf(p)}
                  onChange={(e) => set({ status: e.target.value as PropertyStatus })}
                  className={field}
                >
                  {(Object.keys(STATUS) as PropertyStatus[]).map((s) => (
                    <option key={s} value={s}>
                      {STATUS[s].label}
                      {s === "ativo" ? " (aparece no site)" : " (só no painel)"}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Selo">
                <select
                  value={p.badge ?? ""}
                  onChange={(e) => set({ badge: (e.target.value || undefined) as Property["badge"] })}
                  className={field}
                >
                  <option value="">Sem selo</option>
                  <option value="Novo">Novo</option>
                  <option value="Exclusivo">Exclusivo</option>
                  <option value="Destaque">Destaque</option>
                </select>
              </Field>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Negócio">
              <select
                value={p.transaction}
                onChange={(e) => set({ transaction: e.target.value as Property["transaction"] })}
                className={field}
              >
                <option value="venda">Venda</option>
                <option value="aluguel">Aluguel</option>
              </select>
            </Field>
            <Field label="Categoria (filtros do site)">
              <select
                value={p.category}
                onChange={(e) => set({ category: e.target.value as Property["category"] })}
                className={field}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Tipo (texto exibido)">
              <input value={p.typeLabel} onChange={(e) => set({ typeLabel: e.target.value.slice(0, 40) })} className={field} />
            </Field>
            <Field label={p.transaction === "aluguel" ? "Aluguel mensal (R$)" : "Preço (R$)"}>
              <input
                inputMode="numeric"
                value={p.price ? brl(p.price) : ""}
                onChange={(e) => set({ price: Math.min(999999999999, num(e.target.value)) })}
                placeholder="R$ 0"
                className={field}
              />
            </Field>
            <Field label="Condomínio (R$)">
              <input
                inputMode="numeric"
                value={p.condo ? brl(p.condo) : ""}
                onChange={(e) => set({ condo: num(e.target.value) || undefined })}
                placeholder="R$ 0"
                className={field}
              />
            </Field>
            <Field label="Área (m²)">
              <input
                inputMode="numeric"
                value={p.area || ""}
                onChange={(e) => set({ area: Math.min(100000, num(e.target.value)) })}
                className={field}
              />
            </Field>
            <Field label="Quartos">
              <input
                inputMode="numeric"
                value={p.beds || ""}
                onChange={(e) => set({ beds: Math.min(50, num(e.target.value)) })}
                className={field}
              />
            </Field>
            <Field label="Banheiros">
              <input
                inputMode="numeric"
                value={p.baths || ""}
                onChange={(e) => set({ baths: Math.min(50, num(e.target.value)) })}
                className={field}
              />
            </Field>
            <Field label="Bairro / localização *">
              <input value={p.location} onChange={(e) => set({ location: e.target.value.slice(0, 80) })} className={field} />
            </Field>
            <Field label="Cidade *" className="sm:col-span-3">
              <input value={p.city} onChange={(e) => set({ city: e.target.value.slice(0, 80) })} className={field} />
            </Field>
          </div>

          <Field label="Descrição">
            <textarea
              value={p.description}
              rows={4}
              onChange={(e) => set({ description: e.target.value.slice(0, 4000) })}
              className={field}
            />
          </Field>
          <Field label="Diferenciais (um por linha)">
            <textarea
              value={features}
              rows={3}
              onChange={(e) => setFeatures(e.target.value)}
              placeholder={"Piscina aquecida\nVista para o parque\n3 vagas"}
              className={field}
            />
          </Field>

          <AdminGallery cover={p.image} gallery={p.gallery} onChange={(next) => set(next)} upload={upload} />
        </div>

        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-cream-100/10 bg-ink-950/60 px-5 py-4">
          {error && (
            <p role="alert" className="flex-1 text-sm text-red-300">
              {error}
            </p>
          )}
          <button
            onClick={requestClose}
            className="rounded-full border border-cream-100/15 px-5 py-2.5 text-sm font-semibold text-cream-100 hover:border-gold-400/60"
          >
            Cancelar
          </button>
          <button
            onClick={() => void save()}
            disabled={saving || coverBusy}
            className="rounded-full bg-gold-500 px-5 py-2.5 text-sm font-bold text-ink-950 hover:bg-gold-400 disabled:opacity-50"
          >
            {saving ? "Salvando..." : editing.isNew ? "Adicionar imóvel" : "Salvar imóvel"}
          </button>
        </div>
      </motion.div>
    </motion.div>,
    document.body
  );
}

function Field({ label, className = "", children }: { label: string; className?: string; children: React.ReactNode }) {
  return (
    <label className={`block space-y-1.5 text-xs text-cream-300 ${className}`}>
      <span>{label}</span>
      {children}
    </label>
  );
}
