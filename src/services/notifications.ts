import { supabase } from "@/lib/supabase";
import type { Notification } from "@/types";

export async function listPendingNotifications(restaurantId?: string): Promise<Notification[]> {
  let q = supabase.from("whatsapp_notification_queue").select("*").eq("status", "pending").order("priority", { ascending: false }).order("created_at");
  if (restaurantId) q = q.eq("restaurant_id", restaurantId);
  const { data, error } = await q;
  if (error) throw error;
  return data ?? [];
}

export async function markNotificationSent(id: string, sentAt?: string): Promise<void> {
  const { error } = await supabase
    .from("whatsapp_notification_queue")
    .update({ status: "sent", sent_at: sentAt ?? new Date().toISOString() })
    .eq("id", id);
  if (error) throw error;
}

export async function markNotificationFailed(id: string, errorMsg: string): Promise<void> {
  const { error } = await supabase
    .from("whatsapp_notification_queue")
    .update({ status: "failed", error: errorMsg })
    .eq("id", id);
  if (error) throw error;
}

export async function sendNotification(
  restaurantId: string,
  recipientPhone: string,
  message: string,
  options?: { type?: string; conversationId?: string; priority?: number; metadata?: Record<string, unknown> }
): Promise<string> {
  const { data, error } = await supabase.rpc("send_whatsapp_notification", {
    p_restaurant_id: restaurantId,
    p_recipient_phone: recipientPhone,
    p_message: message,
    p_type: options?.type ?? "custom",
    p_conversation_id: options?.conversationId ?? null,
    p_metadata: options?.metadata ?? {},
  });
  if (error) throw error;
  return data;
}

export async function processPendingNotifications(limit?: number): Promise<number> {
  const { data, error } = await supabase.rpc("process_pending_notifications", { p_limit: limit ?? 20 });
  if (error) throw error;
  return data ?? 0;
}
