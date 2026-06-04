import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { restaurantId, to, message, messageType = "text" } = await req.json();
    if (!restaurantId || !to || !message) {
      return new Response(JSON.stringify({ error: "Missing restaurantId/to/message" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: zapiConfig, error: cfgErr } = await supabase
      .from("zapi_config")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .eq("active", true)
      .maybeSingle();

    if (cfgErr) throw cfgErr;

    if (!zapiConfig?.instance_id || !zapiConfig?.api_token) {
      await supabase.from("whatsapp_notification_queue").insert({
        restaurant_id: restaurantId,
        recipient_phone: to,
        message,
        notification_type: "manual",
        status: "failed",
        metadata: { reason: "no_zapi_config" },
      });
      return new Response(
        JSON.stringify({ sent: false, error: "Z-API não configurado para este restaurante" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const zapiUrl = `https://api.z-api.io/instances/${zapiConfig.instance_id}/token/${zapiConfig.api_token}/send-${messageType}`;
    const zapiRes = await fetch(zapiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: to, message }),
    });

    const zapiBody = await zapiRes.text();
    let zapiJson: any = null;
    try { zapiJson = JSON.parse(zapiBody); } catch { zapiJson = { raw: zapiBody }; }

    await supabase.from("whatsapp_notification_queue").insert({
      restaurant_id: restaurantId,
      recipient_phone: to,
      message,
      notification_type: "manual",
      status: zapiRes.ok ? "sent" : "failed",
      metadata: { zapi_response: zapiJson, status_code: zapiRes.status },
    });

    if (!zapiRes.ok) {
      return new Response(
        JSON.stringify({ sent: false, error: "Z-API returned error", details: zapiJson }),
        { status: zapiRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ sent: true, zapi_response: zapiJson }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
