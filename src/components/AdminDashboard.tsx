import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  ImagePlus,
  PencilLine,
  Plus,
  Settings2,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import type { Property } from "../lib/types";
import {
  AGENT,
  PROPERTIES,
  getAdminToken,
  setAdminToken,
  resetRemoteSiteData,
  resetSiteData,
  saveRemoteSiteData,
  saveSiteData,
} from "../lib/data";

const TABS = [
  { id: "perfil", label: "Perfil" },
  { id: "imoveis", label: "Imóveis" },
] as const;

function makeId(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function AdminDashboard({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("perfil");
  const [profile, setProfile] = useState(() => ({ ...AGENT }));
  const [properties, setProperties] = useState<Property[]>(() => structuredClone(PROPERTIES));
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authenticated, setAuthenticated] = useState(() => Boolean(getAdminToken()));

  // Recarrega os dados atuais sempre que o painel é aberto
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setAuthenticated(Boolean(getAdminToken()));
      setProfile({ ...AGENT });
      setProperties(structuredClone(PROPERTIES));
    }
  }

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, onClose]);

  const totalProperties = useMemo(() => properties.length, [properties]);

  const updateProfile = <K extends keyof typeof profile>(key: K, value: (typeof profile)[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };

  const updateProperty = (id: string, patch: Partial<Property>) => {
    setProperties((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const addProperty = () => {
    setProperties((prev) => [
      ...prev,
      {
        id: makeId("property"),
        title: "Novo imóvel",
        typeLabel: "Apartamento",
        category: "apartamento",
        price: 0,
        location: "Centro",
        city: "São Paulo",
        beds: 2,
        baths: 2,
        area: 80,
        image: "/images/prop-1.jpg",
        description: "Descreva o imóvel aqui.",
        features: ["Feature 1", "Feature 2"],
      },
    ]);
  };

  const removeProperty = (id: string) => {
    setProperties((prev) => prev.filter((item) => item.id !== id));
  };

  const handlePhotoUpload = (file: File | null, target: "profile" | "property", id?: string) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result ?? "");
      if (target === "profile") {
        setProfile((prev) => ({ ...prev, photo: url }));
      }
      if (target === "property" && id) {
        updateProperty(id, { image: url });
      }
    };
    reader.readAsDataURL(file);
  };

  const saveChanges = async () => {
    try {
      const result = await saveRemoteSiteData(profile, properties);
      setProfile({ ...result.agent });
      setProperties(structuredClone(result.properties));
      onClose();
    } catch {
      const fallback = saveSiteData(profile, properties);
      setProfile({ ...fallback.agent });
      setProperties(structuredClone(fallback.properties));
      onClose();
    }
  };

  const resetChanges = async () => {
    try {
      const restored = await resetRemoteSiteData();
      setProfile({ ...restored.agent });
      setProperties(structuredClone(restored.properties));
    } catch {
      const restored = resetSiteData();
      setProfile({ ...restored.agent });
      setProperties(structuredClone(restored.properties));
    }
  };

  const handleLogin = async () => {
    try {
      const response = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error("Senha inválida");
      }

      const { token } = (await response.json()) as { token?: string };
      if (!token) throw new Error("Token ausente");
      setAdminToken(token);
      setPassword("");
      setAuthenticated(true);
      setAuthError("");
    } catch {
      setAuthError("Senha incorreta ou servidor indisponível.");
    }
  };

  if (!authenticated) {
    return (
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/85 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 12, scale: 0.96 }}
              className="w-[min(420px,92vw)] rounded-[28px] border border-cream-100/10 bg-ink-900 p-6 shadow-2xl"
            >
              <div className="text-center">
                <span className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gold-500 text-ink-950">
                  <Settings2 className="h-6 w-6" />
                </span>
                <h3 className="mt-4 font-display text-3xl text-cream-50">Painel admin</h3>
                <p className="mt-2 text-sm text-cream-300">
                  Entre com a senha para editar o site da Modal United.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha do painel"
                  className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3.5 text-sm text-cream-100 outline-none focus:border-gold-400/60"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleLogin();
                  }}
                />
                {authError && <p className="text-sm text-red-300">{authError}</p>}
                <button
                  onClick={() => void handleLogin()}
                  className="w-full rounded-full bg-gold-500 px-5 py-3 text-sm font-bold text-ink-950 transition hover:bg-gold-400"
                >
                  Entrar no painel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-center justify-center bg-ink-950/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.98 }}
            transition={{ duration: 0.22 }}
            className="relative h-[92vh] w-[min(1100px,94vw)] overflow-hidden rounded-[28px] border border-cream-100/10 bg-ink-900 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-cream-100/10 bg-ink-900/90 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-500 text-ink-950">
                  <Settings2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold-400">
                    Painel administrativo
                  </p>
                  <h3 className="font-display text-xl text-cream-50">Modal United</h3>
                </div>
              </div>

              <button
                onClick={onClose}
                className="grid h-10 w-10 place-items-center rounded-full border border-cream-100/15 text-cream-100 transition-colors hover:border-gold-400/60 hover:text-gold-300"
                aria-label="Fechar painel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex h-[calc(100%-89px)] flex-col lg:flex-row">
              <aside className="border-b border-cream-100/10 bg-ink-950/50 p-4 lg:w-[250px] lg:border-b-0 lg:border-r">
                <nav className="flex gap-2 overflow-x-auto lg:flex-col">
                  {TABS.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setTab(item.id)}
                      className={`rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all ${
                        tab === item.id
                          ? "bg-gold-500 text-ink-950"
                          : "border border-cream-100/10 bg-cream-100/5 text-cream-200 hover:border-gold-400/50 hover:text-gold-300"
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </nav>

                <div className="mt-6 rounded-2xl border border-cream-100/10 bg-cream-100/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cream-500">
                    Resumo
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-cream-300">
                    <p>Imóveis: {totalProperties}</p>
                    <p>WhatsApp: {profile.phone}</p>
                  </div>
                </div>
              </aside>

              <div className="flex-1 overflow-y-auto p-5 sm:p-6">
                {tab === "perfil" && (
                  <div className="space-y-6">
                    <div className="flex flex-wrap items-center gap-6 rounded-3xl border border-cream-100/10 bg-ink-950/40 p-4">
                      <img
                        src={profile.photo}
                        alt="Foto do perfil"
                        className="h-24 w-24 rounded-full border-4 border-gold-500 object-cover"
                      />
                      <div className="flex flex-1 flex-col gap-3 sm:flex-row">
                        <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-full border border-cream-100/15 bg-cream-100/5 px-4 py-2.5 text-sm font-semibold text-cream-100 transition hover:border-gold-400/60 hover:text-gold-300">
                          <Upload className="h-4 w-4" />
                          Trocar foto
                          <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => handlePhotoUpload(e.target.files?.[0] ?? null, "profile")}
                          />
                        </label>
                        <input
                          value={profile.photo}
                          onChange={(e) => updateProfile("photo", e.target.value)}
                          className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-sm text-cream-100 outline-none focus:border-gold-400/60"
                          placeholder="URL da imagem"
                        />
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <label className="space-y-2 text-sm text-cream-300">
                        <span>Nome da marca</span>
                        <input
                          value={profile.brand}
                          onChange={(e) => updateProfile("brand", e.target.value)}
                          className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                        />
                      </label>

                      <label className="space-y-2 text-sm text-cream-300">
                        <span>Nome do consultor</span>
                        <input
                          value={profile.name}
                          onChange={(e) => updateProfile("name", e.target.value)}
                          className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                        />
                      </label>

                      <label className="space-y-2 text-sm text-cream-300 md:col-span-2">
                        <span>Função / cargo</span>
                        <input
                          value={profile.role}
                          onChange={(e) => updateProfile("role", e.target.value)}
                          className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                        />
                      </label>

                      <label className="space-y-2 text-sm text-cream-300">
                        <span>WhatsApp</span>
                        <input
                          value={profile.phone}
                          onChange={(e) => updateProfile("phone", e.target.value)}
                          className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                        />
                      </label>

                      <label className="space-y-2 text-sm text-cream-300">
                        <span>WhatsApp numérico</span>
                        <input
                          value={profile.whatsapp}
                          onChange={(e) => updateProfile("whatsapp", e.target.value)}
                          className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                        />
                      </label>

                      <label className="space-y-2 text-sm text-cream-300">
                        <span>E-mail</span>
                        <input
                          type="email"
                          value={profile.email}
                          onChange={(e) => updateProfile("email", e.target.value)}
                          className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                        />
                      </label>

                      <label className="space-y-2 text-sm text-cream-300">
                        <span>Instagram</span>
                        <input
                          value={profile.instagram}
                          onChange={(e) => updateProfile("instagram", e.target.value)}
                          className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                        />
                      </label>

                      <label className="space-y-2 text-sm text-cream-300">
                        <span>Cidade</span>
                        <input
                          value={profile.city}
                          onChange={(e) => updateProfile("city", e.target.value)}
                          className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                        />
                      </label>

                      <label className="space-y-2 text-sm text-cream-300">
                        <span>CRECI / perfil</span>
                        <input
                          value={profile.creci}
                          onChange={(e) => updateProfile("creci", e.target.value)}
                          className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                        />
                      </label>
                    </div>
                  </div>
                )}

                {tab === "imoveis" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <h4 className="font-display text-2xl text-cream-50">Imóveis em destaque</h4>
                      <button
                        onClick={addProperty}
                        className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-4 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-gold-400"
                      >
                        <Plus className="h-4 w-4" />
                        Novo imóvel
                      </button>
                    </div>

                    <div className="space-y-5">
                      {properties.map((property) => (
                        <div
                          key={property.id}
                          className="rounded-3xl border border-cream-100/10 bg-ink-950/40 p-4"
                        >
                          <div className="flex flex-col gap-4 md:flex-row">
                            <div className="h-28 w-full overflow-hidden rounded-2xl border border-cream-100/10 bg-ink-900 md:w-44">
                              <img src={property.image} alt={property.title} className="h-full w-full object-cover" />
                            </div>

                            <div className="grid flex-1 gap-3 md:grid-cols-2">
                              <label className="space-y-2 text-sm text-cream-300 md:col-span-2">
                                <span>Título</span>
                                <input
                                  value={property.title}
                                  onChange={(e) => updateProperty(property.id, { title: e.target.value })}
                                  className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                                />
                              </label>

                              <label className="space-y-2 text-sm text-cream-300">
                                <span>Tipo</span>
                                <input
                                  value={property.typeLabel}
                                  onChange={(e) => updateProperty(property.id, { typeLabel: e.target.value })}
                                  className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                                />
                              </label>

                              <label className="space-y-2 text-sm text-cream-300">
                                <span>Preço</span>
                                <input
                                  type="number"
                                  value={property.price}
                                  onChange={(e) =>
                                    updateProperty(property.id, { price: Number(e.target.value || 0) })
                                  }
                                  className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                                />
                              </label>

                              <label className="space-y-2 text-sm text-cream-300">
                                <span>Localização</span>
                                <input
                                  value={property.location}
                                  onChange={(e) => updateProperty(property.id, { location: e.target.value })}
                                  className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                                />
                              </label>

                              <label className="space-y-2 text-sm text-cream-300">
                                <span>Cidade</span>
                                <input
                                  value={property.city}
                                  onChange={(e) => updateProperty(property.id, { city: e.target.value })}
                                  className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                                />
                              </label>

                              <label className="space-y-2 text-sm text-cream-300">
                                <span>Imagem URL</span>
                                <input
                                  value={property.image}
                                  onChange={(e) => updateProperty(property.id, { image: e.target.value })}
                                  className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                                />
                              </label>

                              <label className="space-y-2 text-sm text-cream-300 md:col-span-2">
                                <span>Descrição</span>
                                <textarea
                                  value={property.description}
                                  rows={3}
                                  onChange={(e) => updateProperty(property.id, { description: e.target.value })}
                                  className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                                />
                              </label>
                            </div>
                          </div>

                          <div className="mt-4 flex items-center justify-between border-t border-cream-100/10 pt-4">
                            <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-cream-100/15 px-4 py-2 text-sm font-semibold text-cream-200 transition hover:border-gold-400/60 hover:text-gold-300">
                              <ImagePlus className="h-4 w-4" />
                              Subir foto
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => handlePhotoUpload(e.target.files?.[0] ?? null, "property", property.id)}
                              />
                            </label>
                            <button
                              onClick={() => removeProperty(property.id)}
                              className="inline-flex items-center gap-2 rounded-full border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm font-semibold text-red-200 transition hover:border-red-400 hover:text-red-100"
                            >
                              <Trash2 className="h-4 w-4" />
                              Remover
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-cream-100/10 bg-ink-950/60 px-5 py-4">
              <button
                onClick={resetChanges}
                className="inline-flex items-center gap-2 rounded-full border border-cream-100/15 px-4 py-2.5 text-sm font-semibold text-cream-100 transition hover:border-gold-400/60 hover:text-gold-300"
              >
                <PencilLine className="h-4 w-4" />
                Resetar
              </button>

              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="rounded-full border border-cream-100/15 px-5 py-2.5 text-sm font-semibold text-cream-100 transition hover:border-gold-400/60 hover:text-gold-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={saveChanges}
                  className="inline-flex items-center gap-2 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-gold-400"
                >
                  <Check className="h-4 w-4" />
                  Salvar alterações
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
