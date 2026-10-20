export const TIME_SLOTS = [
  "09:00",
  "09:45",
  "10:30",
  "11:15",
  "13:30",
  "14:15",
  "15:00",
  "15:45",
  "16:30",
  "17:15",
];

export function fmtDateLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export function nextDays(n: number): Date[] {
  const out: Date[] = [];
  const base = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(base);
    d.setDate(base.getDate() + i);
    out.push(d);
  }
  return out;
}

export function weekdayShort(d: Date): string {
  return d
    .toLocaleDateString("pt-BR", { weekday: "short" })
    .replace(".", "")
    .toUpperCase();
}

export function formatDisplayDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(d);
}

export function brl(v: number): string {
  return v.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    maximumFractionDigits: 0,
  });
}

export function maskPhone(v: string): string {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d.length ? `(${d}` : "";
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

export function bookingCode(): string {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 5; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return `VIS-${code}`;
}

export function uid(): string {
  return `v-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;
}

export function isSlotPast(isoDate: string, time: string): boolean {
  const today = fmtDateLocal(new Date());
  if (isoDate !== today) return false;
  const [h, m] = time.split(":").map(Number);
  const slot = new Date();
  slot.setHours(h, m, 0, 0);
  return slot.getTime() < Date.now() + 60 * 60 * 1000; // pelo menos 1h de antecedência
}

export function instagramUrl(handle: string): string {
  const user = handle.trim().replace(/^@/, "");
  return user ? `https://instagram.com/${encodeURIComponent(user)}` : "https://instagram.com";
}

export function scrollToId(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}
