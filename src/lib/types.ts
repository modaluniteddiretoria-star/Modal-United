export type PropertyCategory =
  | "casa"
  | "apartamento"
  | "cobertura"
  | "loft"
  | "studio";

export type PropertyTransaction = "venda" | "aluguel";

// ativo aparece no site; pausado e vendido ficam só no painel
export type PropertyStatus = "ativo" | "pausado" | "vendido";

export interface Property {
  id: string;
  title: string;
  typeLabel: string;
  category: PropertyCategory;
  transaction: PropertyTransaction;
  price: number; // no aluguel, valor mensal
  condo?: number;
  location: string;
  city: string;
  beds: number;
  baths: number;
  area: number;
  image: string; // capa
  gallery: string[]; // fotos extras, em ordem
  badge?: "Novo" | "Exclusivo" | "Destaque";
  description: string;
  features: string[];
  status?: PropertyStatus; // ausente = ativo
  sortOrder?: number; // menor aparece primeiro
}

export interface Booking {
  id: string;
  code: string;
  propertyId: string;
  date: string; // ISO yyyy-mm-dd (local)
  time: string; // HH:mm
  name: string;
  phone: string;
  email?: string;
  note?: string;
  createdAt: number;
}
