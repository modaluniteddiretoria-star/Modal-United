import { useSyncExternalStore } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabase";

// Conta do cliente no site (cadastro feito pela Edge Function "register").
export interface ClientProfile {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: "active" | "blocked";
}

export interface AuthState {
  // loading: verificando sessão · guest: sem login · client: cliente logado · other: logado sem cadastro de cliente (ex.: admin)
  status: "loading" | "guest" | "client" | "other";
  session: Session | null;
  client: ClientProfile | null;
}

let state: AuthState = { status: "loading", session: null, client: null };
const listeners = new Set<() => void>();

function setState(next: AuthState) {
  state = next;
  listeners.forEach((l) => l());
}

async function loadClient(session: Session | null) {
  if (!session) {
    setState({ status: "guest", session: null, client: null });
    return;
  }
  const { data } = await supabase
    .from("clients")
    .select("id, name, phone, email, status")
    .eq("id", session.user.id)
    .maybeSingle();
  const client = data as ClientProfile | null;
  setState({
    status: client && client.status === "active" ? "client" : "other",
    session,
    client,
  });
}

let started = false;
function start() {
  if (started) return;
  started = true;
  void supabase.auth.getSession().then(({ data }) => loadClient(data.session));
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === "INITIAL_SESSION") return;
    // Evita chamar o Supabase dentro do callback (recomendação do supabase-js)
    window.setTimeout(() => void loadClient(session), 0);
  });
}

export function useAuth(): AuthState {
  start();
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state
  );
}

export function getAuth(): AuthState {
  return state;
}

async function functionError(error: unknown, fallback: string): Promise<Error> {
  const ctx = (error as { context?: Response }).context;
  if (ctx && typeof ctx.json === "function") {
    try {
      const payload = (await ctx.json()) as { error?: string };
      if (payload.error) return new Error(payload.error);
    } catch {
      // resposta sem JSON
    }
  }
  return new Error(fallback);
}

export async function registerClient(input: {
  name: string;
  phone: string;
  email: string;
  password: string;
  acceptPrivacy: boolean;
  captchaToken: string;
}): Promise<void> {
  const { error } = await supabase.functions.invoke("register", {
    body: {
      name: input.name,
      phone: input.phone,
      email: input.email,
      password: input.password,
      acceptPrivacy: input.acceptPrivacy,
      token: input.captchaToken,
    },
  });
  if (error) throw await functionError(error, "Não foi possível criar a conta. Tente novamente.");
  await loginClient(input.email, input.password);
}

export async function loginClient(email: string, password: string): Promise<void> {
  const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) {
    throw new Error(/banned/i.test(error.message) ? "Esta conta está bloqueada. Fale com o corretor pelo WhatsApp." : "E-mail ou senha incorretos.");
  }
  await loadClient(data.session);
}

export async function logoutClient(): Promise<void> {
  await supabase.auth.signOut();
  setState({ status: "guest", session: null, client: null });
}

export async function updateMyProfile(name: string, phone: string): Promise<void> {
  const { error } = await supabase.rpc("update_my_profile", { p_name: name, p_phone: phone });
  if (error) throw new Error("Não foi possível salvar. Confira nome e WhatsApp.");
  await loadClient(state.session);
}

// ---------------------------------------------------------------------------
// Janelas de login e "Minha conta" (abertas de qualquer parte do site)
// ---------------------------------------------------------------------------
export interface AuthUi {
  authOpen: boolean;
  authReason: string;
  accountOpen: boolean;
}

let ui: AuthUi = { authOpen: false, authReason: "", accountOpen: false };
let pendingAction: (() => void) | null = null;
const uiListeners = new Set<() => void>();

function setUi(next: Partial<AuthUi>) {
  ui = { ...ui, ...next };
  uiListeners.forEach((l) => l());
}

export function useAuthUi(): AuthUi {
  return useSyncExternalStore(
    (cb) => {
      uiListeners.add(cb);
      return () => uiListeners.delete(cb);
    },
    () => ui
  );
}

export function openAuth(reason = "") {
  setUi({ authOpen: true, authReason: reason });
}

export function closeAuth() {
  pendingAction = null;
  setUi({ authOpen: false });
}

// Chamado após login/cadastro bem-sucedido: fecha e continua a ação que pediu o login
export function finishAuth() {
  const action = pendingAction;
  pendingAction = null;
  setUi({ authOpen: false });
  if (action) window.setTimeout(action, 0);
}

export function openAccount() {
  setUi({ accountOpen: true });
}

export function closeAccount() {
  setUi({ accountOpen: false });
}

// Executa a ação se houver cliente logado; senão pede login e executa depois
export function requireClient(action: () => void, reason: string) {
  if (state.status === "client") {
    action();
    return;
  }
  pendingAction = action;
  openAuth(reason);
}
