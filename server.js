import express from "express";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dataDir = path.join(__dirname, "data");
const dataFile = path.join(dataDir, "site-config.json");
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const sessions = new Map(); // token -> expiresAt

if (!ADMIN_PASSWORD || ADMIN_PASSWORD.length < 12) {
  console.error("Defina ADMIN_PASSWORD (mínimo 12 caracteres) antes de iniciar a API.");
  process.exit(1);
}

const DEFAULT_CONFIG = {
  agent: {
    brand: "Modal United",
    name: "Maia",
    role: "Consultora de Imóveis · Modal United",
    creci: "Atendimento imobiliário especializado",
    phone: "(11) 98417-2850",
    whatsapp: "5511984172850",
    email: "contato@modalunited.com.br",
    instagram: "@modalunited",
    city: "São Paulo, SP",
    photo: "/images/agent.jpg",
    rating: 4.9,
    reviews: 187,
    years: 14,
    sold: 350,
  },
  properties: [
    {
      id: "cobertura-ibirapuera",
      title: "Cobertura Vista Ibirapuera",
      typeLabel: "Cobertura",
      category: "cobertura",
      price: 3850000,
      condo: 3200,
      location: "Moema",
      city: "São Paulo",
      beds: 4,
      baths: 5,
      area: 320,
      image: "/images/prop-1.jpg",
      badge: "Exclusivo",
      description:
        "Cobertura dúplex com vista definitiva para o Parque Ibirapuera. Terraço gourmet amplo com deck, living em pé-direito duplo, automação completa e acabamentos assinados. Um dos endereços mais desejados de São Paulo.",
      features: [
        "Terraço gourmet com vista 270°",
        "4 suítes com closets",
        "Pé-direito duplo no living",
        "Automação e iluminação cênica",
        "4 vagas de garagem + depósito",
        "Lazer completo no condomínio",
      ],
    },
    {
      id: "villa-alphaville",
      title: "Villa Contemporânea Alphaville",
      typeLabel: "Casa",
      category: "casa",
      price: 2890000,
      condo: 1800,
      location: "Alphaville",
      city: "Barueri",
      beds: 5,
      baths: 6,
      area: 480,
      image: "/images/prop-2.jpg",
      badge: "Destaque",
      description:
        "Casa de arquitetura contemporânea em terreno plano no coração de Alphaville. Linhas retas, esquadrias do piso ao teto, piscina com borda infinita e integração total entre área social e jardim.",
      features: [
        "Piscina com borda infinita",
        "5 suítes, sendo 1 master no térreo",
        "Cozinha gourmet integrada",
        "Escritório e academia privativos",
        "Energia solar + aquecimento",
        "Condomínio com segurança 24h",
      ],
    },
  ],
};

function ensureDataFile() {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  if (!fs.existsSync(dataFile)) {
    fs.writeFileSync(dataFile, JSON.stringify(DEFAULT_CONFIG, null, 2), "utf8");
  }
}

function readConfig() {
  ensureDataFile();
  const raw = fs.readFileSync(dataFile, "utf8");
  try {
    return JSON.parse(raw);
  } catch {
    return DEFAULT_CONFIG;
  }
}

function writeConfig(next) {
  ensureDataFile();
  const clean = {
    agent: { ...DEFAULT_CONFIG.agent, ...(next?.agent ?? {}) },
    properties: Array.isArray(next?.properties) && next.properties.length > 0 ? next.properties : DEFAULT_CONFIG.properties,
  };
  fs.writeFileSync(dataFile, JSON.stringify(clean, null, 2), "utf8");
  return clean;
}

function safeEqual(a, b) {
  const ha = crypto.createHash("sha256").update(a).digest();
  const hb = crypto.createHash("sha256").update(b).digest();
  return crypto.timingSafeEqual(ha, hb);
}

function requireAdmin(req, res, next) {
  const header = String(req.headers.authorization ?? "");
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  const expiresAt = sessions.get(token);
  if (!token || !expiresAt || expiresAt < Date.now()) {
    sessions.delete(token);
    return res.status(401).json({ success: false, message: "Não autorizado" });
  }
  return next();
}

// Limite simples de tentativas de login por IP
const loginAttempts = new Map(); // ip -> { count, resetAt }
function loginRateLimit(req, res, next) {
  const ip = req.ip ?? "unknown";
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 });
    return next();
  }
  if (entry.count >= 10) {
    return res.status(429).json({ success: false, message: "Muitas tentativas. Tente mais tarde." });
  }
  entry.count += 1;
  return next();
}

app.use(express.json({ limit: "10mb" }));

app.post("/api/login", loginRateLimit, (req, res) => {
  const password = String(req.body?.password ?? "");
  if (safeEqual(password, ADMIN_PASSWORD)) {
    const token = crypto.randomBytes(32).toString("hex");
    sessions.set(token, Date.now() + SESSION_TTL_MS);
    return res.json({ success: true, token });
  }
  return res.status(401).json({ success: false, message: "Senha inválida" });
});

app.get("/api/site-config", (_req, res) => {
  const config = readConfig();
  return res.json(config);
});

app.post("/api/site-config", requireAdmin, (req, res) => {
  const next = req.body ?? {};
  const config = writeConfig(next);
  return res.json(config);
});

app.post("/api/site-reset", requireAdmin, (_req, res) => {
  const config = writeConfig(DEFAULT_CONFIG);
  return res.json(config);
});

app.listen(3001, () => {
  console.log("Modal United API running on http://localhost:3001");
});
