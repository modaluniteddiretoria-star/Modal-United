import type { Booking } from "./types";

const KEY = "md-imoveis-agendamentos-v1";

export function loadBookings(): Booking[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as Booking[]) : [];
  } catch {
    return [];
  }
}

export function saveBookings(list: Booking[]): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // armazenamento indisponível — mantém em memória
  }
}
