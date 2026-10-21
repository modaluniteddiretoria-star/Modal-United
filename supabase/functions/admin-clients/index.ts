// Ações do painel sobre clientes que exigem a chave de serviço:
// senha temporária, bloquear/desbloquear (com banimento no Auth) e excluir a conta (LGPD).
// Só executa se quem chama for admin (public.is_admin() com o token do próprio usuário).
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set(["https://modal-united.vercel.app", "http://localhost:5173"]);

function cors(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://modal-united.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), { status, headers: { ...cors(origin), "Content-Type": "application/json" } });
}

// Senha temporária legível (sem caracteres ambíguos)
function tempPassword(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return [...bytes].map((b) => chars[b % chars.length]).join("");
}

const UUID = /^[0-9a-f-]{36}$/;

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405, origin);

  const authHeader = req.headers.get("Authorization") ?? "";
  const asCaller = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });
  const { data: isAdmin } = await asCaller.rpc("is_admin");
  if (isAdmin !== true) return json({ error: "Não autorizado" }, 403, origin);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Requisição inválida" }, 400, origin);
  }
  const clientId = typeof body.clientId === "string" ? body.clientId : "";
  if (!UUID.test(clientId)) return json({ error: "Cliente inválido" }, 400, origin);

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const { data: client } = await db.from("clients").select("id").eq("id", clientId).maybeSingle();
  if (!client) return json({ error: "Cliente não encontrado" }, 404, origin);

  if (body.action === "reset_password") {
    const password = tempPassword();
    const { error } = await db.auth.admin.updateUserById(clientId, { password });
    if (error) return json({ error: "Não foi possível redefinir a senha." }, 500, origin);
    return json({ password }, 200, origin);
  }

  if (body.action === "set_status") {
    const status = body.status === "blocked" ? "blocked" : "active";
    const { error: authError } = await db.auth.admin.updateUserById(clientId, {
      ban_duration: status === "blocked" ? "876000h" : "none",
    });
    if (authError) return json({ error: "Não foi possível alterar o status." }, 500, origin);
    await db.from("clients").update({ status }).eq("id", clientId);
    return json({ ok: true, status }, 200, origin);
  }

  if (body.action === "delete") {
    // Apaga o usuário: o cadastro, propostas e conversas saem em cascata; visitas ficam sem vínculo
    const { error } = await db.auth.admin.deleteUser(clientId);
    if (error) return json({ error: "Não foi possível excluir a conta." }, 500, origin);
    return json({ ok: true }, 200, origin);
  }

  return json({ error: "Ação inválida" }, 400, origin);
});
