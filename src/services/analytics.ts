import { supabase } from "@/lib/supabase";

export async function getOrderReport(
  restaurantId: string,
  period: "day" | "week" | "month" = "month",
  limit: number = 30
) {
  const { data, error } = await supabase.rpc("get_order_report", {
    p_restaurant_id: restaurantId,
    p_period: period,
    p_limit: limit,
  });
  if (error) throw error;
  return data;
}

export async function getCustomerAnalytics(restaurantId: string) {
  const { data, error } = await supabase.rpc("get_customer_analytics", {
    p_restaurant_id: restaurantId,
  });
  if (error) throw error;
  return data;
}

export async function getMenuPerformance(restaurantId: string) {
  const { data, error } = await supabase.rpc("get_menu_performance", {
    p_restaurant_id: restaurantId,
  });
  if (error) throw error;
  return data;
}

export async function getDeliveryPerformance(restaurantId: string) {
  const { data, error } = await supabase.rpc("get_delivery_performance", {
    p_restaurant_id: restaurantId,
  });
  if (error) throw error;
  return data;
}

export async function getFinancialReport(restaurantId: string, days: number = 30) {
  const { data, error } = await supabase.rpc("get_financial_report", {
    p_restaurant_id: restaurantId,
    p_days: days,
  });
  if (error) throw error;
  return data;
}
