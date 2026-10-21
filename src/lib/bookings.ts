import type { Booking } from "./types";
import { supabase } from "./supabase";

// Visitas do cliente logado (o RLS devolve só as dele)
export async function fetchMyBookings(): Promise<Booking[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id, code, property_id, visit_date, visit_time, name, phone, email, note, created_at")
    .eq("status", "confirmed")
    .order("visit_date")
    .order("visit_time");
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    code: r.code,
    propertyId: r.property_id ?? "",
    date: r.visit_date,
    time: r.visit_time,
    name: r.name,
    phone: r.phone,
    email: r.email ?? undefined,
    note: r.note ?? undefined,
    createdAt: new Date(r.created_at).getTime(),
  }));
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

// Agendamento do cliente logado (Edge Function create-booking; nome e WhatsApp vêm do cadastro)
export async function createBooking(input: Omit<Booking, "id" | "code" | "createdAt">): Promise<Booking> {
  const { data, error } = await supabase.functions.invoke("create-booking", { body: input });
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
