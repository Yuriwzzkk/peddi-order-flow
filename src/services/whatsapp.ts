import { supabase } from "@/lib/supabase";

const EDGE_FUNCTIONS_URL = import.meta.env.VITE_SUPABASE_URL + "/functions/v1";

export async function sendWhatsAppMessage(
  restaurantId: string,
  to: string,
  message: string
): Promise<void> {
  const { error } = await supabase.functions.invoke("send-whatsapp", {
    body: { restaurantId, to, message, messageType: "text" },
  });
  if (error) throw error;
}

export async function getZApiConfig(restaurantId: string) {
  const { data, error } = await supabase
    .from("zapi_config")
    .select("*")
    .eq("restaurant_id", restaurantId)
    .single();
  if (error && error.code !== "PGRST116") throw error;
  return data;
}

export async function saveZApiConfig(
  restaurantId: string,
  config: { api_token: string; instance_id: string }
) {
  const { data, error } = await supabase.from("zapi_config").upsert({
    restaurant_id: restaurantId,
    api_token: config.api_token,
    instance_id: config.instance_id,
  }).select().single();
  if (error) throw error;
  return data;
}

export async function getWebhookUrl(functionName: string): Promise<string> {
  return `${EDGE_FUNCTIONS_URL}/${functionName}`;
}
