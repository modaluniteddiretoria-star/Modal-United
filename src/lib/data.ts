import type { Property } from "./types";

export const DEFAULT_AGENT = {
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
};

export const DEFAULT_PROPERTIES: Property[] = [
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
  {
    id: "apartamento-jardins",
    title: "Apartamento Jardins Signature",
    typeLabel: "Apartamento",
    category: "apartamento",
    price: 1780000,
    condo: 2400,
    location: "Jardins",
    city: "São Paulo",
    beds: 3,
    baths: 2,
    area: 186,
    image: "/images/prop-3.jpg",
    description:
      "Apartamento reformado por escritório renomado nos Jardins. Projeto sofisticado com marcenaria sob medida, piso em carvalho europeu e iluminação natural abundante durante todo o dia.",
    features: [
      "Totalmente reformado",
      "Marcenaria sob medida",
      "Living para 3 ambientes",
      "Varanda com fechamento em vidro",
      "3 suítes com boa ventilação",
      "2 vagas demarcadas",
    ],
  },
  {
    id: "loft-vila-madalena",
    title: "Loft Brick 1904",
    typeLabel: "Loft",
    category: "loft",
    price: 940000,
    condo: 980,
    location: "Vila Madalena",
    city: "São Paulo",
    beds: 2,
    baths: 2,
    area: 124,
    image: "/images/prop-4.jpg",
    badge: "Novo",
    description:
      "Loft industrial autêntico em edifício tombado de 1904, na Vila Madalena. Tijolos aparentes, pé-direito de 4,2 m, mezanino em estrutura metálica e iluminação de galeria. Um apartamento com alma de ateliê.",
    features: [
      "Tijolos aparentes originais",
      "Pé-direito de 4,2 metros",
      "Mezanino com escritório",
      "Edifício histórico tombado",
      "A 5 min do metrô Vila Madalena",
      "Aceita pet",
    ],
  },
  {
    id: "casa-haras-itu",
    title: "Casa de Campo Haras Santa Maria",
    typeLabel: "Casa de Campo",
    category: "casa",
    price: 2150000,
    condo: 1500,
    location: "Haras Santa Maria",
    city: "Itu",
    beds: 4,
    baths: 4,
    area: 520,
    image: "/images/prop-5.jpg",
    description:
      "Refúgio de campo a 1h de São Paulo. Arquitetura que abraça a paisagem, varandas amplas voltadas para o pôr do sol, piscina aquecida e pomar. Perfeita para fins de semana em família ou home office definitivo.",
    features: [
      "Terreno de 2.400 m²",
      "Piscina aquecida com raia",
      "Varanda com vista para o vale",
      "Pomar e horta orgânica",
      "Espaço gourmet com forno a lenha",
      "Portaria 24h e heliponto no condomínio",
    ],
  },
  {
    id: "studio-pinheiros",
    title: "Studio Arte Pinheiros",
    typeLabel: "Studio",
    category: "studio",
    price: 690000,
    condo: 720,
    location: "Pinheiros",
    city: "São Paulo",
    beds: 1,
    baths: 1,
    area: 54,
    image: "/images/prop-6.jpg",
    badge: "Novo",
    description:
      "Studio projetado para quem vive a cidade. Planta inteligente com integração total, armários ocultos, varanda de frente para o oeste e prédio com rooftop colaborativo. Excelente liquidez para investidores.",
    features: [
      "Projeto de interiores incluso",
      "Varanda com vista oeste",
      "Rooftop com coworking no prédio",
      "Lavanderia coletiva premium",
      "A 400 m da Faria Lima",
      "Ótimo potencial de locação",
    ],
  },
];

export let AGENT = { ...DEFAULT_AGENT };
export let PROPERTIES: Property[] = [...DEFAULT_PROPERTIES];

const SITE_STORAGE_KEY = "modal-united-site-config-v1";
const ADMIN_TOKEN_KEY = "modal-united-admin-token";

// Token emitido pelo servidor no login; fica só na sessão do navegador
export function getAdminToken(): string | null {
  try {
    return window.sessionStorage.getItem(ADMIN_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setAdminToken(token: string | null) {
  try {
    if (token) window.sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
    else window.sessionStorage.removeItem(ADMIN_TOKEN_KEY);
  } catch {
    // armazenamento indisponível
  }
}

function adminHeaders(): HeadersInit {
  const token = getAdminToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

function normalizeAgent(profile: Partial<typeof DEFAULT_AGENT> | undefined) {
  return { ...DEFAULT_AGENT, ...profile };
}

function normalizeProperties(list: Property[] | undefined) {
  if (!Array.isArray(list) || list.length === 0) return [...DEFAULT_PROPERTIES];
  return list.map((property) => ({
    ...property,
    badge: property.badge ?? undefined,
    condo: property.condo ?? undefined,
  }));
}

export function loadSiteData() {
  if (typeof window === "undefined") {
    return { agent: { ...DEFAULT_AGENT }, properties: [...DEFAULT_PROPERTIES] };
  }

  const raw = window.localStorage.getItem(SITE_STORAGE_KEY);
  if (!raw) {
    AGENT = { ...DEFAULT_AGENT };
    PROPERTIES = [...DEFAULT_PROPERTIES];
    return { agent: AGENT, properties: PROPERTIES };
  }

  try {
    const parsed = JSON.parse(raw) as { agent?: Partial<typeof DEFAULT_AGENT>; properties?: Property[] };
    const agent = normalizeAgent(parsed.agent);
    const properties = normalizeProperties(parsed.properties);
    AGENT = agent;
    PROPERTIES = properties;
    return { agent, properties };
  } catch {
    AGENT = { ...DEFAULT_AGENT };
    PROPERTIES = [...DEFAULT_PROPERTIES];
    return { agent: AGENT, properties: PROPERTIES };
  }
}

export function saveSiteData(agent: typeof DEFAULT_AGENT, properties: Property[]) {
  const nextAgent = normalizeAgent(agent);
  const nextProperties = normalizeProperties(properties);
  AGENT = nextAgent;
  PROPERTIES = nextProperties;

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      SITE_STORAGE_KEY,
      JSON.stringify({ agent: nextAgent, properties: nextProperties })
    );
  }

  return { agent: nextAgent, properties: nextProperties };
}

export function resetSiteData() {
  AGENT = { ...DEFAULT_AGENT };
  PROPERTIES = [...DEFAULT_PROPERTIES];

  if (typeof window !== "undefined") {
    window.localStorage.removeItem(SITE_STORAGE_KEY);
  }

  return { agent: AGENT, properties: PROPERTIES };
}

export async function loadRemoteSiteData() {
  if (typeof window === "undefined") {
    return loadSiteData();
  }

  try {
    const response = await fetch("/api/site-config");
    if (!response.ok) throw new Error("API unavailable");
    const payload = (await response.json()) as {
      agent?: Partial<typeof DEFAULT_AGENT>;
      properties?: Property[];
    };
    const agent = normalizeAgent(payload.agent);
    const properties = normalizeProperties(payload.properties);
    AGENT = agent;
    PROPERTIES = properties;
    window.localStorage.setItem(SITE_STORAGE_KEY, JSON.stringify({ agent, properties }));
    return { agent, properties };
  } catch {
    return loadSiteData();
  }
}

export async function saveRemoteSiteData(agent: typeof DEFAULT_AGENT, properties: Property[]) {
  const nextAgent = normalizeAgent(agent);
  const nextProperties = normalizeProperties(properties);

  if (typeof window !== "undefined") {
    window.localStorage.setItem(
      SITE_STORAGE_KEY,
      JSON.stringify({ agent: nextAgent, properties: nextProperties })
    );
  }

  try {
    const response = await fetch("/api/site-config", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify({ agent: nextAgent, properties: nextProperties }),
    });
    if (!response.ok) throw new Error("Save failed");
    const payload = (await response.json()) as { agent: typeof DEFAULT_AGENT; properties: Property[] };
    AGENT = normalizeAgent(payload.agent);
    PROPERTIES = normalizeProperties(payload.properties);
    return { agent: AGENT, properties: PROPERTIES };
  } catch {
    return saveSiteData(nextAgent, nextProperties);
  }
}

export async function resetRemoteSiteData() {
  const next = { agent: { ...DEFAULT_AGENT }, properties: [...DEFAULT_PROPERTIES] };
  try {
    const response = await fetch("/api/site-reset", {
      method: "POST",
      headers: adminHeaders(),
      body: JSON.stringify(next),
    });
    if (!response.ok) throw new Error("Reset failed");
    const payload = (await response.json()) as { agent: typeof DEFAULT_AGENT; properties: Property[] };
    AGENT = normalizeAgent(payload.agent);
    PROPERTIES = normalizeProperties(payload.properties);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(SITE_STORAGE_KEY, JSON.stringify({ agent: AGENT, properties: PROPERTIES }));
    }
    return { agent: AGENT, properties: PROPERTIES };
  } catch {
    return resetSiteData();
  }
}

loadSiteData();

export const TESTIMONIALS = [
  {
    name: "Fernanda e Ricardo Alves",
    role: "Compraram uma cobertura em Moema",
    quote:
      "A Maia entendeu em uma conversa o que procurávamos há dois anos. Em três semanas estávamos visitando o apartamento que hoje chamamos de lar. Impecável do início à escritura.",
    initials: "FR",
  },
  {
    name: "Dr. Paulo Henrique Sampaio",
    role: "Investidor · 3 imóveis adquiridos",
    quote:
      "Já fechei três negócios com a Maia. Análise fria dos números, negociação firme e zero enrolação. É a única consultora para quem eu ligo antes de tomar qualquer decisão imobiliária.",
    initials: "PS",
  },
  {
    name: "Juliana Mendonça",
    role: "Vendeu e comprou com a Modal United",
    quote:
      "Vendeu meu apartamento em 40 dias por um valor acima do que eu imaginava e ainda me achou a casa dos sonhos em Alphaville. O agendamento pelo site facilitou tudo — visita marcada em 2 minutos.",
    initials: "JM",
  },
];
