import type { Booking } from "./types";
import { supabase } from "./supabase";

// Visitas que este navegador agendou (para listar e cancelar).
// A fonte da verdade é o Supabase; aqui ficam id + código e dados de exibição.
const KEY = "modal-united-minhas-visitas-v2";

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

// Horários já reservados de um imóvel, no formato "yyyy-mm-dd|HH:mm"
export async function fetchTakenSlots(propertyId: string, from: string, to: string): Promise<Set<string>> {
  const { data, error } = await supabase.rpc("get_taken_slots", {
    p_property_id: propertyId,
    p_from: from,
    p_to: to,
  });
  if (error) throw error;
  return new Set(
    (data as { visit_date: string; visit_time: string }[]).map((r) => `${r.visit_date}|${r.visit_time}`)
  );
}

// Agendamento passa pela Edge Function create-booking, que valida o captcha
export async function createBooking(
  input: Omit<Booking, "id" | "code" | "createdAt">,
  captchaToken: string
): Promise<Booking> {
  const { data, error } = await supabase.functions.invoke("create-booking", {
    body: { ...input, token: captchaToken },
  });
  if (error) {
    let message = "Não foi possível agendar. Tente novamente.";
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.json === "function") {
      try {
        const payload = (await ctx.json()) as { error?: string };
        if (payload.error) message = payload.error;
      } catch {
        // resposta sem JSON
      }
    }
    throw new Error(message);
  }
  const row = data as { id: string; code: string };
  return { ...input, id: row.id, code: row.code, createdAt: Date.now() };
}

export async function cancelBookingRemote(b: Booking): Promise<boolean> {
  const { data, error } = await supabase.rpc("cancel_booking", { p_id: b.id, p_code: b.code });
  if (error) throw error;
  return Boolean(data);
}
