export type PropertyCategory =
  | "casa"
  | "apartamento"
  | "cobertura"
  | "loft"
  | "studio";

export type PropertyTransaction = "venda" | "aluguel";

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
