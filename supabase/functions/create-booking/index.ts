// Cria um agendamento depois de validar o captcha Cloudflare Turnstile.
// O RPC public.create_booking só pode ser executado pelo service_role,
// então esta função é o único caminho público para agendar.
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

async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    console.error("TURNSTILE_SECRET_KEY não configurada");
    return false;
  }
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });
  const data = (await res.json()) as { success: boolean; "error-codes"?: string[] };
  if (!data.success) console.warn("Turnstile recusado", data["error-codes"]);
  return data.success === true;
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.slice(0, max) : "");

Deno.serve(async (req) => {
  const origin = req.headers.get("origin");
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors(origin) });
  if (req.method !== "POST") return json({ error: "Método não permitido" }, 405, origin);

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Requisição inválida" }, 400, origin);
  }

  const token = str(body.token, 2048);
  if (!token) return json({ error: "Confirme que você não é um robô e tente de novo." }, 400, origin);

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (!(await verifyTurnstile(token, ip))) {
    return json({ error: "Não conseguimos confirmar que você não é um robô. Tente de novo." }, 403, origin);
  }

  const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const { data, error } = await supabase.rpc("create_booking", {
    p_property_id: str(body.propertyId, 80),
    p_visit_date: str(body.date, 10),
    p_visit_time: str(body.time, 5),
    p_name: str(body.name, 120),
    p_phone: str(body.phone, 30),
    p_email: str(body.email, 120) || null,
    p_note: str(body.note, 1000) || null,
  });

  if (error) {
    // Erros de validação do RPC já vêm com mensagem em português
    const status = error.code === "23505" ? 409 : ["22023", "P0002", "23514", "22007", "22P02"].includes(error.code) ? 400 : 500;
    if (status === 500) console.error("create_booking falhou", error);
    return json({ error: status === 500 ? "Não foi possível agendar agora. Tente de novo." : error.message }, status, origin);
  }

  const row = (data as { id: string; code: string }[])[0];
  return json({ id: row.id, code: row.code }, 200, origin);
});
