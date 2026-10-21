import { supabase } from "./supabase";

export type ProposalStatus = "enviada" | "em_analise" | "aceita" | "recusada" | "contraproposta";
export type ProposalPayment = "a_vista" | "financiamento" | "permuta" | "outro";

export interface Proposal {
  id: string;
  client_id: string;
  property_id: string | null;
  property_title: string;
  amount: number;
  payment: ProposalPayment;
  message: string | null;
  status: ProposalStatus;
  agent_note: string | null;
  created_at: string;
  updated_at: string;
}

export const PROPOSAL_STATUS: Record<ProposalStatus, { label: string; tone: string }> = {
  enviada: { label: "Enviada", tone: "bg-cream-100/10 text-cream-200" },
  em_analise: { label: "Em análise", tone: "bg-sky-400/15 text-sky-200" },
  aceita: { label: "Aceita", tone: "bg-emerald-400/15 text-emerald-200" },
  recusada: { label: "Recusada", tone: "bg-red-400/15 text-red-200" },
  contraproposta: { label: "Contraproposta", tone: "bg-gold-500/20 text-gold-200" },
};

export const PAYMENT_LABEL: Record<ProposalPayment, string> = {
  a_vista: "À vista",
  financiamento: "Financiamento",
  permuta: "Permuta",
  outro: "Outro",
};

export async function createProposal(input: {
  propertyId: string;
  amount: number;
  payment: ProposalPayment;
  message: string;
}): Promise<void> {
  const { error } = await supabase.rpc("create_proposal", {
    p_property_id: input.propertyId,
    p_amount: input.amount,
    p_payment: input.payment,
    p_message: input.message,
  });
  if (error) throw new Error(error.message || "Não foi possível enviar a proposta.");
}

// Propostas do cliente logado (o RLS devolve só as dele)
export async function fetchMyProposals(): Promise<Proposal[]> {
  const { data, error } = await supabase.from("proposals").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((p) => ({ ...p, amount: Number(p.amount) })) as Proposal[];
}
