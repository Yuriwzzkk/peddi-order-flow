import { supabase } from "@/lib/supabase";
import type { Order, OrderStatus, OrderItem } from "@/types";
import { dispatchAndQueue } from "@/services/n8n-dispatch";

function formatOrder(raw: any): Order {
  return {
    id: raw.id,
    restaurant_id: raw.restaurant_id,
    customer_id: raw.customer_id,
    customer_name: raw.customers?.name ?? raw.customer_name ?? "Desconhecido",
    customer_phone: raw.customers?.phone ?? raw.customer_phone ?? "",
    attendant_id: raw.attendant_id,
    delivery_person_id: raw.delivery_person_id,
    channel: raw.channel ?? "whatsapp",
    type: raw.type ?? "delivery",
    status: raw.status ?? "new",
    items: (raw.items ?? []) as OrderItem[],
    total: Number(raw.total) || 0,
    payment_method: raw.payment_method,
    change_for: raw.change_for ? Number(raw.change_for) : null,
    observation: raw.observation ?? "",
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
}

export async function listOrders(restaurantId: string): Promise<Order[]> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, customers(name, phone)")
    .eq("restaurant_id", restaurantId)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return (data ?? []).map(formatOrder);
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const { data, error } = await supabase
    .from("orders")
    .select("*, customers(name, phone)")
    .eq("id", orderId)
    .single();

  if (error) throw error;
  return data ? formatOrder(data) : null;
}

export async function updateOrderStatus(
  orderId: string,
  status: OrderStatus
): Promise<void> {
  const { error } = await supabase
    .from("orders")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", orderId);

  if (error) throw error;
}

export async function createOrder(
  restaurantId: string,
  data: {
    customer_id?: string;
    customer_name?: string;
    channel?: string;
    type?: string;
    items: OrderItem[];
    total: number;
    observation?: string;
  }
): Promise<Order> {
  const { data: order, error } = await supabase
    .from("orders")
    .insert({
      restaurant_id: restaurantId,
      customer_id: data.customer_id ?? null,
      channel: data.channel ?? "whatsapp",
      type: data.type ?? "delivery",
      status: "new",
      items: data.items,
      total: data.total,
      observation: data.observation ?? "",
    })
    .select("*, customers(name, phone)")
    .single();

  if (error) throw error;
  return formatOrder(order);
}

export async function updateOrderStatusRPC(orderId: string, newStatus: string, restaurantId?: string): Promise<Order> {
  const { data, error } = await supabase.rpc("update_order_status", {
    p_order_id: orderId,
    p_new_status: newStatus,
  });
  if (error) throw error;
  if (restaurantId) dispatchAndQueue(restaurantId, "order_status_changed", { order_id: orderId, new_status: newStatus }).catch(() => {});
  return formatOrder(data);
}

export async function assignDeliveryRPC(orderId: string, deliveryPersonId: string, restaurantId?: string): Promise<Order> {
  const { data, error } = await supabase.rpc("assign_delivery_safe", {
    p_order_id: orderId,
    p_delivery_person_id: deliveryPersonId,
  });
  if (error) throw error;
  if (restaurantId) dispatchAndQueue(restaurantId, "delivery_assigned", { order_id: orderId, delivery_person_id: deliveryPersonId }).catch(() => {});
  return formatOrder(data);
}

export async function completeDeliveryRPC(orderId: string, restaurantId?: string): Promise<Order> {
  const { data, error } = await supabase.rpc("complete_delivery_safe", {
    p_order_id: orderId,
  });
  if (error) throw error;
  if (restaurantId) dispatchAndQueue(restaurantId, "order_status_changed", { order_id: orderId, new_status: "delivered" }).catch(() => {});
  return formatOrder(data);
}

export async function createOrderWithItems(
  restaurantId: string,
  customerId: string,
  data: {
    type?: string;
    channel?: string;
    items: { menu_item_id: string; quantity: number; notes?: string }[];
    notes?: string;
    delivery_address?: string;
    payment_method?: string;
    change_for?: number;
    observation?: string;
  }
): Promise<Order> {
  const { data: result, error } = await supabase.rpc("create_order_with_items_safe", {
    p_restaurant_id: restaurantId,
    p_customer_id: customerId,
    p_type: data.type ?? "delivery",
    p_channel: data.channel ?? "whatsapp",
    p_items: JSON.stringify(data.items),
    p_notes: data.notes ?? "",
    p_delivery_address: data.delivery_address ?? null,
    p_payment_method: data.payment_method ?? null,
    p_change_for: data.change_for ?? null,
    p_observation: data.observation ?? "",
  });
  if (error) throw error;
  return formatOrder(result?.order ?? result);
}

export async function getMenuWithCategories(restaurantId: string): Promise<{ category: Record<string, unknown>; items: Record<string, unknown>[] }[]> {
  const { data, error } = await supabase.rpc("get_menu_with_categories", { p_restaurant_id: restaurantId });
  if (error) throw error;
  return data ?? [];
}

export async function getConversationsWithLastMessage(restaurantId: string): Promise<Record<string, unknown>[]> {
  const { data, error } = await supabase.rpc("get_conversations_with_last_message_safe", { p_restaurant_id: restaurantId });
  if (error) throw error;
  return data ?? [];
}

export function subscribeOrders(
  restaurantId: string,
  callback: (order: Order, event: "INSERT" | "UPDATE" | "DELETE") => void
) {
  return supabase
    .channel("orders-channel")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "orders",
        filter: `restaurant_id=eq.${restaurantId}`,
      },
      async (payload) => {
        if (payload.eventType === "INSERT" || payload.eventType === "UPDATE") {
          const order = await getOrder(payload.new.id);
          if (order) callback(order, payload.eventType);
        }
      }
    )
    .subscribe();
}
