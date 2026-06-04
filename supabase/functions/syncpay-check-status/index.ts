// Edge function: syncpay-check-status
// Verifica o status atual de um pagamento na SyncPay
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabase = createClient(supabaseUrl, serviceRoleKey);

const SYNCPAY_CLIENT_ID = Deno.env.get("SYNCPAY_CLIENT_ID") || "9bd9d69c-d42f-4d7d-936d-5c51226f84a7";
const SYNCPAY_CLIENT_SECRET = Deno.env.get("SYNCPAY_CLIENT_SECRET") || "d86751e8-7c2f-4526-ba19-f831cdc61fe0";
const SYNCPAY_BASE_URL = Deno.env.get("SYNCPAY_BASE_URL") || "https://api.syncpayments.com.br";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-signature, x-signature",
  "Access-Control-Max-Age": "86400",
};

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getSyncPayToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now() + 60000) {
    return cachedToken.token;
  }
  const res = await fetch(`${SYNCPAY_BASE_URL}/api/partner/v1/auth-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: SYNCPAY_CLIENT_ID,
      client_secret: SYNCPAY_CLIENT_SECRET,
    }),
  });
  if (!res.ok) throw new Error(`Token error: ${res.status}`);
  const data = await res.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: new Date(data.expires_at).getTime(),
  };
  return data.access_token;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { identifier } = await req.json();
    if (!identifier) {
      return new Response(JSON.stringify({ error: "identifier required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Buscar primeiro no banco (mais rápido)
    const { data: local } = await supabase
      .from("payment_intents")
      .select("*")
      .eq("identifier", identifier)
      .maybeSingle();

    if (local && local.status !== "pending") {
      return new Response(JSON.stringify({ payment: local }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Se ainda pending, consultar na SyncPay
    const token = await getSyncPayToken();
    const res = await fetch(`${SYNCPAY_BASE_URL}/api/partner/v1/transactions/${identifier}`, {
      headers: { "Authorization": `Bearer ${token}`, "Accept": "application/json" },
    });

    if (res.ok) {
      const remoteData = await res.json();
      const remoteStatus = remoteData?.status || remoteData?.data?.status;
      if (remoteStatus === "PAID" || remoteStatus === "paid") {
        // Atualizar no banco
        const { data: updated } = await supabase.rpc("update_payment_intent_status", {
          p_identifier: identifier,
          p_status: "paid",
          p_webhook_data: remoteData,
        });
        return new Response(JSON.stringify({ payment: updated }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ payment: local }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
