import { supabase } from "../lib/supabase";

export type N8nWebhook = {
  id: string;
  restaurant_id: string;
  trigger_event: string;
  webhook_url: string;
  headers?: Record<string, string>;
  active: boolean;
  last_triggered_at?: string;
  created_at: string;
};

export async function listN8nWebhooks(restaurantId: string): Promise<N8nWebhook[]> {
  const { data, error } = await supabase
    .from("n8n_webhooks")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .order("created_at");
  if (error) throw error;
  return data ?? [];
}

export async function createN8nWebhook(
  restaurantId: string,
  triggerEvent: string,
  webhookUrl: string,
  headers?: Record<string, string>
): Promise<N8nWebhook> {
  const { data, error } = await supabase
    .from("n8n_webhooks")
    .insert({ restaurant_id: restaurantId, trigger_event: triggerEvent, webhook_url: webhookUrl, headers, active: true })
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function toggleN8nWebhook(id: string, active: boolean): Promise<void> {
  const { error } = await supabase.from("n8n_webhooks").update({ active }).eq("id", id);
  if (error) throw error;
}

export async function deleteN8nWebhook(id: string): Promise<void> {
  const { error } = await supabase.from("n8n_webhooks").delete().eq("id", id);
  if (error) throw error;
}

export async function triggerN8nEvent(
  restaurantId: string,
  event: string,
  payload?: Record<string, unknown>
): Promise<void> {
  await supabase.functions.invoke("n8n-webhook", {
    body: { action: event, restaurant_id: restaurantId, ...payload },
  }).catch(() => {});
}

export async function processAutomationQueue(restaurantId?: string): Promise<number> {
  const { data, error } = await supabase.rpc("process_automation_queue", {
    p_restaurant_id: restaurantId ?? null,
  });
  if (error) throw error;
  return data ?? 0;
}
