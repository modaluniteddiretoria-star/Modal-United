// Cadastro de clientes: valida o captcha Cloudflare Turnstile e os dados,
// cria a conta já confirmada e o registro em public.clients.
// Os cadastros públicos do Supabase Auth ficam desligados: este é o único caminho.
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

async function verifyTurnstile(token: string, ip: string | null): Promise<boolean> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret || !token) return false;
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);
  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: form });
  const data = (await res.json()) as { success: boolean };
  return data.success === true;
}

const clean = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

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

  const name = clean(body.name, 120);
  const phone = clean(body.phone, 30).replace(/\D/g, "");
  const email = clean(body.email, 254).toLowerCase();
  const password = typeof body.password === "string" ? body.password : "";

  if (name.length < 2) return json({ error: "Informe seu nome." }, 400, origin);
  if (phone.length < 10 || phone.length > 11) return json({ error: "Informe um WhatsApp válido com DDD." }, 400, origin);
  if (!EMAIL.test(email)) return json({ error: "Informe um e-mail válido." }, 400, origin);
  if (password.length < 8 || password.length > 72) {
    return json({ error: "A senha precisa ter pelo menos 8 caracteres." }, 400, origin);
  }
  if (body.acceptPrivacy !== true) {
    return json({ error: "É preciso aceitar a Política de Privacidade." }, 400, origin);
  }

  const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
  if (!(await verifyTurnstile(clean(body.token, 2048), ip))) {
    return json({ error: "Não conseguimos confirmar que você não é um robô. Tente de novo." }, 403, origin);
  }

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });

  const { data: created, error: createError } = await db.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { name },
  });
  if (createError || !created.user) {
    const msg = createError?.message ?? "";
    if (/already|registered|exists/i.test(msg)) {
      return json({ error: "Já existe uma conta com este e-mail. Use “Entrar”." }, 409, origin);
    }
    if (/password/i.test(msg)) return json({ error: "Escolha uma senha mais forte." }, 400, origin);
    console.error("createUser", createError);
    return json({ error: "Não foi possível criar a conta agora." }, 500, origin);
  }

  const { error: clientError } = await db.from("clients").insert({ id: created.user.id, name, phone, email });
  if (clientError) {
    console.error("clients insert", clientError);
    await db.auth.admin.deleteUser(created.user.id);
    return json({ error: "Não foi possível criar a conta agora." }, 500, origin);
  }

  return json({ ok: true }, 200, origin);
});
