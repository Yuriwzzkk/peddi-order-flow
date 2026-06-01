import { supabase } from "@/lib/supabase";
import type { N8nWebhook } from "./n8n";

type DispatchResult = {
  webhook_id: string;
  webhook_name: string;
  event: string;
  status: number | "error";
  error?: string;
  timestamp: string;
};

export async function dispatchToWebhooks(
  restaurantId: string,
  event: string,
  payload: Record<string, unknown> = {}
): Promise<DispatchResult[]> {
  const { data: webhooks, error } = await supabase
    .from("n8n_webhooks")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .eq("trigger_event", event)
    .eq("active", true);

  if (error) throw error;
  if (!webhooks?.length) return [];

  const results: DispatchResult[] = [];

  const HTTPS_RE = /^https:\/\/[a-zA-Z0-9][a-zA-Z0-9.-]+[a-zA-Z0-9](:[0-9]+)?(\/.*)?$/;

  for (const wh of webhooks) {
    try {
      if (!HTTPS_RE.test(wh.webhook_url)) {
        throw new Error(`SSRF blocked: webhook ${wh.id} URL must use HTTPS (got: ${wh.webhook_url.slice(0, 50)})`);
      }
      const res = await fetch(wh.webhook_url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(wh.headers || {}),
        },
        body: JSON.stringify({
          event,
          restaurant_id: restaurantId,
          timestamp: new Date().toISOString(),
          ...payload,
        }),
      });

      await supabase
        .from("n8n_webhooks")
        .update({ last_triggered_at: new Date().toISOString() })
        .eq("id", wh.id);

      results.push({
        webhook_id: wh.id,
        webhook_name: wh.name,
        event,
        status: res.status,
        timestamp: new Date().toISOString(),
      });
    } catch (e: any) {
      results.push({
        webhook_id: wh.id,
        webhook_name: wh.name,
        event,
        status: "error",
        error: e.message,
        timestamp: new Date().toISOString(),
      });
    }
  }

  return results;
}

export async function dispatchPendingAutomationQueue(
  restaurantId?: string,
  limit: number = 50
): Promise<{ processed: number; results: DispatchResult[] }> {
  let query = supabase
    .from("automation_queue")
    .select("*")
    .eq("processed", false)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (restaurantId) query = query.eq("restaurant_id", restaurantId);

  const { data: events, error } = await query;
  if (error) throw error;
  if (!events?.length) return { processed: 0, results: [] };

  let processed = 0;
  const allResults: DispatchResult[] = [];

  for (const event of events) {
    try {
      const results = await dispatchToWebhooks(event.restaurant_id, event.event_type, {
        entity_id: event.entity_id,
        data: event.payload,
      });

      await supabase
        .from("automation_queue")
        .update({ processed: true, processed_at: new Date().toISOString() })
        .eq("id", event.id);

      processed++;
      allResults.push(...results);
    } catch (e: any) {
      await supabase
        .from("automation_queue")
        .update({ processed: true, processed_at: new Date().toISOString(), error: e.message })
        .eq("id", event.id);
      processed++;
    }
  }

  return { processed, results: allResults };
}

export async function dispatchAndQueue(
  restaurantId: string,
  event: string,
  payload: Record<string, unknown> = {}
): Promise<DispatchResult[]> {
  const results = await dispatchToWebhooks(restaurantId, event, payload);
  return results;
}
