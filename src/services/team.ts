import { supabase } from "@/lib/supabase";
import type { Attendant } from "@/types";

export async function listAttendants(restaurantId: string): Promise<Attendant[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .in("type", ["delivery", "presencial"])
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(formatAttendant);
}

export async function createAttendant(
  restaurantId: string,
  data: { name: string; email: string; type: string; shift: string }
): Promise<Attendant> {
  const defaultPassword = "123456";

  const { data: profile, error } = await supabase.rpc("admin_create_user", {
    p_email: data.email,
    p_password: defaultPassword,
    p_name: data.name,
    p_role: data.type,
    p_restaurant_id: restaurantId,
    p_type: data.type,
    p_shift: data.shift,
  });

  if (error) throw error;
  return formatAttendant(profile);
}

function formatAttendant(raw: any): Attendant {
  return {
    id: raw.id,
    restaurant_id: raw.restaurant_id,
    name: raw.name,
    email: raw.email,
    type: raw.type,
    shift: raw.shift,
    online: raw.online ?? false,
    ordersToday: raw.orders_today ?? 0,
    revenueToday: raw.revenue_today ?? 0,
    lastAccess: raw.last_access ?? raw.updated_at ?? null,
  };
}
