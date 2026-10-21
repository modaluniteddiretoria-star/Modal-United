// Cria um agendamento para o cliente logado (exige cadastro ativo).
// O RPC public.create_booking só pode ser executado pelo service_role,
// então esta função é o único caminho para agendar. Nome e WhatsApp vêm do cadastro.
import { createClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set([
  "https://modal-united.vercel.app",
  "http://localhost:5173",
]);

function cors(origin: string | null): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": origin && ALLOWED_ORIGINS.has(origin) ? origin : "https://modal-united.vercel.app",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), "Content-Type": "application/json" },
  });
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405, origin);

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  // Cliente logado (token do Supabase Auth)
  const token = (req.headers.get("Authorization") ?? "").replace(/^Bearer\s+/i, "");
  const { data: auth } = await supabase.auth.getUser(token);
  const user = auth?.user;
  if (!user) return json({ error: "Entre na sua conta para agendar." }, 401, origin);

  const { data: client } = await supabase
    .from("clients")
    .select("name, phone, email, status")
    .eq("id", user.id)
    .maybeSingle();
  if (!client || client.status !== "active") {
    return json({ error: "Seu cadastro não está ativo. Fale com o corretor pelo WhatsApp." }, 403, origin);
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Requisição inválida" }, 400, origin);
  }

  const { data, error } = await supabase.rpc("create_booking", {
    p_client_id: user.id,
    p_property_id: str(body.propertyId, 80),
    p_visit_date: str(body.date, 10),
    p_visit_time: str(body.time, 5),
    p_name: client.name,
    p_phone: client.phone,
    p_email: client.email,
    p_note: str(body.note, 1000) || null,
  });

  if (error) {
    // Erros de validação do RPC já vêm com mensagem em português
    const status =
      error.code === "23505" ? 409
      : error.code === "42501" ? 403
      : ["22023", "P0002", "23514", "22007", "22P02"].includes(error.code) ? 400
      : 500;
    if (status === 500) console.error("create_booking falhou", error);
    return json({ error: status === 500 ? "Não foi possível agendar agora. Tente de novo." : error.message }, status, origin);
  }

  const row = (data as { id: string; code: string }[])[0];
  return json({ id: row.id, code: row.code }, 200, origin);
});
