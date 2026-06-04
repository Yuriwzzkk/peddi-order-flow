import { supabase } from "@/lib/supabase";

export interface PaymentIntent {
  id: string;
  identifier: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  restaurant_name: string;
  plan: "starter" | "pro";
  amount: number;
  status: "pending" | "paid" | "failed" | "expired" | "refunded";
  pix_code: string | null;
  restaurant_id: string | null;
  paid_at: string | null;
  created_at: string;
}

export interface CreatePaymentInput {
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_cpf: string;
  restaurant_name: string;
  plan: "starter" | "pro";
  terms_accepted_at?: string;
  terms_version?: string;
}

export interface CreatePaymentResult {
  success: boolean;
  payment_id: string;
  identifier: string;
  pix_code: string;
  amount: number;
  expires_in_minutes: number;
}

export async function createPixPayment(input: CreatePaymentInput): Promise<CreatePaymentResult> {
  const { data, error } = await supabase.functions.invoke("syncpay-create-payment", {
    body: input,
  });
  if (error) throw error;
  return data as CreatePaymentResult;
}

export async function checkPaymentStatus(identifier: string): Promise<PaymentIntent | null> {
  // Edge function que verifica status atual
  const { data, error } = await supabase.functions.invoke("syncpay-check-status", {
    body: { identifier },
  });
  if (error) {
    console.error("Error checking status:", error);
    return null;
  }
  return (data as any)?.payment ?? null;
}

export async function listPendingPayments(): Promise<PaymentIntent[]> {
  const { data, error } = await supabase
    .from("payment_intents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PaymentIntent[];
}
