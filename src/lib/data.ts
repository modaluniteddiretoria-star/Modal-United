import { useSyncExternalStore } from "react";
import type { Property } from "./types";
import { supabase } from "./supabase";

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

export type Agent = typeof DEFAULT_AGENT;

export interface SiteData {
  agent: Agent;
  properties: Property[];
  status: "loading" | "ready" | "error";
}

// ---------------------------------------------------------------------------
// Store reativo (useSyncExternalStore): perfil e imóveis vindos do Supabase
// ---------------------------------------------------------------------------
let state: SiteData = {
  agent: { ...DEFAULT_AGENT },
  properties: [...DEFAULT_PROPERTIES],
  status: "loading",
};
const listeners = new Set<() => void>();

function setState(next: Partial<SiteData>) {
  state = { ...state, ...next };
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useSiteData(): SiteData {
  return useSyncExternalStore(subscribe, () => state);
}

export function getSiteData(): SiteData {
  return state;
}

// ---------------------------------------------------------------------------
// Mapeamento banco <-> app
// ---------------------------------------------------------------------------
interface PropertyRow {
  id: string;
  title: string;
  type_label: string;
  category: Property["category"];
  price: number;
  condo: number | null;
  location: string;
  city: string;
  beds: number;
  baths: number;
  area: number;
  image: string;
  badge: Property["badge"] | null;
  description: string;
  features: string[];
  sort_order: number;
}

function fromRow(r: PropertyRow): Property {
  return {
    id: r.id,
    title: r.title,
    typeLabel: r.type_label,
    category: r.category,
    price: Number(r.price),
    condo: r.condo == null ? undefined : Number(r.condo),
    location: r.location,
    city: r.city,
    beds: r.beds,
    baths: r.baths,
    area: r.area,
    image: r.image,
    badge: r.badge ?? undefined,
    description: r.description,
    features: r.features ?? [],
  };
}

function toRow(p: Property, index: number): PropertyRow {
  return {
    id: p.id,
    title: p.title.trim(),
    type_label: p.typeLabel.trim(),
    category: p.category,
    price: p.price,
    condo: p.condo ?? null,
    location: p.location.trim(),
    city: p.city.trim(),
    beds: p.beds,
    baths: p.baths,
    area: p.area,
    image: p.image.trim(),
    badge: p.badge ?? null,
    description: p.description.trim(),
    features: p.features.map((f) => f.trim()).filter(Boolean),
    sort_order: index,
  };
}

// ---------------------------------------------------------------------------
// Leitura e escrita
// ---------------------------------------------------------------------------
export async function loadSiteData(): Promise<void> {
  const [agentRes, propsRes] = await Promise.all([
    supabase.from("agent_profile").select("*").eq("id", 1).maybeSingle(),
    supabase.from("properties").select("*").order("sort_order").order("created_at"),
  ]);

  if (agentRes.error || propsRes.error) {
    console.error("Falha ao carregar dados do site", agentRes.error ?? propsRes.error);
    setState({ status: "error" });
    return;
  }

  const row = agentRes.data as (Agent & { id: number; updated_at: string }) | null;
  const agent: Agent = row
    ? {
        brand: row.brand,
        name: row.name,
        role: row.role,
        creci: row.creci,
        phone: row.phone,
        whatsapp: row.whatsapp,
        email: row.email,
        instagram: row.instagram,
        city: row.city,
        photo: row.photo,
        rating: Number(row.rating),
        reviews: row.reviews,
        years: row.years,
        sold: row.sold,
      }
    : { ...DEFAULT_AGENT };

  setState({
    agent,
    properties: (propsRes.data as PropertyRow[]).map(fromRow),
    status: "ready",
  });
}

// Salva perfil e imóveis (requer sessão de admin; o RLS bloqueia os demais)
export async function saveSiteData(agent: Agent, properties: Property[]): Promise<void> {
  const { error: agentError } = await supabase
    .from("agent_profile")
    .update({ ...agent, whatsapp: agent.whatsapp.replace(/\D/g, "") })
    .eq("id", 1);
  if (agentError) throw agentError;

  if (properties.length > 0) {
    const { error } = await supabase.from("properties").upsert(properties.map(toRow));
    if (error) throw error;
  }

  const keep = new Set(properties.map((p) => p.id));
  const removed = state.properties.filter((p) => !keep.has(p.id)).map((p) => p.id);
  if (removed.length > 0) {
    const { error } = await supabase.from("properties").delete().in("id", removed);
    if (error) throw error;
  }

  await loadSiteData();
}

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
