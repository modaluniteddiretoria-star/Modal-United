// Chat do site: inicia conversas (com Cloudflare Turnstile), recebe mensagens
// dos visitantes e, se o corretor estiver offline, responde com um bot simples.
// A leitura das mensagens pelo visitante é feita pelo RPC public.chat_poll.
import { createClient, type SupabaseClient } from "npm:@supabase/supabase-js@2";

const ALLOWED_ORIGINS = new Set(["https://modal-united.vercel.app", "http://localhost:5173"]);
const MAX_MESSAGES_PER_5_MIN = 15;

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

async function sha256Hex(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function randomSecret(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return [...bytes].map((b) => b.toString(16).padStart(2, "0")).join("");
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

// ---------------------------------------------------------------------------
// Bot offline: regras simples por palavra-chave
// ---------------------------------------------------------------------------
interface Agent {
  name: string;
  brand: string;
  phone: string;
  whatsapp: string;
  city: string;
}

const normalize = (s: string) =>
  s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");

function botReply(message: string, agent: Agent, isFirst: boolean): string | null {
  const t = normalize(message);
  const has = (...words: string[]) => words.some((w) => t.includes(w));
  const zap = `WhatsApp ${agent.phone}`;
  const first = agent.name.split(" ")[0];

  if (has("agend", "visita", "visitar", "conhecer o imovel", "horario"))
    return `Para agendar uma visita, clique em "Agendar visita" no imóvel que você gostou e escolha o dia e o horário (segunda a sábado, das 9h às 17h15). Você recebe um código de confirmação na hora.`;
  if (has("alug", "locacao", "locar"))
    return `Temos imóveis para alugar! Na lista de imóveis, use o filtro "Alugar" para ver as opções e os valores mensais. Se não encontrar o que procura, deixe aqui o que você precisa que o ${first} busca para você.`;
  if (has("vender", "vendo", "anunciar", "avaliar", "avaliacao", "meu imovel"))
    return `Que ótimo! O ${first} pode avaliar e anunciar o seu imóvel. Deixe aqui o bairro, o tipo e o tamanho do imóvel, e ele retorna assim que estiver online. Se preferir, fale direto pelo ${zap}.`;
  if (has("financ", "credito", "fgts", "entrada"))
    return `O ${first} acompanha você na parte de financiamento e documentação. Conte aqui o imóvel de interesse e como pretende pagar, e ele responde com as opções.`;
  if (has("preco", "valor", "quanto custa", "condominio", "iptu"))
    return `O preço e o condomínio de cada imóvel aparecem no card e em "Detalhes". Se quiser negociar ou saber mais, deixe sua pergunta aqui que o ${first} responde.`;
  if (has("document", "papel", "escritura", "certidao"))
    return `Todos os imóveis do site passam por verificação de documentação. O ${first} explica cada etapa quando estiver online. Deixe sua dúvida aqui!`;
  if (has("onde", "endereco", "localiza", "bairro", "regiao"))
    return `Atendemos em ${agent.city} e região. A localização de cada imóvel aparece no card. Quer ajuda para encontrar algo em um bairro específico? Escreva aqui.`;
  if (has("whats", "telefone", "ligar", "numero", "contato"))
    return `Você pode falar com o ${first} pelo ${zap}. Sua mensagem aqui também fica registrada e ele responde quando voltar.`;
  if (isFirst || /\b(oi|ola|opa|bom dia|boa tarde|boa noite)\b/.test(t))
    return `Olá! Sou o assistente virtual da ${agent.brand}. O ${first} não está online agora, mas sua mensagem ficou registrada e ele responde assim que voltar. Posso ajudar com dúvidas sobre visitas, aluguel, venda ou financiamento. Se preferir, chame no ${zap}.`;
  return null;
}

async function maybeBotReply(db: SupabaseClient, conversationId: string, message: string, isFirst: boolean) {
  const { data: online } = await db.rpc("agent_is_online");
  if (online) return;

  const { data: agent } = await db
    .from("agent_profile")
    .select("name, brand, phone, whatsapp, city")
    .eq("id", 1)
    .single();
  if (!agent) return;

  let reply = botReply(message, agent as Agent, isFirst);
  if (!reply) {
    // Sem regra: avisa uma vez a cada 10 min que a mensagem foi registrada
    const { data: recent } = await db
      .from("chat_messages")
      .select("id")
      .eq("conversation_id", conversationId)
      .eq("sender", "bot")
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
      .limit(1);
    if (recent && recent.length > 0) return;
    reply = `Recebi sua mensagem! O ${(agent as Agent).name.split(" ")[0]} responde assim que estiver online. Se for urgente, chame no WhatsApp ${(agent as Agent).phone}.`;
  }
  await db.from("chat_messages").insert({ conversation_id: conversationId, sender: "bot", body: reply });
}

// ---------------------------------------------------------------------------
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

  const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
    auth: { persistSession: false },
  });
  const message = clean(body.message, 1000);
  if (!message) return json({ error: "Escreva uma mensagem." }, 400, origin);

  // Nova conversa: exige captcha
  if (body.action === "start") {
    const ip = req.headers.get("cf-connecting-ip") ?? req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    if (!(await verifyTurnstile(clean(body.token, 2048), ip))) {
      return json({ error: "Não conseguimos confirmar que você não é um robô. Tente de novo." }, 403, origin);
    }
    const secret = randomSecret();
    const { data: conv, error } = await db
      .from("chat_conversations")
      .insert({ secret_hash: await sha256Hex(secret), visitor_name: clean(body.name, 80) || null })
      .select("id")
      .single();
    if (error || !conv) {
      console.error("chat start", error);
      return json({ error: "Não foi possível iniciar o chat agora." }, 500, origin);
    }
    await db.from("chat_messages").insert({ conversation_id: conv.id, sender: "visitor", body: message });
    await maybeBotReply(db, conv.id, message, true);
    return json({ conversationId: conv.id, secret }, 200, origin);
  }

  // Mensagem em conversa existente: exige o segredo
  if (body.action === "send") {
    const conversationId = clean(body.conversationId, 64);
    const secret = clean(body.secret, 128);
    const { data: conv } = await db
      .from("chat_conversations")
      .select("id, secret_hash")
      .eq("id", conversationId)
      .maybeSingle();
    if (!conv || conv.secret_hash !== (await sha256Hex(secret))) {
      return json({ error: "Conversa não encontrada." }, 404, origin);
    }
    const { count } = await db
      .from("chat_messages")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conv.id)
      .eq("sender", "visitor")
      .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString());
    if ((count ?? 0) >= MAX_MESSAGES_PER_5_MIN) {
      return json({ error: "Muitas mensagens seguidas. Aguarde um pouco." }, 429, origin);
    }
    await db.from("chat_conversations").update({ status: "open" }).eq("id", conv.id);
    await db.from("chat_messages").insert({ conversation_id: conv.id, sender: "visitor", body: message });
    await maybeBotReply(db, conv.id, message, false);
    return json({ ok: true }, 200, origin);
  }

  return json({ error: "Ação inválida" }, 400, origin);
});
