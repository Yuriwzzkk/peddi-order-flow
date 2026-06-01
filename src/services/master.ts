import { supabase } from "@/lib/supabase";

export interface MasterRestaurant {
  id: string;
  name: string;
  city: string | null;
  plan: string;
  active: boolean;
  created_at: string;
  orders_today: number;
  revenue_today: number;
  total_attendants: number;
  whatsapp: boolean;
}

export interface GlobalStats {
  total: number;
  active: number;
  trial: number;
  pro: number;
  today_orders: number;
  today_revenue: number;
  restaurants: MasterRestaurant[];
}

export async function getGlobalStats(): Promise<GlobalStats> {
  const { data, error } = await supabase.rpc("get_global_stats");
  if (error) throw error;
  return data;
}

export async function getAllRestaurantsSummary(): Promise<GlobalStats> {
  const { data, error } = await supabase.rpc("get_all_restaurants_summary");
  if (error) throw error;
  return data;
}

export async function getPlatformRevenue(days: number = 30) {
  const { data, error } = await supabase.rpc("get_platform_revenue", { p_days: days });
  if (error) throw error;
  return data;
}

export async function getRestaurantDetail(restaurantId: string) {
  const { data, error } = await supabase
    .from("restaurants")
    .select("*, profiles!inner(count), menu_items(count)")
    .eq("id", restaurantId)
    .single();
  if (error) throw error;
  return data;
}

export async function updateRestaurantPlan(
  restaurantId: string,
  plan: string,
  trialEnds?: string
) {
  const { error } = await supabase
    .from("restaurants")
    .update({ plan, trial_ends: trialEnds || null })
    .eq("id", restaurantId);
  if (error) throw error;
}

export async function toggleRestaurantActive(restaurantId: string, active: boolean) {
  const { error } = await supabase
    .from("restaurants")
    .update({ active })
    .eq("id", restaurantId);
  if (error) throw error;
}

export async function listPeddiTeam() {
  const { data, error } = await supabase
    .from("peddi_team")
    .select("*, profiles(name, email, role, avatar_url)")
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function addPeddiTeamMember(profileId: string, role: string, department: string) {
  const { data, error } = await supabase
    .from("peddi_team")
    .insert({ profile_id: profileId, role, department })
    .select("*, profiles(name, email)")
    .single();
  if (error) throw error;
  return data;
}

export async function removePeddiTeamMember(id: string) {
  const { error } = await supabase.from("peddi_team").delete().eq("id", id);
  if (error) throw error;
}
