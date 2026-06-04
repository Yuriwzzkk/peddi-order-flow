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

export interface SubscriptionInfo {
  id: string;
  name: string;
  city: string | null;
  plan: string;
  active: boolean;
  created_at: string;
  trial_ends: string | null;
  plan_expires_at: string | null;
  whatsapp_number: string | null;
  orders_today: number;
  revenue_today: number;
}

export async function getSubscriptions(): Promise<SubscriptionInfo[]> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, city, plan, active, created_at, trial_ends, plan_expires_at, whatsapp_number")
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export interface WhiteLabelConfig {
  brand_name: string;
  logo_url: string;
  primary_color: string;
  background_color: string;
  sidebar_color: string;
  domain_type: "subdominio" | "proprio";
  custom_domain: string;
  restaurant_id?: string;
}

export async function getWhiteLabelConfig(restaurantId: string): Promise<WhiteLabelConfig | null> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("white_label")
    .eq("id", restaurantId)
    .single();
  if (error) throw error;
  return (data?.white_label as WhiteLabelConfig) ?? null;
}

export async function saveWhiteLabelConfig(restaurantId: string, config: WhiteLabelConfig): Promise<void> {
  const { error } = await supabase
    .from("restaurants")
    .update({ white_label: config as any })
    .eq("id", restaurantId);
  if (error) throw error;
}

export interface PanelPendingRestaurant {
  id: string;
  name: string;
  slug: string;
  email: string | null;
  admin_email: string | null;
  painel_configurado: boolean;
  white_label: WhiteLabelConfig | null;
  created_at: string;
}

export async function getPanelPending(): Promise<PanelPendingRestaurant[]> {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name, slug, email, admin_email, painel_configurado, white_label, created_at")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r: any) => ({
    ...r,
    painel_configurado: r.painel_configurado ?? false,
  }));
}

export async function configureRestaurantPanel(
  restaurantId: string,
  data: {
    admin_email: string;
    admin_password: string;
    brand_name?: string;
    logo_url?: string;
    logo_path?: string;
    primary_color?: string;
    background_color?: string;
    sidebar_color?: string;
    domain_type?: "subdominio" | "proprio";
    custom_domain?: string;
  }
): Promise<{ success: boolean; panel_url?: string; email_sent?: boolean }> {
  const { data: result, error } = await supabase.functions.invoke("configure-panel", {
    body: { restaurant_id: restaurantId, ...data },
  });
  if (error) throw error;
  return result as any;
}

export function calcularDiasRestantes(dataFim: string | null): { dias: number; expirado: boolean } {
  if (!dataFim) return { dias: 0, expirado: false };
  const fim = new Date(dataFim);
  const agora = new Date();
  const diff = fim.getTime() - agora.getTime();
  const dias = Math.ceil(diff / (1000 * 60 * 60 * 24));
  return { dias: Math.max(0, dias), expirado: dias <= 0 };
}
