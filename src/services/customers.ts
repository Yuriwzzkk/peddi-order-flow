import { supabase } from "@/lib/supabase";
import type { Customer } from "@/types";

export async function listCustomers(restaurantId: string): Promise<Customer[]> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("total_orders", { ascending: false });

  if (error) throw error;
  return data ?? [];
}

export async function getCustomer(customerId: string): Promise<Customer | null> {
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", customerId)
    .single();

  if (error) throw error;
  return data;
}
