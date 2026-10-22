import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, LogOut, Settings2, Upload, X } from "lucide-react";
import { saveSiteContent, saveSiteData, useSiteData } from "../lib/data";
import { AdminContent } from "./AdminContent";
import { AdminClients } from "./AdminClients";
import { AdminProposals } from "./AdminProposals";
import { PROPERTY_FOLDER, SMALL_SUFFIX, compressImage, extensionFor } from "../lib/images";
import { supabase } from "../lib/supabase";
import { AdminBookings } from "./AdminBookings";
import { AdminChat } from "./AdminChat";
import { AdminProperties } from "./AdminProperties";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024; // limite do bucket (após compressão)
const MAX_INPUT_BYTES = 20 * 1024 * 1024; // arquivo original escolhido
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

const TABS = [
  { id: "perfil", label: "Perfil" },
  { id: "imoveis", label: "Imóveis" },
  { id: "conteudo", label: "Conteúdo" },
  { id: "agendamentos", label: "Agendamentos" },
  { id: "conversas", label: "Conversas" },
  { id: "propostas", label: "Propostas" },
  { id: "clientes", label: "Clientes" },
] as const;

const HEARTBEAT_MS = 30000;

export function AdminDashboard({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { agent: AGENT, allProperties, content: CONTENT } = useSiteData();
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("perfil");
  const [profile, setProfile] = useState(() => ({ ...AGENT }));
  const [content, setContent] = useState(() => structuredClone(CONTENT));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [saveError, setSaveError] = useState("");
  const [unreadChats, setUnreadChats] = useState(0);

  // Dados do site chegaram depois (ex.: painel aberto direto em /adminmodal): atualiza o formulário
  // se ainda não foi editado, para nunca salvar os valores de exemplo por cima dos reais
  const [base, setBase] = useState({ AGENT, CONTENT });
  if (base.AGENT !== AGENT || base.CONTENT !== CONTENT) {
    const untouched =
      JSON.stringify({ profile, content }) === JSON.stringify({ profile: base.AGENT, content: base.CONTENT });
    setBase({ AGENT, CONTENT });
    if (untouched) {
      setProfile({ ...AGENT });
      setContent(structuredClone(CONTENT));
    }
  }

  // Recarrega os dados atuais sempre que o painel é aberto
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setProfile({ ...AGENT });
      setContent(structuredClone(CONTENT));
      setSaveError("");
    }
  }

  // Presença: enquanto o painel está aberto, o corretor aparece online no chat do site
  useEffect(() => {
    if (!open || !authenticated) return;
    // O builder do supabase-js só executa ao ser aguardado (then/await)
    const beat = () => {
      void supabase.rpc("agent_heartbeat").then(({ error }) => {
        if (error) console.warn("Falha ao marcar presença no chat", error.message);
      });
    };
    const first = window.setTimeout(beat, 0);
    const timer = window.setInterval(beat, HEARTBEAT_MS);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, [open, authenticated]);

  // Sessão do Supabase: só libera o painel para usuários em public.admins
  useEffect(() => {
    const check = async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        setAuthenticated(false);
        return;
      }
      const { data: isAdmin } = await supabase.rpc("is_admin");
      setAuthenticated(Boolean(isAdmin));
    };
    void check();
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      void check();
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Alterações feitas no painel e ainda não salvas no site
  const dirty = useMemo(
    () =>
      JSON.stringify({ profile, content }) !== JSON.stringify({ profile: AGENT, content: CONTENT }),
    [profile, content, AGENT, CONTENT]
  );

  const requestClose = useCallback(() => {
    if (dirty && !window.confirm("Você tem alterações não salvas. Sair sem salvar?")) return;
    onClose();
  }, [dirty, onClose]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    if (open) window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [open, requestClose]);


  const updateProfile = <K extends keyof typeof profile>(key: K, value: (typeof profile)[K]) => {
    setProfile((prev) => ({ ...prev, [key]: value }));
  };


  // Envia uma imagem ao Storage e devolve a URL pública (ou null em caso de erro)
  // Comprime no navegador (WebP) e envia ao Storage; devolve a URL pública (ou null em caso de erro).
  // Fotos de imóveis ganham também uma versão pequena (<uuid>-sm) para cards e miniaturas.
  const uploadImage = async (file: File, kind: "profile" | "property"): Promise<string | null> => {
    if (!IMAGE_TYPES.includes(file.type)) {
      setSaveError("Use imagens JPG, PNG ou WebP.");
      return null;
    }
    if (file.size > MAX_INPUT_BYTES) {
      setSaveError(`"${file.name}" passa de 20 MB.`);
      return null;
    }
    setUploading(true);
    setSaveError("");
    try {
      const full = await compressImage(file, kind === "profile" ? 800 : 1920);
      if (full.size > MAX_IMAGE_BYTES) {
        setSaveError(`"${file.name}" ficou grande demais mesmo comprimida.`);
        return null;
      }
      const ext = extensionFor(full);
      const id = crypto.randomUUID();
      const folder = kind === "profile" ? "profile" : PROPERTY_FOLDER;
      const bucket = supabase.storage.from("site-images");
      const opts = { cacheControl: "31536000" };
      const path = `${folder}/${id}.${ext}`;
      const { error } = await bucket.upload(path, full, { ...opts, contentType: full.type });
      if (error) throw error;
      if (kind === "property") {
        // A versão pequena usa o mesmo formato da grande (o site troca só o sufixo)
        const small = await compressImage(file, 800, 0.78);
        const smallBlob = extensionFor(small) === ext ? small : full;
        const { error: smallError } = await bucket.upload(`${folder}/${id}${SMALL_SUFFIX}.${ext}`, smallBlob, {
          ...opts,
          contentType: smallBlob.type,
        });
        if (smallError) throw smallError;
      }
      return bucket.getPublicUrl(path).data.publicUrl;
    } catch (err) {
      console.error(err);
      setSaveError("Falha ao processar ou enviar a imagem. Tente novamente.");
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleProfilePhoto = async (file: File | null) => {
    if (!file) return;
    const url = await uploadImage(file, "profile");
    if (url) setProfile((prev) => ({ ...prev, photo: url }));
  };

  const saveChanges = async () => {
    setSaving(true);
    setSaveError("");
    try {
      await saveSiteData(profile);
      await saveSiteContent(content);
      onClose();
    } catch (err) {
      console.error(err);
      setSaveError("Não foi possível salvar. Confira os campos (ex.: WhatsApp só com números) e tente de novo.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (dirty && !window.confirm("Você tem alterações não salvas. Sair sem salvar?")) return;
    await supabase.auth.signOut();
    setAuthenticated(false);
    onClose();
  };

  const handleLogin = async () => {
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setPassword("");
    if (error) {
      setAuthError("E-mail ou senha incorretos.");
      return;
    }
    const { data: isAdmin } = await supabase.rpc("is_admin");
    if (!isAdmin) {
      await supabase.auth.signOut();
      setAuthError("Esta conta não tem acesso ao painel.");
      return;
    }
    setAuthenticated(true);
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
                  Entre com seu e-mail e senha para editar o site da Modal United.
                </p>
              </div>

              <div className="mt-6 space-y-4">
                <input
                  type="email"
                  autoComplete="username"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="E-mail"
                  className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3.5 text-sm text-cream-100 outline-none focus:border-gold-400/60"
                />
                <input
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Senha"
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
            className="relative flex h-[92dvh] w-[min(1100px,94vw)] flex-col overflow-hidden rounded-[28px] border border-cream-100/10 bg-ink-900 shadow-2xl"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-cream-100/10 bg-ink-900/90 px-5 py-4">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-2xl bg-gold-500 text-ink-950">
                  <Settings2 className="h-5 w-5" />
                </span>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gold-400">
                    Painel administrativo
                  </p>
                  <h3 className="font-brand text-base uppercase tracking-[0.18em] text-cream-50">Modal United</h3>
                </div>
              </div>

              <button
                onClick={requestClose}
                className="grid h-10 w-10 place-items-center rounded-full border border-cream-100/15 text-cream-100 transition-colors hover:border-gold-400/60 hover:text-gold-300"
                aria-label="Fechar painel"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
              <aside className="shrink-0 border-b border-cream-100/10 bg-ink-950/50 p-4 lg:w-[250px] lg:border-b-0 lg:border-r">
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
                      {item.id === "conversas" && unreadChats > 0 && (
                        <span className="ml-2 rounded-full bg-gold-400 px-1.5 py-0.5 text-[10px] font-bold text-ink-950">
                          {unreadChats}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>

                <div className="mt-6 rounded-2xl border border-cream-100/10 bg-cream-100/5 p-4">
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-cream-500">
                    Resumo
                  </p>
                  <div className="mt-3 space-y-2 text-sm text-cream-300">
                    <p>Imóveis: {allProperties.length}</p>
                    <p>WhatsApp: {profile.phone}</p>
                  </div>
                </div>
              </aside>

              <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-6">
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
                            accept="image/jpeg,image/png,image/webp"
                            className="hidden"
                            onChange={(e) => void handleProfilePhoto(e.target.files?.[0] ?? null)}
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
                        <span>Frase de apresentação</span>
                        <input
                          value={profile.tagline}
                          onChange={(e) => updateProfile("tagline", e.target.value.slice(0, 120))}
                          placeholder="Ex.: Atendimento imobiliário especializado"
                          className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                        />
                      </label>

                      <label className="space-y-2 text-sm text-cream-300">
                        <span>
                          CRECI <span className="text-gold-400">(obrigatório por lei em anúncios)</span>
                        </span>
                        <input
                          value={profile.creci}
                          onChange={(e) => updateProfile("creci", e.target.value.slice(0, 40))}
                          placeholder="Ex.: 123456-F"
                          className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                        />
                      </label>

                      <div className="grid grid-cols-2 gap-4 md:col-span-2 lg:grid-cols-4">
                        {(
                          [
                            ["rating", "Nota média (0 a 5)", 0.1, 5],
                            ["reviews", "Nº de avaliações", 1, 100000],
                            ["years", "Anos de mercado", 1, 80],
                            ["sold", "Imóveis vendidos", 1, 100000],
                          ] as const
                        ).map(([key, label, step, max]) => (
                          <label key={key} className="space-y-2 text-sm text-cream-300">
                            <span>{label}</span>
                            <input
                              type="number"
                              min={0}
                              max={max}
                              step={step}
                              value={profile[key]}
                              onChange={(e) =>
                                updateProfile(key, Math.min(max, Math.max(0, Number(e.target.value) || 0)))
                              }
                              className="w-full rounded-2xl border border-cream-100/12 bg-ink-800 px-4 py-3 text-cream-100 outline-none focus:border-gold-400/60"
                            />
                          </label>
                        ))}
                        <p className="col-span-2 text-xs text-cream-500 lg:col-span-4">
                          Deixe 0 para esconder no site. Use só números reais (ex.: nota do Google Meu Negócio).
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {tab === "conteudo" && <AdminContent content={content} onChange={setContent} />}

                {tab === "agendamentos" && <AdminBookings />}
                {tab === "propostas" && <AdminProposals />}
                {tab === "clientes" && <AdminClients />}

                {/* Fica montado para manter o tempo real e o contador de não lidas */}
                <div className={tab === "conversas" ? "h-full" : "hidden"}>
                  <AdminChat onUnreadChange={setUnreadChats} />
                </div>

                {tab === "imoveis" && (
                  <AdminProperties upload={(file) => uploadImage(file, "property")} />
                )}
              </div>
            </div>

            <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-cream-100/10 bg-ink-950/60 px-5 py-4">
              <button
                onClick={() => void handleLogout()}
                className="inline-flex items-center gap-2 rounded-full border border-cream-100/15 px-4 py-2.5 text-sm font-semibold text-cream-100 transition hover:border-gold-400/60 hover:text-gold-300"
              >
                <LogOut className="h-4 w-4" />
                Sair
              </button>

              {(saveError || uploading || dirty) && (
                <p
                  role="status"
                  className={`flex-1 px-2 text-sm ${saveError ? "text-red-300" : uploading ? "text-cream-300" : "text-gold-300"}`}
                >
                  {saveError || (uploading ? "Enviando imagem..." : "Alterações não salvas: clique em Salvar para publicar no site.")}
                </p>
              )}

              <div className="flex items-center gap-3">
                <button
                  onClick={requestClose}
                  className="rounded-full border border-cream-100/15 px-5 py-2.5 text-sm font-semibold text-cream-100 transition hover:border-gold-400/60 hover:text-gold-300"
                >
                  Cancelar
                </button>
                <button
                  onClick={() => void saveChanges()}
                  disabled={saving || uploading || !dirty}
                  className={`inline-flex items-center gap-2 rounded-full bg-gold-500 px-5 py-2.5 text-sm font-bold text-ink-950 transition hover:bg-gold-400 disabled:cursor-not-allowed disabled:opacity-50 ${
                    dirty && !saving ? "ring-2 ring-gold-300/60 ring-offset-2 ring-offset-ink-950" : ""
                  }`}
                >
                  <Check className="h-4 w-4" />
                  {saving ? "Salvando..." : "Salvar alterações"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
